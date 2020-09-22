import {createCacheValue, queryCache} from "../queryCache";
import {defaultConfig} from "../config";

jest.useFakeTimers();
describe("queryCache",()=> {
    it('add cache, delete cache, get cache and cache 5 minutes', function () {
        queryCache.addToCache("key", createCacheValue("dd"));
        expect(queryCache.getCache("key")).toEqual(expect.objectContaining({data: "dd"}));
        const deleteMethod = jest.spyOn(queryCache, "removeFromCache");
        jest.advanceTimersByTime(defaultConfig.cacheTime);
        expect(deleteMethod).toHaveBeenCalledTimes(1);
        expect(deleteMethod).toHaveBeenLastCalledWith("key");
        expect(queryCache.getCache("key")).toEqual(undefined);
    });
})