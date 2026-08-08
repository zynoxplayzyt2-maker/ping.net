import { Router, type IRouter, type Request, type Response } from "express";
import { db, lookupsTable } from "@workspace/db";
import { desc, eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

interface McSrvStatPlayer {
  name: string;
  uuid?: string;
}

interface McSrvStatResponse {
  online: boolean;
  ip?: string;
  port?: number;
  hostname?: string;
  debug?: { ping?: boolean };
  version?: string | { name?: string };
  protocol?: { version?: number; name?: string } | number;
  software?: string;
  players?: {
    online?: number;
    max?: number;
    list?: McSrvStatPlayer[];
  };
  motd?: { raw?: string[]; clean?: string[]; html?: string[] };
  icon?: string;
  plugins?:
    | ({ name: string; version?: string } | string)[]
    | { names?: string[]; raw?: string[] };
  mods?:
    | ({ name: string; version?: string } | string)[]
    | { names?: string[]; raw?: string[] };
  gamemode?: string;
  serverid?: string;
  eula_blocked?: boolean;
}

interface IpApiResponse {
  status: string;
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  org?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  query?: string;
}

const editionApi = (edition: string) =>
  edition === "bedrock"
    ? "https://api.mcsrvstat.us/bedrock/3/"
    : "https://api.mcsrvstat.us/3/";

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "PingNet/1.0 (Minecraft server lookup)" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalizePluginList(
  raw:
    | ({ name: string; version?: string } | string)[]
    | { names?: string[]; raw?: string[] }
    | undefined,
): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((p) => {
        if (typeof p === "string") return p;
        return p.version ? `${p.name} ${p.version}` : p.name;
      })
      .filter(Boolean);
  }
  if (raw.raw && raw.raw.length) return raw.raw.filter(Boolean);
  if (raw.names && raw.names.length) return raw.names.filter(Boolean);
  return [];
}

function extractVersion(v: McSrvStatResponse["version"]): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  return v.name;
}

function extractProtocol(
  p: McSrvStatResponse["protocol"],
): number | undefined {
  if (p == null) return undefined;
  if (typeof p === "number") return p;
  return p.version;
}

router.get("/server/:edition/:address", async (req: Request, res: Response) => {
  const editionParam = String(req.params.edition || "java").toLowerCase();
  const edition = editionParam === "bedrock" ? "bedrock" : "java";
  const address = String(req.params.address || "").trim();

  if (!address) {
    res.status(400).json({ error: "address is required" });
    return;
  }

  const apiUrl = editionApi(edition) + encodeURIComponent(address);
  const startedAt = Date.now();
  const data = await fetchJson<McSrvStatResponse>(apiUrl, 12000);
  const pingMs = Date.now() - startedAt;

  if (!data) {
    res.status(502).json({ error: "Upstream lookup failed" });
    return;
  }

  const host =
    data.hostname || address.split(":")[0] || address;
  const port =
    data.port ?? (edition === "bedrock" ? 19132 : 25565);
  const ip = data.ip;

  let location: Record<string, unknown> | undefined;
  if (ip) {
    const geo = await fetchJson<IpApiResponse>(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,isp,org,lat,lon,timezone,query`,
      6000,
    );
    if (geo && geo.status === "success") {
      location = {
        ip: geo.query,
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.regionName ?? geo.region,
        city: geo.city,
        isp: geo.isp,
        org: geo.org,
        lat: geo.lat,
        lon: geo.lon,
        timezone: geo.timezone,
      };
    }
  }

  const iconData = data.icon
    ? data.icon.startsWith("data:")
      ? data.icon
      : `data:image/png;base64,${data.icon}`
    : undefined;

  const result = {
    online: !!data.online,
    edition,
    host,
    port,
    ip,
    motd: data.motd?.clean ?? [],
    motdHtml: data.motd?.html ?? [],
    version: extractVersion(data.version),
    software: data.software,
    protocol: extractProtocol(data.protocol),
    pingMs,
    playersOnline: data.players?.online,
    playersMax: data.players?.max,
    playersSample: (data.players?.list ?? []).map((p) => ({
      name: p.name,
      id: p.uuid,
    })),
    plugins: normalizePluginList(data.plugins),
    mods: normalizePluginList(data.mods),
    iconBase64: iconData,
    gamemode: data.gamemode,
    serverId: data.serverid,
    location,
    eulaBlocked: data.eula_blocked,
  };

  // Save to history (fire and forget). Use canonical address host:port.
  const canonical = `${host}:${port}`;
  db.insert(lookupsTable)
    .values({
      edition,
      address: canonical,
      online: result.online,
      playersOnline: result.playersOnline ?? null,
      playersMax: result.playersMax ?? null,
      version: result.version ?? null,
      country: (location?.country as string | undefined) ?? null,
      countryCode: (location?.countryCode as string | undefined) ?? null,
      iconBase64: iconData ?? null,
    })
    .catch((err) => {
      req.log.error({ err }, "failed to insert lookup history");
    });

  res.json(result);
});

router.get("/history", async (_req: Request, res: Response) => {
  // Return last 12 lookups, deduped by (edition, address) keeping the newest.
  const rows = await db
    .select()
    .from(lookupsTable)
    .orderBy(desc(lookupsTable.lookedUpAt))
    .limit(60);

  const seen = new Set<string>();
  const out: typeof rows = [];
  for (const r of rows) {
    const key = `${r.edition}|${r.address}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= 12) break;
  }

  res.json(
    out.map((r) => ({
      id: r.id,
      edition: r.edition,
      address: r.address,
      online: r.online,
      playersOnline: r.playersOnline ?? undefined,
      playersMax: r.playersMax ?? undefined,
      version: r.version ?? undefined,
      country: r.country ?? undefined,
      countryCode: r.countryCode ?? undefined,
      iconBase64: r.iconBase64 ?? undefined,
      lookedUpAt: r.lookedUpAt.toISOString(),
    })),
  );
});

router.get("/popular", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      edition: lookupsTable.edition,
      address: lookupsTable.address,
      lookups: sql<number>`count(*)::int`,
    })
    .from(lookupsTable)
    .groupBy(lookupsTable.edition, lookupsTable.address)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const last = await db
        .select()
        .from(lookupsTable)
        .where(
          and(
            eq(lookupsTable.edition, r.edition),
            eq(lookupsTable.address, r.address),
          ),
        )
        .orderBy(desc(lookupsTable.lookedUpAt))
        .limit(1);
      const l = last[0];
      return {
        edition: r.edition,
        address: r.address,
        lookups: r.lookups,
        lastOnline: l?.online ?? undefined,
        lastPlayersOnline: l?.playersOnline ?? undefined,
        lastPlayersMax: l?.playersMax ?? undefined,
        version: l?.version ?? undefined,
        country: l?.country ?? undefined,
        countryCode: l?.countryCode ?? undefined,
        iconBase64: l?.iconBase64 ?? undefined,
      };
    }),
  );

  res.json(enriched);
});

export default router;
