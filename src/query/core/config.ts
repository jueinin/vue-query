import {PlainBaseQueryConfig, PlainMutationConfig, ReFetchOptions} from "../core/types";
import { noop } from '../utils';
export const defaultRetryDelay = (failCount: number) => Math.min(1000 * 2 ** failCount, 30000);
export const defaultConfig: Required<PlainBaseQueryConfig> = {
    retry: 3,
    retryDelay: defaultRetryDelay,
    initialData: undefined,
    cacheTime: 5*60*1000,
    onSuccess: ()=>{},
    onError: ()=>{},
    enabled: true,
    staleTime: 0,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    refetchIntervalInBackground: false
};
export const defaultReFetchOptions :ReFetchOptions = {
    force: false
}
export const defaultMutationConfig: Required<PlainMutationConfig<any, any, any>> = {
    onMutate: noop,
    onSettled: noop,
    onSuccess: noop,
    onError: noop
}