import { PlainBaseQueryConfig, QueryFn, QueryKey, PlainQueryKey, UseQueryObjectConfig } from "./core/types";
import { defaultConfig } from "./core/config";
import { Ref, onMounted, onUnmounted, onBeforeUpdate, onUpdated, watch, isRef, ref, computed, inject } from "vue";
export const getQueryArgs = <PlainKey extends PlainQueryKey, TResult>(
    ...args: any[]
): [Ref<PlainQueryKey>, QueryFn<PlainKey, TResult>, Ref<Required<PlainBaseQueryConfig>>] => {
    let queryKey: Ref<PlainQueryKey>, queryFn: QueryFn<PlainKey, TResult>, config: Ref<Required<PlainBaseQueryConfig>>;
    const contextConfigRef: Ref<PlainBaseQueryConfig> = inject<Ref<PlainBaseQueryConfig>>("vueQueryConfig",ref({}));
    if (args.length == 1 && typeof args[0] === "object") {
        // object parameter
        const arg: UseQueryObjectConfig<PlainKey> = args[0];
        queryKey = isRef(arg.queryKey) ? arg.queryKey : ref(arg.queryKey);
        queryFn = arg.queryFn;
        if (!queryFn) {
            throw new Error("queryFn is required");
        }
        config = computed(() => {
            return Object.assign({}, defaultConfig, contextConfigRef?.value, getValueFromRefOrNot(arg.config));
        });
    } else if (args.length === 2 && typeof args[1] === "function") {
        // without config,need use default config
        queryKey = isRef(args[0]) ? args[0] : ref(args[0]);
        queryFn = args[1];
        config = ref(Object.assign({}, defaultConfig, contextConfigRef?.value));
    } else if (args.length > 2) {
        queryKey = isRef(args[0]) ? args[0] : ref(args[0]);
        queryFn = args[1];
        config = computed(() => Object.assign({}, defaultConfig, contextConfigRef?.value, getValueFromRefOrNot(args[2])));
    } else {
        throw new Error("param error, please refer docs!");
    }
    return [queryKey, queryFn, config];
};
export function delay(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms);
    });
}
export const noop = () => {};
export const getValueFromRefOrNot = <T>(value: Ref<T> | T): T => {
    return isRef(value) ? value.value : value;
};
export const useMountAndUnmount = (fn: (() => any) | (() => () => void)) => {
    let unMountFn: Function | undefined = undefined;
    onMounted(() => {
        unMountFn = fn();
    });
    onUnmounted(() => {
        if (unMountFn) {
            unMountFn();
        }
    });
};
