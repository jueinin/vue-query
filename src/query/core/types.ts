import { Ref } from "vue";
export type PrimitiveType = string | number | boolean  | null | undefined | bigint | symbol
export type PlainQueryKey = PrimitiveType | object | any[];
export type QueryKey = Ref<PlainQueryKey> | PlainQueryKey;
export type ArrayQueryKey = Ref<PlainQueryKey[]>;
export type QueryFn<PlainKey, Value> = (...args: PlainKey extends Array<any> ? PlainKey : [PlainKey]) => Promise<Value>;
export type PlainBaseQueryConfig<TResult = any, TError = any> = {
    retry?: false | number | ((retryCount: number, error: TError) => boolean);
    retryDelay?: (failCount: number) => number;
    initialData?: TResult | (() => TResult);
    cacheTime?: number;
    enabled?: boolean;
    onSuccess?: (data: TResult) => void;
    onError?: (error: TError) => void;
    staleTime?: number;
};
export type BaseQueryConfigRef<TResult, TError> = Ref<PlainBaseQueryConfig<TResult, TError>>;
export type BaseQueryConfig<TResult, TError> = BaseQueryConfigRef<TResult, TError> | PlainBaseQueryConfig<TResult, TError>;

export enum QueryStatus {
    Loading = "loading",
    Error = "error",
    Success = "success",
    Idle = "idle",
}
export type ReFetchOptions = {
    /**
     * @description when force is true, reFetch will ignore stale time, request again immediately
     */
    force?: boolean;
};
export type QueryResult<Result = any, Error = any> = {
    data: Result | undefined;
    error: Result | undefined;
    isError: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    status: QueryStatus;
    retryCount: number;
    isFetching: boolean;
    reFetch: (options?: ReFetchOptions) => void;
    cancel: () => void;
};
export type UseQueryObjectConfig<PlainKey extends PlainQueryKey, Result = any, Error = any> = {
    queryKey: PlainKey | Ref<PlainKey>;
    queryFn: QueryFn<PlainKey, Result>;
    config?: BaseQueryConfig<Result, Error>;
};

export enum CacheStaleStatus {
    staled = "staled",
    notStaled = "notStaled",
}

export type ToArray<T> = T extends Array<any> ? T : [T];
type A = ToArray<any[]>;
