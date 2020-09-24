import { defaultConfig } from "./config";
import objectHash from 'object-hash';
import { PlainQueryKey, QueryKey } from "./types";

export type CacheValue<T = any> = {
    storeTime: number;
    data: T;
};
export const createCacheValue = <T>(value: T): CacheValue<T> => {
    return {
        storeTime: Date.now(),
        data: value,
    };
};
// todo we need enhance the feature of query cache
/**
 * 1. when update cache, the ui should update too
 * 2.
 */
export class QueryCache {
    private map: Map<string, CacheValue> = new Map();
    addToCache = (queryKey: any, value: CacheValue, cacheTime: number = defaultConfig.cacheTime) => {
        const hash:string = objectHash(queryKey);
        this.map.set(hash, value);
        setTimeout(() => {
            this.removeFromCache(queryKey);
        }, cacheTime);
    };
    removeFromCache = (queryKey: string): void => {
        this.map.delete(queryKey);
    };
    hasCache = (key: any) => {

    }
    getCache = <T = any>(queryKey: any): CacheValue<T> | undefined => {
        return this.map.get(objectHash(queryKey));
    };
    clear = () => {
        this.map.clear();
    };
}

const queryCache = new QueryCache();
export { queryCache };
