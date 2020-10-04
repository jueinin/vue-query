import { PlainBaseQueryConfig, QueryFn, PlainQueryKey, UseQueryObjectConfig } from "./core/types";
import { defaultConfig } from "./core/config";
import { Ref, onMounted, onUnmounted, isRef, ref, computed, inject } from "vue-demi";
export const getQueryArgs = <PlainKey extends PlainQueryKey, TResult>(params: {
    args: any[];
    contextConfigRef: undefined | Ref<PlainBaseQueryConfig>;
}): [Ref<PlainQueryKey>, QueryFn<PlainKey, TResult>, Ref<Required<PlainBaseQueryConfig>>] => {
    const { args, contextConfigRef } = params;
    let queryKey: Ref<PlainQueryKey>, queryFn: QueryFn<PlainKey, TResult>, config: Ref<Required<PlainBaseQueryConfig>>;
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
export const createHash = (value: any) => {
    // return objectHash(value);
    // remove objectHash to reduce bundle size
    // base on https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    const hashCode = (s:string) => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
    return "hash: "+hashCode(JSON.stringify(value));

};
export const deepEqual = (a: any, b: any) => {
    if (a === b) return true;

    if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;

        var length, i, keys;
        if (Array.isArray(a)) {
            length = a.length;
            if (length != b.length) return false;
            for (i = length; i-- !== 0; ) if (!deepEqual(a[i], b[i])) return false;
            return true;
        }
    }
};
