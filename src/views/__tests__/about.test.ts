import {mount} from "@vue/test-utils";
import About from "@/views/About.vue";

describe("about",()=>{
    it('should add and minus when click', async function () {
        // @ts-ignore
        const wrapper = mount(About)
        await wrapper.find(`.add`).trigger('click');
        // @ts-ignore
        expect(wrapper.vm.counter.state.value).toEqual(2);
    });
})