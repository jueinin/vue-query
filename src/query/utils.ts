import {QueryConfig, QueryFn, QueryKey, UseQueryObjectConfig} from "@/query/core/types";
import { defaultConfig } from './core/config';

export const getQueryArgs = (...args: any[]): [QueryKey,QueryFn,QueryConfig] => {
    let queryKey: QueryKey,queryFn: QueryFn,config: QueryConfig
    if (args.length == 1 && typeof args[0]==="object") {
        // object parameter
        const arg: UseQueryObjectConfig<any, any> = args[0];
        queryKey = arg.queryKey;
        queryFn = arg.queryFn
        if (!queryFn) {
            throw new Error("queryFn is required")
        }
        config = Object.assign({}, defaultConfig, arg.config);
    }else if (args.length === 2 && (typeof args[1] === "function")) {
        // without config,need use default config
        queryKey = args[0];
        queryFn = args[1];
        config = Object.assign({}, defaultConfig);
    }else if (args.length > 2) {
        queryKey = args[0];
        queryFn = args[1];
        config = args[2];
    } else {
        throw new Error("param error, please refer docs!")
    }
    return [queryKey,queryFn,config];
}
// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o: any): o is Object {
    function hasObjectPrototype(o: any): boolean {
        return Object.prototype.toString.call(o) === '[object Object]'
    }
    if (!hasObjectPrototype(o)) {
        return false
    }

    // If has modified constructor
    const ctor = o.constructor
    if (typeof ctor === 'undefined') {
        return true
    }

    // If has modified prototype
    const prot = ctor.prototype
    if (!hasObjectPrototype(prot)) {
        return false
    }

    // If constructor does not have an Object-specific method
    if (!prot.hasOwnProperty('isPrototypeOf')) {
        return false
    }

    // Most likely a plain Object
    return true
}