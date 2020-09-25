import {createCacheValue, queryCache} from "../queryCache";
import {defaultConfig} from "../config";
import { renderHook } from "../../../../tests/utils";
import { reactive } from 'vue-demi';

jest.useFakeTimers();
describe("queryCache",()=> {
    it('add cache, delete cache, get cache and cache 5 minutes', function () {
        queryCache.addToCache({
            queryKey: "key",
            data: "dd",
            cacheTime: defaultConfig.cacheTime,
            staleTime: defaultConfig.staleTime
        });
        expect(queryCache.getCache("key")).toEqual(expect.objectContaining({data: "dd"}));

        jest.advanceTimersByTime(defaultConfig.cacheTime);
        expect(queryCache.hasCache("key")).toBeFalsy()
    });
    test("when change query cache data, the views should update too!",async () => {
        const hook = renderHook(() => {
            const state = reactive({
                name: 1
            });
            let name = state.name;
            const changeCount = () => {
                name++;
            };
            return {
                state, name, changeCount
            };
        });
        await hook.vm.changeCount();
    })
})