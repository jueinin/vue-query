import { BaseQueryConfig } from "@/query/core/types";
import { noop } from '../utils';
export const defaultRetryDelay = (failCount: number) => Math.min(1000 * 2 ** failCount, 30000);
export const defaultConfig: Required<BaseQueryConfig> = {
    retry: 3,
    retryDelay: defaultRetryDelay,
    initialData: undefined,
    cacheTime: 5*60*1000,
    onSuccess: ()=>{},
    onError: ()=>{},
    enabled: true,
    staleTime: 0
};
