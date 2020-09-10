import {
    BaseQueryConfig,
    CacheStaleStatus,
    QueryFn,
    QueryKey,
    QueryResult,
    QueryStatus,
    ReFetchOptions,
    TempQueryKey,
    UseQueryObjectConfig,
} from "@/query/core/types";
import { delay, getQueryArgs, noop } from "@/query/utils";
import { reactive, watch } from "vue";
import { CacheValue, queryCache } from "@/query/core/queryCache";
import { defaultReFetchOptions } from "@/query/core/config";

/**
 *
 * @param queryKey it must be a ref value,because we can not watch a normal value
 * @param fn
 */
export function useQuery<TResult, TError>(queryKey: QueryKey, fn: QueryFn): QueryResult<TResult, TError>;
export function useQuery<TResult, TError>(queryKey: QueryKey, fn: QueryFn, config: BaseQueryConfig<TResult, TError>): QueryResult<TResult, TError>;
export function useQuery<TResult, TError>(queryObject: UseQueryObjectConfig<TResult, TError>): QueryResult<TResult, TError>;
export function useQuery<TResult, TError>(...args: any): QueryResult<TResult, TError> {
    const [queryKey, queryFn, config] = getQueryArgs(...args);
    // the config has merged default config
    const result = reactive<QueryResult>({
        isLoading: false,
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        status: QueryStatus.Idle,
        retryCount: 0,
        reFetch: noop,
        isFetching: false,
    });
    /**
     * @description when it's 1, which means first exec
     */
    let execTimes = 0;
    function exec(newValue: TempQueryKey) {
        if (!config.enabled) {
            return;
        }
        execTimes++;
        result.reFetch = reFetch;
        const shouldHandleInitialData: boolean = config.initialData !== undefined && execTimes === 1;
        const queryKeyStr: string = JSON.stringify(newValue);
        const cache: CacheValue | undefined = queryCache.getCache<TResult>(queryKeyStr);
        const hasCache: boolean = cache !== undefined;
        if (shouldHandleInitialData) {
            handleInitialData();
            return;
        }
        if (hasCache) {
            if (getCacheStaleStatus(cache!) === CacheStaleStatus.notStaled) {
                setSuccessStatus(cache!.data);
                return;
            } else {
                setSuccessStatus(cache!.data);
            }
        }
        setLoading(cache);
        fetch();

        function setSuccessStatus(data: TResult) {
            result.data = data;
            result.isSuccess = true;
            result.status = QueryStatus.Success;
            result.isLoading = false;
            config.onSuccess(data);
        }

        function setErrorStatus(error: TError) {
            result.error = error;
            result.isError = true;
            result.status = QueryStatus.Error;
            result.isLoading = false;
            config.onError(error);
        }

        function handleInitialData() {
            const initialData: TResult = typeof config.initialData === "function" ? config.initialData() : config.initialData;
            setSuccessStatus(initialData);
        }

        function getCacheStaleStatus(cache: CacheValue): CacheStaleStatus {
            return Date.now() - cache.storeTime < config.staleTime ? CacheStaleStatus.notStaled : CacheStaleStatus.staled;
        }

        function setLoading(cache: CacheValue | undefined) {
            if (!cache) {
                result.isLoading = true;
            }
        }

        function reFetch(options: ReFetchOptions | undefined) {
            options = Object.assign({}, defaultReFetchOptions, options) as Required<ReFetchOptions>;
            if (!options.force) {
                exec(newValue);
            } else {
                fetch();
            }
        }

        /**
         * @description when a function is passed to retry,we should ignore retryCount
         * @param error
         */
        const getShouldRetry = (error: TError) => {
            const maxRetryCount: number = config.retry === false ? 0 : (config.retry as number);
            let shouldRetryByRetryFn: boolean | undefined = undefined;
            if (typeof config.retry === "function") {
                shouldRetryByRetryFn = config.retry(result.retryCount, error);
            }
            return shouldRetryByRetryFn === true || (shouldRetryByRetryFn === undefined && result.retryCount < maxRetryCount);
        };
        const retry = (error: TError) => {
            const retryDelay = config.retryDelay(result.retryCount);
            if (typeof config.retry !== "function") {
                result.retryCount++;
            }
            delay(retryDelay).then(() => exec(newValue));
            setErrorStatus(error);
        };
        function fetch() {
            result.isFetching = true;
            let promise: Promise<TResult>;
            if (Array.isArray(queryKey.value)) {
                promise = queryFn(...queryKey.value);
            } else {
                promise = queryFn(queryKey.value);
            }
            promise
                .then((value) => {
                    setSuccessStatus(value);
                    queryCache.addToCache(queryKeyStr, { storeTime: Date.now(), data: value }, config.cacheTime);
                    return value;
                })
                .catch((error) => {
                    if (getShouldRetry(error)) {
                        retry(error);
                    }
                    setErrorStatus(error);
                    return error;
                })
                .finally(() => {
                    result.isFetching = false;
                });
        }
    }
    watch(
        queryKey,
        function (newValue) {
            exec(newValue);
        },
        { immediate: true }
    );
    return result;
}
