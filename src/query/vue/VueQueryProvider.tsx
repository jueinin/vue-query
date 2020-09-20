import { computed, defineComponent, provide } from "vue";
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
        return () => {
            return <div>{context.slots.default()}</div>;
        };
    },
});

export { VueQueryProvider };
