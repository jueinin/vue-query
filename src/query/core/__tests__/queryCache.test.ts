import { queryCache } from "../queryCache";
import { defaultConfig } from "../config";
import { renderHook } from "../../../../tests/utils";
import { reactive } from "vue-demi";

jest.useFakeTimers();
beforeEach(() => {
    queryCache.clear();
});
describe("queryCache", () => {
    it("add cache, delete cache, get cache and cache 5 minutes", function () {
        queryCache.addToCache({
            queryKey: "key",
            data: "dd",
            cacheTime: defaultConfig.cacheTime,
            staleTime: defaultConfig.staleTime,
        });
        expect(queryCache.getCache("key")).toEqual(expect.objectContaining({ data: "dd" }));

        jest.advanceTimersByTime(defaultConfig.cacheTime);
        expect(queryCache.hasCache("key")).toBeFalsy();
    });
    test("add cache to the same queryKey will reset the cacheTime", async () => {
        const addCache = (data: any) =>
            queryCache.addToCache({
                queryKey: "key",
                data: data,
                cacheTime: defaultConfig.cacheTime,
                staleTime: defaultConfig.staleTime,
            });
        addCache("data");
        jest.advanceTimersByTime(defaultConfig.cacheTime - 1);
        expect(queryCache.hasCache("key")).toBeTruthy();
        expect(addCache("data2"));
        jest.advanceTimersByTime(1);
        expect(queryCache.hasCache("key")).toBeTruthy();
        expect(queryCache.getCache("key")!.data).toEqual("data2");
        jest.advanceTimersByTime(defaultConfig.cacheTime);
        expect(queryCache.hasCache("key")).toBeFalsy();
    });
    it("should update cache directly", function () {
        queryCache.addToCache({
            queryKey: "k",
            data: "data",
            cacheTime: defaultConfig.cacheTime,
            staleTime: defaultConfig.staleTime,
        });
        queryCache.updateCache("k", "data2");
        expect(queryCache.getCache("k")!.data).toEqual("data2");
        queryCache.updateCache("k", oldData => oldData + "2");
        expect(queryCache.getCache("k")!.data).toEqual("data22");
    });
    test("when change query cache data, the views should update too!", async () => {
        const hook = renderHook(() => {
            const state = reactive({
                name: 1,
            });
            let name = state.name;
            const changeCount = () => {
                name++;
            };
            return {
                state,
                name,
                changeCount,
            };
        });
        await hook.vm.changeCount();
    });
});
