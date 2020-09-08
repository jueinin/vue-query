import {renderHook} from "../../../../tests/utils";
import {useQuery} from "@/query/vue/useQuery";
import { ref } from 'vue';

describe("useQuery",()=> {
    it('when queryKey changed,queryFn need execute again', function () {
        const fn = jest.fn().mockResolvedValue('dd');
        const hook = renderHook(() => {
            const v = ref(0)
            const query = useQuery(v, fn);
            const add = () => v.value++;
            return {v,add}
        });
        expect(fn).toHaveBeenCalledTimes(1);
        hook.vm.add()
        expect(fn).toHaveBeenCalledTimes(2);
        hook.vm.add()
        expect(fn).toHaveBeenCalledTimes(3);
        hook.vm.add()
        expect(fn).toHaveBeenCalledTimes(4)
    });
})