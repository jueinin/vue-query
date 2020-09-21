import {computed, defineComponent, provide,h } from "vue";
import { PlainBaseQueryConfig } from "../core/types";

type Props = {config: PlainBaseQueryConfig}
// @ts-ignore
const VueQueryProvider = defineComponent<Props>({
    props: ['config'],
    setup(props: Props, context: any) {
        provide(
            "vueQueryConfig",
            computed(()=>props.config)
        );
    },
    template: `<div>{{this.$slots.default}}</div>`
});

export { VueQueryProvider };
