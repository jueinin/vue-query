import {
    PlainBaseQueryConfig,
    CacheStaleStatus,
    QueryFn,
    QueryKey,
    QueryResult,
    QueryStatus,
    ReFetchOptions,
    PlainQueryKey,
    UseQueryObjectConfig, BaseQueryConfig, ToArray,
} from "@/query/core/types";
import {delay, getQueryArgs, getValueFromRefOrNot, noop} from "@/query/utils";
import { reactive, watch, isRef, computed, Ref } from "vue";
import { CacheValue, queryCache } from "@/query/core/queryCache";
import {defaultConfig, defaultReFetchOptions} from "@/query/core/config";
import {queryGlobal} from "@/query/core/queryGlobal";

/**
 *
 * @param queryKey it must be a ref value,because we can not watch a normal value
 * @param fn
 */
export function useQuery<PlainKey extends PlainQueryKey,TResult, TError>(queryKey: PlainKey | Ref<PlainKey>, fn: QueryFn<PlainKey,TResult>): QueryResult<TResult, TError>;
export function useQuery<PlainKey extends PlainQueryKey,TResult, TError>(queryKey: PlainKey | Ref<PlainKey>, fn: QueryFn<PlainKey,TResult>, config: BaseQueryConfig<TResult, TError>): QueryResult<TResult, TError>;
export function useQuery<PlainKey extends PlainQueryKey,TResult, TError>(queryObject: UseQueryObjectConfig<PlainKey,TResult, TError>): QueryResult<TResult, TError>;
export function useQuery<PlainKey extends PlainQueryKey,TResult, TError>(...args: any): QueryResult<TResult, TError> {
    const [queryKey, queryFn, config] = getQueryArgs<PlainKey,TResult>(...args);
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
        cancel: noop
    });
    /**
     * @description when it's 1, which means first exec
     */
    let execTimes = 0;
    function exec(newValue: readonly [PlainQueryKey, { enabled: boolean }]) {
        if (!config.value.enabled) {
            return;
        }
        execTimes++;
        result.reFetch = reFetch;
        const shouldHandleInitialData: boolean = config.value.initialData !== undefined && execTimes === 1;
        const queryKeyStr: string = JSON.stringify(newValue[0] ?? "");
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
            config.value.onSuccess(data);
        }

        function setErrorStatus(error: TError) {
            result.error = error;
            result.isError = true;
            result.status = QueryStatus.Error;
            result.isLoading = false;
            config.value.onError(error);
        }

        function handleInitialData() {
            const initialData: TResult = typeof config.value.initialData === "function" ? config.value.initialData() : config.value.initialData;
            setSuccessStatus(initialData);
        }

        function getCacheStaleStatus(cache: CacheValue): CacheStaleStatus {
            return Date.now() - cache.storeTime < config.value.staleTime ? CacheStaleStatus.notStaled : CacheStaleStatus.staled;
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
            const maxRetryCount: number = config.value.retry === false ? 0 : typeof config.value.retry === "number" ? config.value.retry : defaultConfig.retry as number;
            let shouldRetryByRetryFn: boolean | undefined = undefined;
            if (typeof config.value.retry === "function") {
                shouldRetryByRetryFn = config.value.retry(result.retryCount, error);
            }
            return shouldRetryByRetryFn === true || (shouldRetryByRetryFn === undefined && result.retryCount < maxRetryCount);
        };
        const retry = (error: TError) => {
            const retryDelay = config.value.retryDelay(result.retryCount);
            if (typeof config.value.retry !== "function") {
                result.retryCount++;
            }
            delay(retryDelay).then(() => exec(newValue));
            setErrorStatus(error);
        };
        function fetch() {
            result.isFetching = true;
            queryGlobal.addIsFetching()
            let promise: Promise<TResult> & {cancel?: QueryResult["cancel"]};
            if (Array.isArray(queryKey.value)) {
                // 我需要断言PlainQueryKey是any[]类型才行
                // @ts-ignore
                promise = queryFn(...queryKey.value);
            } else {
                // @ts-ignore
                promise = queryFn(queryKey.value);
            }
            if (typeof promise.cancel === "function") {
                result.cancel = promise.cancel;
            }
            promise
                .then((value) => {
                    setSuccessStatus(value);
                    queryCache.addToCache(queryKeyStr, { storeTime: Date.now(), data: value }, config.value.cacheTime);
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
                    queryGlobal.removeIsFetching()
                });
        }
    }
    watch(
        [queryKey,computed(()=>({enabled: config.value.enabled}))] as const,
        function (newValue) {
            exec(newValue);
        },
        { immediate: true }
    );
    return result;
}
