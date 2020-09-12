import { BaseQueryConfig, QueryFn, QueryKey, UseQueryObjectConfig } from "@/query/core/types";
import { defaultConfig } from "./core/config";
import {Ref,onMounted,onUnmounted,onBeforeUpdate,onUpdated, watch, isRef} from 'vue'
export const getQueryArgs = (...args: any[]): [QueryKey, QueryFn, Required<BaseQueryConfig>] => {
    let queryKey: QueryKey, queryFn: QueryFn, config: Required<BaseQueryConfig>;
    if (args.length == 1 && typeof args[0] === "object") {
        // object parameter
        const arg: UseQueryObjectConfig<any, any> = args[0];
        queryKey = arg.queryKey;
        queryFn = arg.queryFn;
        if (!queryFn) {
            throw new Error("queryFn is required");
        }
        config = Object.assign({}, defaultConfig, arg.config);
    } else if (args.length === 2 && typeof args[1] === "function") {
        // without config,need use default config
        queryKey = args[0];
        queryFn = args[1];
        config = Object.assign({}, defaultConfig);
    } else if (args.length > 2) {
        queryKey = args[0];
        queryFn = args[1];
        config = Object.assign({}, defaultConfig, args[2]);
    } else {
        throw new Error("param error, please refer docs!");
    }
    return [queryKey, queryFn, config];
};
export function delay(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>resolve(), ms);
    });
}
export const noop = () => {};
export const getValueFromRefOrNot = <T>(value: Ref<T>| T):T => {
    return isRef(value) ? value.value : value;
}