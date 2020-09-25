import {
    BaseQueryConfig,
    CacheStaleStatus,
    PlainBaseQueryConfig,
    PlainQueryKey,
    QueryFn,
    QueryResult,
    QueryStatus,
    ReFetchOptions,
    UseQueryObjectConfig,
} from "../core/types";
import {  getQueryArgs } from "../utils";
import { computed, inject, reactive, Ref, watch, ref } from "vue-demi";
import { queryManager, QueryManager } from "../core/queryManager";
// todo i need do that, when change queryCache,the view should update
/**
 *
 * @param queryKey it must be a ref value,because we can not watch a normal value
 * @param fn
 */
export function useQuery<PlainKey extends PlainQueryKey, TResult, TError>(
    queryKey: PlainKey | Ref<PlainKey>,
    fn: QueryFn<PlainKey, TResult>
): QueryResult<TResult, TError>;
export function useQuery<PlainKey extends PlainQueryKey, TResult, TError>(
    queryKey: PlainKey | Ref<PlainKey>,
    fn: QueryFn<PlainKey, TResult>,
    config: BaseQueryConfig<TResult, TError>
): QueryResult<TResult, TError>;
export function useQuery<PlainKey extends PlainQueryKey, TResult, TError>(
    queryObject: UseQueryObjectConfig<PlainKey, TResult, TError>
): QueryResult<TResult, TError>;
export function useQuery<PlainKey extends PlainQueryKey, TResult, TError>(...args: any): QueryResult<TResult, TError> {
    const contextConfigRef: Ref<PlainBaseQueryConfig> | undefined = inject<Ref<PlainBaseQueryConfig>>("vueQueryConfig");
    const [queryKey, queryFn, config] = getQueryArgs<PlainKey, TResult>({ args, contextConfigRef });
    const query = queryManager.dispatchQuery(queryKey, queryFn, config);
    return query.result;
}
