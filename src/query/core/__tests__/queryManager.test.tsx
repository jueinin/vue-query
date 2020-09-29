import { queryCache, useQuery } from "../../index";
import { renderHook } from "../../../../tests/utils";
import { queryManager } from "../queryManager";
import { getQueryArgs } from "../../utils";
import { flushPromises } from "@vue/test-utils";
import { nextTick, onMounted } from "vue-demi";
import { PlainQueryKey } from "../types";
jest.useFakeTimers();
describe("query manager", () => {
    beforeEach(() => {
        queryCache.clear();
        queryManager.queryList = [];
    });
    const mount = (fn: any) => {
        renderHook(() => {
            const query = queryManager.createQuery(...getQueryArgs({ args: ["key", fn], contextConfigRef: undefined }));
            return { query };
        });
    };
    test("getQueryData", async () => {
        const fn = jest.fn().mockResolvedValue("data");
        const hook = renderHook(() => {
            const query = queryManager.createQuery(...getQueryArgs({ args: ["key", fn], contextConfigRef: undefined }));
            return { query };
        });
        await flushPromises();
        expect(queryManager.getQueryData("key")).toEqual("data");
    });
    test("setQueryData", async () => {
        // when data changed, the view should change too.
        const hook = renderHook(() => {
            const query = useQuery("key", () => Promise.resolve("data"));
            return () => {
                return <div>{query.data}</div>;
            };
        });
        await flushPromises();
        expect(hook.text()).toEqual("data");
        queryManager.setQueryData("key", (oldValue: string) => oldValue + "js");
        await nextTick();
        expect(hook.text()).toEqual("datajs");
    });
    test("getQuery by key", async () => {
        const hook = renderHook(() => {
            return { query: useQuery("key", () => Promise.resolve("data")) };
        });
        await flushPromises();
        const query = queryManager.getQueryByQueryKey("key")!;
        expect(query).toBeDefined();
        expect(query.result.data).toEqual("data");
    });
    test("prefetch request", async () => {
        const fn = jest.fn().mockResolvedValue("data");
        const hook = renderHook(() => {
            onMounted(() => {
                queryManager.prefetchQuery("key", fn);
            });
        });
        await flushPromises();
        expect(queryManager.getQueryByQueryKey("key")).toBeUndefined();
        expect(queryCache.getCache("key")!.data).toEqual("data");
    });
    test("getQueries ", async () => {
        const getQueryByKey = (key: PlainQueryKey) => {
            return useQuery(key, () => Promise.resolve("data"), {
                staleTime: 10,
            });
        };
        let q1, q2, q3, q4;
        renderHook(() => {
            q1 = getQueryByKey("key1");
            q2 = getQueryByKey("key1");
            q3 = getQueryByKey(["key1", "key2"]);
            q4 = getQueryByKey(["key1", "key2", "key3"]);
        });
        await flushPromises();
        expect(queryManager.getQueriesByQueryKey("key1").map((value) => value.queryKey.value)).toEqual(["key1", "key1"]);
        expect(queryManager.getQueriesByQueryKey(["key1"]).map((value) => value.queryKey.value)).toEqual([
            "key1",
            "key1",
            ["key1", "key2"],
            ["key1", "key2", "key3"],
        ]);
        expect(queryManager.getQueriesByQueryKey(["key1", "key2"]).map((value) => value.queryKey.value)).toEqual([
            ["key1", "key2"],
            ["key1", "key2", "key3"],
        ]);
        expect(queryManager.getQueriesByQueryKey(["key1", "key2"], { staled: true }).map((value) => value.queryKey.value)).toEqual([]);
        expect(queryManager.getQueriesByQueryKey(["key1", "key2"], { exact: true }).map((value) => value.queryKey.value)).toEqual([
            ["key1", "key2"]
        ]);
        expect(queryManager.getQueriesByQueryKey([]).map((value) => value.queryKey.value)).toEqual([
            "key1",
            "key1",
            ["key1", "key2"],
            ["key1", "key2", "key3"],
        ]);
        // default queryKey will match all queries
        expect(queryManager.getQueriesByQueryKey().map((value) => value.queryKey.value)).toEqual([
            "key1",
            "key1",
            ["key1", "key2"],
            ["key1", "key2", "key3"],
        ]);
    });
    test("invalidate query", async () => {
        const hook = renderHook(() => {
            const q1 = useQuery("k1", jest.fn().mockResolvedValue("data"));
            const q2 = useQuery("k2", jest.fn().mockResolvedValue("data"));
            const q3 = useQuery("k3", jest.fn().mockResolvedValue("data"));
        });
        queryManager.invalidateQueries((queryKey) => {
            return typeof queryKey === "string" && queryKey[0] === "k";
        });
    });
});
