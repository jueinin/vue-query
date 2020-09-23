import { Ref } from "vue-demi";
export type PrimitiveType = string | number | boolean | null | undefined | bigint | symbol;
export type PlainQueryKey = PrimitiveType | object | any[];
export type QueryKey = Ref<PlainQueryKey> | PlainQueryKey;
export type ArrayQueryKey = Ref<PlainQueryKey[]>;
export type CancelablePromise<Value> = Promise<Value> & { cancel?: () => void };
export type QueryFn<PlainKey, Value> = (...args: PlainKey extends Array<any> ? PlainKey : [PlainKey]) => CancelablePromise<Value>;
export type PlainBaseQueryConfig<TResult = any, TError = any> = {
    retry?: false | number | ((retryCount: number, error: TError) => boolean);
    retryDelay?: (failCount: number) => number;
    initialData?: TResult | (() => TResult);
    cacheTime?: number;
    enabled?: boolean;
    onSuccess?: (data: TResult) => void;
    onError?: (error: TError) => void;
    staleTime?: number;
    refetchOnReconnect?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number | false;
    refetchIntervalInBackground?: boolean;
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
    error: Error | undefined;
    isError: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    status: QueryStatus;
    retryCount: number;
    isFetching: boolean;
    reFetch: (options?: ReFetchOptions) => void;
    cancel: () => void;
};
export type MutationResult<Data, Error, Variable> = {
    data: Data | undefined;
    error: Error | undefined;
    isError: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    status: QueryStatus;
    cancel: () => void;
    reset: () => void;
    mutate: (variable: Variable, config?: PlainMutationConfig<Variable, Data, Error>) => CancelablePromise<Data>;
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

export type PlainMutationConfig<Variable, Data, Error> = {
    onMutate?: (variable: Variable) => void;
    onSuccess?: (data: Data, variable: Variable) => void;
    onError?: (error: Error, variable: Variable) => void;
    onSettled?: (data: Data | undefined, error: Error | undefined, variable: Variable) => void;
};
