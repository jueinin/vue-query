import { renderHook } from "../../../../tests/utils";
import { useQuery } from "../useQuery";
import { ref, reactive, computed } from "vue-demi";
import { CancelablePromise, QueryStatus } from "../../core/types";
import flushPromises from "flush-promises/index";
import { queryCache } from "../../core/queryCache";
import { defaultConfig, defaultRetryDelay } from "../../core/config";
jest.useFakeTimers();
beforeEach(() => {
    queryCache.clear();
});
describe("useQuery", () => {
    it("when passed a plain value(not a ref) as queryKey, it should works too", async function () {
        const fn = jest.fn().mockRejectedValue("ddd");
        const hook = renderHook(() => {
            return { query: useQuery(["/api/", 2], fn) };
        });
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(2000);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(2);
    });
    it("when queryKey ref changed,queryFn need execute again", async function () {
        const fn = jest.fn().mockResolvedValue("dd");
        const str = "/api/test";
        const hook = renderHook(() => {
            const state = reactive({
                page: 0,
            });
            // best practise for construct custom reactive value is to use computed
            const query = useQuery(
                computed(() => [str, state.page]),
                fn,
                { staleTime: 0 }
            );
            const add = () => state.page++;
            return { add };
        });
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
        await hook.vm.add();
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(2);
        await hook.vm.add();
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(3);
        await hook.vm.add();
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(4);
        expect(fn.mock.calls).toEqual([
            [str, 0],
            [str, 1],
            [str, 2],
            [str, 3],
        ]);
    });
    it("should get data", async function () {
        const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => ({ query: useQuery(ref("key"), fn) }));
        const query = hook.vm.query;
        expect(query).toEqual(
            expect.objectContaining({
                data: undefined,
                error: undefined,
                isSuccess: false,
                isError: false,
                status: QueryStatus.Loading,
                isLoading: true,
            })
        );
        await flushPromises();
        expect(query).toEqual(
            expect.objectContaining({
                data: "dd",
                error: undefined,
                isSuccess: true,
                isError: false,
                isLoading: false,
                status: QueryStatus.Success,
            })
        );
    });
    it("should get error information", async function () {
        const fn = jest.fn().mockRejectedValue("dd");
        const hook = renderHook(() => ({ query: useQuery(ref("key"), fn) }));
        const query = hook.vm.query;
        expect(query).toEqual(
            expect.objectContaining({
                data: undefined,
                error: undefined,
                isSuccess: false,
                isError: false,
                status: QueryStatus.Loading,
                isLoading: true,
            })
        );
        await flushPromises();
        expect(query).toEqual(
            expect.objectContaining({
                data: undefined,
                error: "dd",
                isSuccess: false,
                isError: true,
                isLoading: false,
                status: QueryStatus.Error,
            })
        );
    });
    test("all callbacks should work",async ()=> {
        const fn = jest.fn().mockResolvedValue('data')
        const onMutate = jest.fn();
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const onSettled = jest.fn();
        const hook = renderHook(() => {
            const query = useQuery("key", fn, {
                onMutate,
                onError,
                onSuccess,
                onSettled
            });
            return {query}
        });
        expect(onMutate).toHaveBeenCalledTimes(1);
        await flushPromises();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSettled).toHaveBeenCalledTimes(1);
        fn.mockRejectedValue("err");
        hook.vm.query.reFetch();
        await flushPromises();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onSettled).toHaveBeenCalledTimes(2);
    })
    describe("retry", () => {
        it("default retry 3 times", async () => {
            // 每次遇见请求必须用flush promise 把resolved的promise让他执行掉，
            const fn = jest.fn().mockRejectedValue("dd");
            const hook = renderHook(() => ({ query: useQuery(ref("key"), fn) }));
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(2000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(2);
            jest.advanceTimersByTime(4000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(3);
            jest.advanceTimersByTime(8000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(4);
        });
        it("can retry multiple times", async function () {
            const fn = jest.fn().mockRejectedValue("dd");
            const hook = renderHook(() => ({ query: useQuery(ref("key"), fn, { retry: 2 }) }));
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(2000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(2);
            jest.advanceTimersByTime(4000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(3);
            jest.advanceTimersByTime(8000);
            await flushPromises();
            // 时间再往后拉也只是3了，不会再重试
            expect(fn).toHaveBeenCalledTimes(3);
        });
        it("can disable retry", async function () {
            const fn = jest.fn().mockRejectedValue("dd");
            const hook = renderHook(() => ({ query: useQuery(ref("key"), fn, { retry: false }) }));
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(2000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("before retry,it should be error status", async function () {
            const fn = jest.fn().mockRejectedValue("dd");
            const hook = renderHook(() => ({ query: useQuery(ref("key"), fn) }));
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(1000);
            // pending to reFetch,it should be error status
            expect(hook.vm.query).toEqual(
                expect.objectContaining({
                    isError: true,
                    isLoading: false,
                    error: "dd",
                })
            );
            jest.advanceTimersByTime(1000);
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(2);
        });
        it("when it is retrying, it should be loading status, and unset error status", async function () {
            const fn = jest.fn(
                () =>
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject("err");
                        }, 2000);
                    })
            );
            const hook = renderHook(() => ({ query: useQuery("key", fn) }));
            jest.advanceTimersByTime(2000);
            await flushPromises();
            const query = hook.vm.query;
            expect(query.error).toEqual("err");
            jest.advanceTimersByTime(defaultRetryDelay(1));
            await flushPromises();
            // begin refetch
            expect(query.error).toBeFalsy();
            expect(query.isLoading).toBeTruthy();
            expect(query.status).toEqual(QueryStatus.Loading);
            jest.advanceTimersByTime(2000);
            await flushPromises();
            expect(query.error).toEqual("err");
            expect(query.isLoading).toBeFalsy();
        });
    });
    it("when disable, it should not request", async function () {
        const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => {
            const key = ref("key");
            return { query: useQuery(key, fn, { enabled: false }), changeKey: () => (key.value = key.value + "dd") };
        });
        await flushPromises();
        expect(fn).not.toHaveBeenCalled();
        hook.vm.changeKey();
        await flushPromises();
        expect(fn).not.toHaveBeenCalled();
    });
    it("should refetch again when we disable and enable ,disable and enable", async function () {
        const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => {
            const config = ref({ enabled: false });
            const toggleEnable = () => (config.value.enabled = !config.value.enabled);
            const query = useQuery("key", fn, config);
            return { query, toggleEnable, config };
        });
        await flushPromises();
        expect(fn).not.toHaveBeenCalled();
        await hook.vm.toggleEnable(); // enable
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
        await hook.vm.toggleEnable(); // disable
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
        await hook.vm.toggleEnable(); // enable
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(2);
    });
    it("initial data： when initial data is set, and query cache have not the corresponding data with queryKey. add initial data as cache", async function () {
        // expect(2).toEqual(3)
        /*const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => {
            const key = ref("key");
            return { query: useQuery(key, fn, { initialData: "66" }), changeKey: () => (key.value = key.value + "dd") };
        });
        await flushPromises();
        expect(fn).not.toHaveBeenCalled();
        expect(hook.vm.query).toEqual(
            expect.objectContaining({
                data: "66",
                isLoading: false,
                retryCount: 0,
                isSuccess: true,
            })
        );
        expect(queryCache.getCache("key")).toBeUndefined();
        // execute request again
        await hook.vm.changeKey();
        // it should be loading, we won't cache initial data
        expect(hook.vm.query.isLoading).toBeTruthy();
        await flushPromises();
        expect(hook.vm.query.data).toEqual("dd");*/
    });
    describe("cache and stale", () => {
        /**
         * @description stale time normally is set to 0，which means the cache will stale immediately，cache time default is 5 minutes
         */
        it("default cache time is 5 minutes ", async function () {
            const fn = jest.fn().mockResolvedValue("dd");
            const addToCacheSpy = jest.spyOn(queryCache, "addToCache");
            const hook = renderHook(() => ({ query: useQuery(ref("key"), fn) }));
            await flushPromises();
            expect(addToCacheSpy).toHaveBeenCalledTimes(1);
            expect(addToCacheSpy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    data: "dd",
                    queryKey: "key",
                })
            );
            expect(queryCache.getCache("key")).toEqual(
                expect.objectContaining({
                    data: "dd",
                    storeTime: expect.any(Number),
                })
            );
            jest.advanceTimersByTime(defaultConfig.cacheTime);
            expect(queryCache.getCache("key")).toEqual(undefined);
        });
        it("default stale time is 0, which means we always used cached value and request to fresh value immediately", async function () {
            const fn = jest.fn().mockResolvedValue("dd");
            const hook = renderHook(() => {
                const key = ref("key");
                return { query: useQuery(key, fn), changeKey: () => (key.value = key.value + "dd") };
            });
            const query = hook.vm.query;
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
            expect(query.data).toEqual("dd");
            queryCache.updateCache("key", "dd2");
            hook.vm.query.reFetch();
            expect(hook.vm.query.data).toEqual("dd2");
            await flushPromises();
            expect(query.data).toEqual("dd");
        });
        it("when stale time is set,if cache is staled,refetch to server, otherwise set success status and set data with cached value", async function () {
            const fn = jest.fn().mockResolvedValue("dd");
            const dateNow = jest.spyOn(Date, "now").mockReturnValue(0);
            const hook = renderHook(() => {
                const key = ref("key");
                return { query: useQuery(key, fn, { staleTime: 500 }) };
            });
            const query = hook.vm.query;
            await flushPromises();
            expect(fn).toHaveBeenCalledTimes(1);
            expect(dateNow).toHaveBeenCalledTimes(1);
            expect(query.data).toEqual("dd");
            hook.vm.query.reFetch();
            expect(hook.vm.query.data).toEqual("dd");
            await flushPromises();
            // cache is not staled, so we will never request,return cache instead
            expect(fn).toHaveBeenCalledTimes(1);
            expect(query.data).toEqual("dd");
            dateNow.mockRestore();
        });
    });
    it("anytime it's fetching data from server, isFetching should be true. loading should only work when without cache", async function () {
        const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => ({ query: useQuery(ref("key"), fn) }));
        const query = hook.vm.query;
        expect(query.isFetching).toBeTruthy();
        await flushPromises();
        expect(query.isFetching).toBeFalsy();
        query.reFetch();
        expect(query.isFetching).toBeTruthy();
        expect(query.isLoading).toBeFalsy();
        await flushPromises();
        expect(query.isFetching).toBeFalsy();
        expect(query.isLoading).toBeFalsy();
    });
    /**
     * @description cancel method needs construct manually. and it's implement varies on different request lib
     */
    it("should cancel request when cancel is called", async function () {
        const cancel = jest.fn();
        const request = jest.fn(() => {
            let p: CancelablePromise<string> = Promise.resolve("dd");
            p.cancel = cancel;
            return p;
        });
        const hook = renderHook(() => {
            const query = useQuery("dd", request);
            return { query };
        });
        // now it's waiting for result,and the promise.then method have not called yet
        await hook.vm.query.cancel();
        expect(cancel).toHaveBeenCalledTimes(1);
        // this is just a fake cancel method, it will not cancel request actually
    });
    test("when network reconnect we should refetch data", async () => {
        const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => {
            return { query: useQuery("d", fn) };
        });
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
        const reconnectEvent = new window.Event("online");
        window.dispatchEvent(reconnectEvent);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(2);
    });
    test("when window focus, refetch", async () => {
        const fn = jest.fn().mockResolvedValue("dd");
        const hook = renderHook(() => {
            return { query: useQuery("dddasd", fn) };
        });
        await flushPromises();
        const focusEvent = new window.Event("focus");
        const visibilitychangeEvent = new Event("visibilitychange");
        window.dispatchEvent(focusEvent);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(2);
        window.dispatchEvent(visibilitychangeEvent);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(3);
    });
    test("interval refetch", async () => {
        const fn = jest.fn().mockResolvedValue("dd");
        jest.spyOn(document, "hidden", "get").mockReturnValue(false);
        const hook = renderHook(() => {
            const intervalTimeRef = ref<number | false>(3000);
            return {
                query: useQuery(
                    "key",
                    fn,
                    computed(() => ({ refetchInterval: intervalTimeRef.value }))
                ),
                changeTime: (time: number | false) => {
                    intervalTimeRef.value = time;
                },
            };
        });
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(3000);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(2);
        jest.advanceTimersByTime(3000);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(3);
        hook.vm.changeTime(false);
        jest.advanceTimersByTime(2999);
        expect(fn).toHaveBeenCalledTimes(3);
        jest.advanceTimersByTime(1);
        // when interval is set false,it will exec the last pending request, and will not execute request again
        expect(fn).toHaveBeenCalledTimes(4);
    });
    test("refetchIntervalInBackground truthy value can disable refetch interval in background", async () => {
        const fn = jest.fn().mockResolvedValue("dd");
        jest.spyOn(document, "hidden", "get").mockReturnValue(true);
        const hook = renderHook(() => {
            const intervalTimeRef = ref<number | false>(3000);
            return {
                query: useQuery("key", fn, { refetchInterval: intervalTimeRef.value, refetchIntervalInBackground: false }),
            };
        });
        expect(fn).toHaveBeenCalledTimes(1);
        await flushPromises();
        jest.advanceTimersByTime(3000);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
