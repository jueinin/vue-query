
<script lang="tsx">
import { defineComponent, inject, Ref, ref } from "vue";
import { useCounter } from "@/hook/useCounter";
import { PlainBaseQueryConfig } from '@/query/core/types';
import {VueQueryProvider} from '@/query/vue/VueQueryProvider'
const Child = defineComponent({
            setup() {
                const config: number = inject('config',0)
                console.log(config,"config")
                return ()=><div>
                    test
                </div>
            }
        })
export default defineComponent({
    // components: {Counter},
    setup() {
        return ()=> {
            return  <div>
                <VueQueryProvider config={{enabled: false}}>
                  <Child/>
                </VueQueryProvider>
            </div>
        }
    },
});
</script>
<style>
.tit {
    color: red;
}
</style>
