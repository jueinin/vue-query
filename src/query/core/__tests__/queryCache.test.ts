import {queryCache} from "@/query/core/queryCache";
import {defaultConfig} from "@/query/core/config";

jest.useFakeTimers();
describe("queryCache",()=> {
    it('add cache, delete cache, get cache and cache 5 minutes', function () {
        queryCache.addToCache("key", "dd");
        expect(queryCache.getCache("key")).toEqual("dd");
        const deleteMethod = jest.spyOn(queryCache, "removeFromCache");
        jest.advanceTimersByTime(defaultConfig.cacheTime);
        expect(deleteMethod).toHaveBeenCalledTimes(1);
        expect(deleteMethod).toHaveBeenLastCalledWith("key");
        expect(queryCache.getCache("key")).toEqual(undefined);
    });
})