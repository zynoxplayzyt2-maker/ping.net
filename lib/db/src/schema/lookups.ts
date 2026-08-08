import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const lookupsTable = pgTable(
  "lookups",
  {
    id: serial("id").primaryKey(),
    edition: text("edition").notNull(),
    address: text("address").notNull(),
    online: boolean("online").notNull(),
    playersOnline: integer("players_online"),
    playersMax: integer("players_max"),
    version: text("version"),
    country: text("country"),
    countryCode: text("country_code"),
    iconBase64: text("icon_base64"),
    lookedUpAt: timestamp("looked_up_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    addrIdx: index("lookups_addr_idx").on(t.edition, t.address),
    timeIdx: index("lookups_time_idx").on(t.lookedUpAt),
  }),
);

export type Lookup = typeof lookupsTable.$inferSelect;
export type InsertLookup = typeof lookupsTable.$inferInsert;
