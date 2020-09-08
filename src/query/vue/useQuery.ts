import {QueryConfig, QueryFn, QueryKey, QueryResult, UseQueryObjectConfig} from "@/query/core/types";
import {getQueryArgs} from "@/query/utils";
import { watch, ref,onMounted, toRef, Ref } from 'vue';

export function useQuery<TResult, TError>(queryKey: QueryKey, fn: QueryFn): QueryResult<TResult, TError>
export function useQuery<TResult, TError>(queryKey: QueryKey, fn: QueryFn, config: QueryConfig<TResult, TError>): QueryResult<TResult, TError>
export function useQuery<TResult,TError>(queryObject: UseQueryObjectConfig<TResult, TError>): QueryResult<TResult, TError>
export function useQuery(...args: any): any {
    const [queryKey, queryFn, config] = getQueryArgs(...args);
    // const queryKeyRef= ref(queryKey)
    watch(queryKey as Ref<number>,(newValue)=>{
        if (Array.isArray(newValue)) {
            queryFn(...newValue);
        } else {
            queryFn(newValue)
        }
    },{immediate: true})

}