import { defaultConfig } from "../core/config";

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
export class QueryCache {
    private map: Map<string, CacheValue> = new Map();
    addToCache = (key: string, value: CacheValue, cacheTime: number = defaultConfig.cacheTime) => {
        this.map.set(key, value);
        setTimeout(() => {
            this.removeFromCache(key);
        }, cacheTime);
    };
    removeFromCache = (key: string): void => {
        this.map.delete(key);
    };
    getCache = <T = any>(key: string): CacheValue<T> | undefined => {
        return this.map.get(key);
    };
    clear = () => {
        this.map.clear();
    };
}

const queryCache = new QueryCache();
export { queryCache };
