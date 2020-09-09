<template>
  <div class="tit">
    <h1>This is an about page</h1>
    value {{counter.state.value}}
    <button class="add" @click="()=>counter.add(2)">add</button>
    <button class="minus" @click="()=>counter.minus(2)">add</button>

  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { useCounter } from "@/hook/useCounter";
export default defineComponent({
    // components: {Counter},
    setup() {
        const counter = useCounter();
        const re = ref([counter.state, 2]);
        return {counter}
        // return () => (
        //     <div class="tit">
        //         <h1>This is an about page</h1>
        //         value{counter.state.value}
        //         <button class="add" onClick={() => counter.add(2)}>
        //             add
        //         </button>
        //         <button class="minus" onClick={() => counter.minus(2)}>
        //             minus
        //         </button>
        //         {re.value.map((value: any, index: number) => {
        //             if (index === 0) {
        //                 return value.value;
        //             }
        //             return value;
        //         })}
        //     </div>
        // );
    },
});
</script>
<style>
.tit {
    color: red;
}
</style>
