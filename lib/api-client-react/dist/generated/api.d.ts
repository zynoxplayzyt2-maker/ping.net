import type { QueryKey, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { HealthStatus, HistoryEntry, PopularEntry, ServerLookup } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns ping, MOTD, players, plugins, version, software, icon and geo location for a Minecraft server (Java or Bedrock).
 * @summary Look up a Minecraft server
 */
export declare const getLookupServerUrl: (edition: "java" | "bedrock", address: string) => string;
export declare const lookupServer: (edition: "java" | "bedrock", address: string, options?: RequestInit) => Promise<ServerLookup>;
export declare const getLookupServerQueryKey: (edition: "java" | "bedrock", address: string) => readonly [`/api/server/java/${string}` | `/api/server/bedrock/${string}`];
export declare const getLookupServerQueryOptions: <TData = Awaited<ReturnType<typeof lookupServer>>, TError = ErrorType<unknown>>(edition: "java" | "bedrock", address: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof lookupServer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof lookupServer>>, TError, TData> & {
    queryKey: QueryKey;
};
export type LookupServerQueryResult = NonNullable<Awaited<ReturnType<typeof lookupServer>>>;
export type LookupServerQueryError = ErrorType<unknown>;
/**
 * @summary Look up a Minecraft server
 */
export declare function useLookupServer<TData = Awaited<ReturnType<typeof lookupServer>>, TError = ErrorType<unknown>>(edition: "java" | "bedrock", address: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof lookupServer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns the most recent server lookups performed by users.
 * @summary Recent server lookups
 */
export declare const getListHistoryUrl: () => string;
export declare const listHistory: (options?: RequestInit) => Promise<HistoryEntry[]>;
export declare const getListHistoryQueryKey: () => readonly ["/api/history"];
export declare const getListHistoryQueryOptions: <TData = Awaited<ReturnType<typeof listHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof listHistory>>>;
export type ListHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Recent server lookups
 */
export declare function useListHistory<TData = Awaited<ReturnType<typeof listHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns the most frequently looked-up Minecraft servers.
 * @summary Most-looked-up servers
 */
export declare const getListPopularUrl: () => string;
export declare const listPopular: (options?: RequestInit) => Promise<PopularEntry[]>;
export declare const getListPopularQueryKey: () => readonly ["/api/popular"];
export declare const getListPopularQueryOptions: <TData = Awaited<ReturnType<typeof listPopular>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPopular>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPopular>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPopularQueryResult = NonNullable<Awaited<ReturnType<typeof listPopular>>>;
export type ListPopularQueryError = ErrorType<unknown>;
/**
 * @summary Most-looked-up servers
 */
export declare function useListPopular<TData = Awaited<ReturnType<typeof listPopular>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPopular>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map