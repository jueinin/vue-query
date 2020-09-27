import { Ref, reactive, inject } from "vue-demi";
import { BaseQueryConfig, PlainBaseQueryConfig, PlainQueryKey, QueryFn, QueryKey, QueryResult } from "./types";
import { Query } from "./query";
import { queryCache, useQuery } from "..";
import { createHash, getQueryArgs } from "../utils";
import { defaultConfig } from "./config";
import fastDeepEqual from "fast-deep-equal";
export class QueryManager {
    queryList: Query<any, any, any>[] = [];
    createQuery = <Data, Key extends PlainQueryKey>(
        queryKey: Ref<PlainQueryKey>,
        queryFn: QueryFn<Key, Data>,
        config: Ref<Required<PlainBaseQueryConfig>>
    ) => {
        const query = new Query(queryKey, queryFn, config);
        query.init();
        this.queryList.push(query);
        return query;
    };
    removeQuery = (query: Query<any, any, any>) => {
        this.queryList = this.queryList.filter((value) => value === query);
    };
    getQueryByQueryKey = (queryKey: PlainQueryKey): Query<any, any, any> | undefined => {
        const hash = createHash(queryKey);
        return this.queryList.filter((value) => value.state.hash === hash)[0];
    };
    /**
     * @description prefetch the request.if the query exists. just refetch. if the query is not existing,create and fetch data.
     */
    prefetchQuery = <Data>(
        _queryKey: PlainQueryKey,
        _queryFn: QueryFn<PlainQueryKey, Data>,
        _config?: BaseQueryConfig<Data, any>,
        extraArgs?: {
            force: boolean;
        }
    ) => {
        return new Promise<Data>((resolve, reject) => {
            const contextConfigRef: Ref<PlainBaseQueryConfig> | undefined = inject<Ref<PlainBaseQueryConfig>>("vueQueryConfig");
            const [queryKey, queryFn, config] = getQueryArgs({ args: [_queryKey, _queryFn, _config], contextConfigRef });
            let query = this.getQueryByQueryKey(queryKey.value);
            if (!query) {
                query = new Query(queryKey, queryFn, config);
                query.fetch().then(resolve).catch(reject);
            } else {
                const shouldForce: boolean = extraArgs?.force || false;
                const promise: Promise<Data> | undefined = query.refetch({ force: shouldForce });
                if (promise) {
                    // have requested
                    promise.then(resolve).catch(reject);
                } else {
                    // due to cache is not stale, or the query is not enabled. it will not request data
                    resolve(query.result.data);
                }
            }
        });
    };
    getQueriesByQueryKey = (
        queryKeyOrPredication: PlainQueryKey | ((queryKey: PlainQueryKey) => boolean) = [],
        options?: {
            staled?: boolean;
            exact?: boolean;
        }
    ) => {
        const matchStaled = options?.staled || false;
        const matchExacted = options?.exact || false;
        let queries: Query<any, any, any>[];
        if (typeof queryKeyOrPredication === "function") {
            // filter by predicate
            queries = this.queryList.filter((query) => queryKeyOrPredication(query.queryKey.value));
            if (matchStaled) {
                queries = queries.filter((query) => {
                    return queryCache.getCache(query.queryKey.value)?.getIsStaled();
                });
            }
        } else {
            // filter by plain query key
            if (matchExacted) {
                queries = this.queryList.filter((query) => {
                    return fastDeepEqual(query.queryKey.value, queryKeyOrPredication);
                });
            } else {
                // non exact match
                // if target and query's queryKey are array. partial compare target queryKey
                queries = this.queryList.filter((query) => {
                    if (Array.isArray(queryKeyOrPredication)) {
                        const arrQueryKey = Array.isArray(query.queryKey.value) ? query.queryKey.value : [query.queryKey.value];
                        return queryKeyOrPredication.every((queryKeyItem, index) => {
                            return fastDeepEqual(queryKeyItem, arrQueryKey[index]);
                        });
                    } else {
                        return fastDeepEqual(query.queryKey.value, queryKeyOrPredication);
                    }
                });
            }
            if (matchStaled) {
                queries = this.queryList.filter((value) => queryCache.getCache(queryKeyOrPredication)?.getIsStaled());
            }
        }
        return queries;
    };
    refetchQueries = (
        queryKeyOrPredication: PlainQueryKey | ((queryKey: PlainQueryKey) => boolean),
        options?: {
            exact?: boolean;
            staled?: boolean;
        }
    ) => {
        const queries = this.getQueriesByQueryKey(queryKeyOrPredication, options);
        queries.forEach(value => {
            value.refetch();
        })
    };
    setQueryData = <T>(queryKey: PlainQueryKey, updater: T extends Function ? never : T | ((oldValue: T) => T), config?: PlainBaseQueryConfig) => {
        const oldValue = this.getQueryData(queryKey);
        const newValue = typeof updater === "function" ? updater(oldValue) : updater;
        let query = this.getQueryByQueryKey(queryKey);
        if (!query) {
            // directly add to cache
            queryCache.addToCache({
                queryKey,
                data: newValue,
                cacheTime: config?.cacheTime || defaultConfig.cacheTime,
                staleTime: config?.staleTime || defaultConfig.staleTime,
            });
        } else {
            query.setQueryData(newValue);
        }
    };
    getQueryData = (queryKey: PlainQueryKey) => {
        const query = this.getQueryByQueryKey(queryKey);
        return query?.result.data;
    };
    // fetchQuery = <Data>(queryKey: QueryKey): Promise<Data> => {
    //
    // }
}

export const queryManager = reactive(new QueryManager());
