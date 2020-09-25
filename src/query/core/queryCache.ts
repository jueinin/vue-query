import { createHash } from "../utils";
import { Query } from "./query";
import { NotFunction, PlainQueryKey } from "./types";

export type CacheValue<T = any> = {
    storeTime: number;
    data: T;
    getIsStaled: () => boolean;
    timeoutDeleteNum: number | undefined
};
export const createCacheValue = <T>(value: { data: T; staleTime: number,timeoutNum?: number }): CacheValue<T> => {
    return {
        storeTime: Date.now(),
        data: value.data,
        getIsStaled: function () {
            const now = Date.now() + 1;
            return now - this.storeTime > value.staleTime;
        },
        timeoutDeleteNum: value.timeoutNum
    };
};
// todo we need enhance the feature of query cache
/**
 * 1. when update cache, the ui should update too
 * 2.
 */
export class QueryCache {
    map: Map<string, CacheValue> = new Map();
    addToCache = <T>(value: { queryKey: PlainQueryKey; data: T; cacheTime: number; staleTime: number }) => {
        if (this.map.has(createHash(value.queryKey))) {
            // when need override we should reset delete time
            clearTimeout(this.map.get(createHash(value.queryKey))!.timeoutDeleteNum);
        }
        // schedule to delete cache by cacheTime
        const num = setTimeout(() => {
            this.map.delete(createHash(value.queryKey));
        }, value.cacheTime);
        const cacheValue = createCacheValue({
            data: value.data,
            staleTime: value.staleTime,
            timeoutNum: num
        });
        this.map.set(createHash(value.queryKey), cacheValue);
    };
    removeFromCache = (queryKey: PlainQueryKey): void => {
        const hash = createHash(queryKey);
        this.map.delete(hash);
    };
    updateCache: {
        <T>(queryKey: PlainQueryKey, updater: (oldData: T) => T): void;
        <T>(queryKey: PlainQueryKey, updater: NotFunction<T>): void;
    } = <T>(queryKey: PlainQueryKey, updater: any) => {
        const cacheValue = this.map.get(createHash(queryKey));
        if (!cacheValue) {
            throw new Error("you can not update in non-existed queryKey");
        }
        const newValue = typeof updater === "function" ? updater(cacheValue.data) : updater;
        cacheValue.data = newValue;
        this.map.set(createHash(queryKey), cacheValue);
    };
    getCache = (queryKey: PlainQueryKey)=> {
        return this.map.get(createHash(queryKey));
    }
    hasCache = (queryKey: PlainQueryKey) => {
        const hash = createHash(queryKey);
        return this.map.has(hash);
    };
    clear = () => {
        this.map.clear();
    };
}

const queryCache = new QueryCache();
export { queryCache };
