import { Ref } from 'vue';
export type PlainQueryKey = string
    | number
    | boolean
    | object
    | null
    | undefined
    | any[]
export type QueryKey = Ref<PlainQueryKey> | PlainQueryKey
export type ArrayQueryKey = Ref<PlainQueryKey[]>;
export type QueryFn = <Parameter extends Array<any>,Value=unknown>(...args: Parameter)=> Promise<Value>
export type PlainBaseQueryConfig<TResult=any, TError = any> = {
    retry?: false | number | ((retryCount: number, error: TError) => boolean),
    retryDelay?: (failCount: number) => number
    initialData?: TResult | (() => TResult),
    cacheTime?: number;
    enabled?: boolean;
    onSuccess?: (data: TResult)=>void
    onError?: (error: TError) => void,
    staleTime?: number;
};
export type BaseQueryConfigRef<TResult,TError> = Ref<PlainBaseQueryConfig<TResult,TError>>
export type BaseQueryConfig<TResult,TError> = BaseQueryConfigRef<TResult, TError> | PlainBaseQueryConfig<TResult,TError>


export enum QueryStatus {
    Loading = "loading",
    Error = 'error',
    Success = 'success',
    Idle="idle"
}
export type ReFetchOptions = {
    /**
     * @description when force is true, reFetch will ignore stale time, request again immediately
     */
    force?: boolean
}
export type QueryResult<Result=any,Error=any> = {
    data: Result| undefined,
    error: Result | undefined
    isError: boolean,
    isLoading: boolean,
    isSuccess: boolean;
    status: QueryStatus,
    retryCount: number,
    isFetching: boolean;
    reFetch: (options?: ReFetchOptions)=> void
}
export type UseQueryObjectConfig<Result=any,Error=any> = {
    queryKey: QueryKey,
    queryFn: QueryFn,
    config?: BaseQueryConfig<Result, Error>
}

export enum CacheStaleStatus {
    staled = "staled",
    notStaled = "notStaled",
}
