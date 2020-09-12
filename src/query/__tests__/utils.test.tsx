import {delay, getQueryArgs} from "@/query/utils";
import {defaultConfig} from "@/query/core/config";
import flushPromises from "flush-promises/index";
import {mount} from "@vue/test-utils";
import { ref, watch, Ref } from 'vue';
import {renderHook} from "../../../tests/utils";

describe("test utils function",()=> {
    describe("getQueryArgs",()=>{
        it('should parse different forms of params ', function () {
            const fn = jest.fn().mockResolvedValue("dd")
            expect(getQueryArgs("key", fn)).toEqual(["key", fn, defaultConfig]);
            expect(getQueryArgs([1,2,3,null],fn,{retry: 4})).toEqual([[1,2,3,null],fn,Object.assign({},defaultConfig,{retry: 4})])
            expect(getQueryArgs({
                queryKey: [{dd: "d"}],
                queryFn: fn,
                config: {retry: 5}
            })).toEqual([[{dd: "d"}],fn,Object.assign({},defaultConfig,{retry: 5})])
        });
    })
    it('should delay some ms to exec', async function () {
        jest.useFakeTimers();
        const fn = jest.fn();
        delay(200).then(fn)
        jest.advanceTimersByTime(200);
        await flushPromises()
        expect(fn).toHaveBeenCalledTimes(1);
    });
    // describe('useEffect', function () {
    //     const getFn = ()=> {
    //         const fnUnmount = jest.fn();
    //         const fn = jest.fn().mockReturnValue(fnUnmount);
    //         return {fnUnmount,fn}
    //     }
    //     it('should call callback when mounted and unmounted', function () {
    //         const {fn,fnUnmount} = getFn()
    //         const hook = renderHook(() => useEffect(fn, ref([])));
    //         expect(fn).toHaveBeenCalledTimes(1);
    //         hook.unmount();
    //         expect(fnUnmount).toHaveBeenCalledTimes(1);
    //     });
    // });
})