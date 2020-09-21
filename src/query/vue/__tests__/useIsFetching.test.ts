import { useIsFetching } from "../useIsFetching";
import { useQuery } from "../useQuery";
import { ref } from "vue";
import flushPromises from "flush-promises/index";
import {renderHook} from "../../../../tests/utils";

test("when any requests are working, global isFetching should be true", async () => {
    const fn = jest.fn().mockResolvedValue("dd");
    const wrapper = renderHook(()=>{
        const isFetching= useIsFetching();
        const req = useQuery(ref([1, 2, 3]), fn);
        // const enable = ref(false);
        // const another = useQuery(ref([1,2,3,4]),fn,{enabled: enable.value})
        return { query: req, isFetching };
    })
    expect(wrapper.vm.isFetching).toBeTruthy();
    await flushPromises();
    expect(wrapper.vm.query.isLoading).toEqual(false)
    expect(wrapper.vm.query.isFetching).toEqual(false)
    expect(wrapper.vm.isFetching).toBeFalsy();
});