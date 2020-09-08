import {getQueryArgs} from "@/query/utils";
import {defaultConfig} from "@/query/core/config";

describe("test utils function",()=> {
    describe("getQueryArgs",()=>{
        it('should ', function () {
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
})