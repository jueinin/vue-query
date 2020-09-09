import { defaultConfig } from "@/query/core/config";

export type CacheValue<T = any> = {
    storeTime: number;
    data: T;
};
export class QueryCache {
    private map: Map<string, CacheValue> = new Map();
    addToCache = (key: string, value: CacheValue, cacheTime: number = defaultConfig.cacheTime) => {
        const time = Date.now();
        this.map.set(key, value);
        setTimeout(() => {
            this.removeFromCache(key);
        }, cacheTime);
    };
    removeFromCache = (key: string): void => {
        this.map.delete(key);
    };
    getCache = <T = any>(key: string): CacheValue<T> | undefined => {
        return this.map.get(key)
    };
}

const queryCache = new QueryCache();
export { queryCache };
