<script lang="tsx">
import { defineComponent, ref } from "vue";
import Counter from "./Counter.vue";
import { useCounter } from "@/hook/useCounter";
export default defineComponent({
    // components: {Counter},
    setup() {
        const counter = useCounter();
        return () => (
            <div class="tit">
                <h1>This is an about page</h1>
                value{counter.state.value}
                <button onClick={() => counter.add(2)}>add</button>
                <button onClick={() => counter.minus(2)}>minus</button>
            </div>
        );
    },
});
</script>
<style>
.tit {
    color: red;
}
</style>
