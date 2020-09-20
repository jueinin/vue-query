import { computed, defineComponent, provide } from "vue";
import { PlainBaseQueryConfig } from "../core/types";
type Props = {config: PlainBaseQueryConfig}
const VueQueryProvider = defineComponent({
    props: {
        config: {
            required: true
        }
    },
    setup(props: Props, context) {
        provide(
            "config",
            computed(()=>props.config)
        );
        console.log(props);
        
        return () => {
            return <div>{context.slots.default()}</div>;
        };
    },
});

export { VueQueryProvider };
