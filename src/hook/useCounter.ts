import { reactive, ref, watch, Ref,onUpdated } from "vue"

const useCounter = (initialValue: number = 0) => {
    const state: Ref<number> = ref(initialValue)
    const add = (delta: number = 1): void => {
        state.value = state.value + delta;
    }
    const minus = (delta: number = 1): void => {
        state.value =state.value-delta
    }
    return {state, add, minus}
};
export {useCounter}