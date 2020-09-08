import {mount} from "@vue/test-utils";
import {useCounter} from "@/hook/useCounter";
describe("useCounter",()=> {
    it('initial value should be 0,and delta is 1', async function () {
        const wrapper = mount({
            setup() {
                return {counter: useCounter()}
            },
            render() {
                return <div></div>
            }
        })
        const {state,add,minus} = wrapper.vm.counter
        expect(state.value).toEqual(0);
        add();
        expect(state.value).toEqual(1);
        minus();
        expect(state.value).toEqual(0);
        add(2);
        expect(state.value).toEqual(2);
        minus(3);
        expect(state.value)
    });
})