import { reactive, Ref, watch, computed, onUnmounted } from "vue-demi";
import { CancelablePromise, PlainBaseQueryConfig, PlainQueryKey, QueryFn, QueryResult, QueryStatus, ReFetchOptions } from "./types";
import { defaultConfig, defaultReFetchOptions } from "./config";
import { createHash, delay, useMountAndUnmount } from "../utils";
import { queryCache } from "./queryCache";
import { queryManager } from "./queryManager";
class Query<Data, Error, PlainKey extends PlainQueryKey> {
    state = reactive({
        hash: "",
    });
    // refetch interval num
    clearIntervalNum: number | undefined;
    result = reactive<QueryResult>({
        isLoading: false,
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        status: QueryStatus.Idle,
        retryCount: 0,
        reFetch: () => {},
        isFetching: false,
        cancel: () => {
            console.error("your query function should return a promise with cancel property");
        },
    });
    init = () => {
        watch(
            [this.queryKey, computed(() => ({ enabled: this.config.value.enabled, refetchInterval: this.config.value.refetchInterval }))],
            () => {
                this.state.hash = createHash(this.queryKey.value);
                this.exec();
            },
            { immediate: true }
        );
        useMountAndUnmount(() => {
            // add listener to refetch
            const handler = () => this.exec();
            if (this.config.value.refetchOnReconnect) {
                window.addEventListener("online", handler, false);
            }
            if (this.config.value.refetchOnWindowFocus) {
                window.addEventListener("visibilitychange", handler, false);
                window.addEventListener("focus", handler, false);
            }
            return () => {
                if (this.config.value.refetchOnReconnect) {
                    window.removeEventListener("online", handler);
                }
                if (this.config.value.refetchOnWindowFocus) {
                    window.removeEventListener("focus", handler);
                    window.removeEventListener("visibilitychange", handler);
                }
            };
        });
        onUnmounted(() => {
            this.destroyself();
        });
    };
    constructor(public queryKey: Ref<PlainQueryKey>, public queryFn: QueryFn<PlainKey, Data>, public config: Ref<Required<PlainBaseQueryConfig>>) {
        this.result.reFetch = this.refetch;
    }

    setQueryData = (data: Data) => {
        this.result.data = data;
        queryCache.updateCache(this.queryKey.value, data);
    };
    exec = () => {
        if (!this.config.value.enabled) {
            return;
        }
        const shouldHandleInitialData: boolean = this.config.value.initialData !== undefined;
        if (shouldHandleInitialData && !queryCache.hasCache(this.queryKey.value)) {
            this.handleInitialData();
        }
        if (queryCache.hasCache(this.queryKey.value)) {
            const cacheValue = queryCache.getCache(this.queryKey.value)!;
            if (cacheValue.getIsStaled()) {
                this.setSuccessStatus(cacheValue.data);
            } else {
                this.setSuccessStatus(cacheValue.data);
                return;
            }
        }
        if (!queryCache.hasCache(this.queryKey.value)) {
            this.setLoadingStatus();
        }
        const promise = this.fetch();
        this.handleRefetchInterval();
        return promise;
    };

    setSuccessStatus = (data: Data) => {
        this.result.data = data;
        this.result.isSuccess = true;
        this.result.status = QueryStatus.Success;
        this.result.isLoading = false;
        this.config.value.onSuccess(data);
    };
    setErrorStatus = (error: Error) => {
        this.result.error = error;
        this.result.isError = true;
        this.result.isLoading = false;
        this.result.status = QueryStatus.Error;
        this.config.value.onError(error);
    };
    setLoadingStatus = () => {
        this.result.isLoading = true;
        this.result.status = QueryStatus.Loading;
        this.result.data = undefined;
        this.result.error = undefined;
        this.result.isSuccess = false;
        this.result.isError = false;
    };
    refetch = (options?: ReFetchOptions) => {
        const opt = Object.assign({}, defaultReFetchOptions, options) as Required<ReFetchOptions>;
        if (!opt.force) {
            return this.exec();
        } else {
            return this.fetch();
        }
    };
    getShouldRetry = (error: Error) => {
        const maxRetryCount: number =
            this.config.value.retry === false
                ? 0
                : typeof this.config.value.retry === "number"
                ? this.config.value.retry
                : (defaultConfig.retry as number);
        let shouldRetryByRetryFn: boolean | undefined = undefined;
        if (typeof this.config.value.retry === "function") {
            shouldRetryByRetryFn = this.config.value.retry(this.result.retryCount, error);
        }
        return shouldRetryByRetryFn === true || (shouldRetryByRetryFn === undefined && this.result.retryCount < maxRetryCount);
    };
    retry = () => {
        const retryDelay: number = this.config.value.retryDelay(this.result.retryCount);
        this.result.retryCount++;
        delay(retryDelay).then(() => {
            this.setLoadingStatus();
            this.fetch();
        });
    };
    fetch = () => {
        this.result.isFetching = true;
        let promise: CancelablePromise<Data>;
        this.config.value.onMutate();
        if (Array.isArray(this.queryKey.value)) {
            // @ts-ignore
            promise = this.queryFn(...this.queryKey.value);
        } else {
            // @ts-ignore
            promise = this.queryFn(this.queryKey.value);
        }
        if (typeof promise.cancel === "function") {
            this.result.cancel = promise.cancel;
        }
        return promise
            .then((value) => {
                this.setSuccessStatus(value);
                queryCache.addToCache({
                    queryKey: this.queryKey.value,
                    data: value,
                    cacheTime: this.config.value.cacheTime,
                    staleTime: this.config.value.staleTime,
                });
                // handle cache
                return value;
            })
            .catch((error) => {
                this.setErrorStatus(error);
                if (this.getShouldRetry(error)) {
                    this.retry();
                }
                return error;
            })
            .finally(() => {
                this.result.isFetching = false;
                this.config.value.onSettled(this.result.data, this.result.error);
            });
    };
    handleInitialData = () => {
        const initialData: Data =
            typeof this.config.value.initialData === "function" ? this.config.value.initialData() : this.config.value.initialData;
        this.result.data = initialData;
        queryCache.addToCache({
            queryKey: this.queryKey.value,
            data: initialData,
            cacheTime: this.config.value.cacheTime,
            staleTime: this.config.value.staleTime,
        });
    };
    handleRefetchInterval = () => {
        clearInterval(this.clearIntervalNum);
        let shouldRefetch: boolean;
        if (this.config.value.refetchIntervalInBackground) {
            shouldRefetch = true;
        } else {
            shouldRefetch = !document.hidden;
        }
        if (this.config.value.refetchInterval !== false) {
            this.clearIntervalNum = setInterval(() => {
                shouldRefetch && this.fetch();
            }, this.config.value.refetchInterval);
        }
    };
    destroyself = () => {
        queryManager.removeQuery(this);
    };
}
export { Query };
