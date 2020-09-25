import { Ref, reactive } from "vue-demi";
import { PlainBaseQueryConfig, PlainQueryKey, QueryFn } from "./types";
import { Query } from "./query";

export class QueryManager {
    queryList: Query<any, any, any>[] = [];
    dispatchQuery = <Data,Key extends PlainQueryKey>(queryKey: Ref<PlainQueryKey>, queryFn: QueryFn<Key,Data>, config: Ref<Required<PlainBaseQueryConfig>>) => {
        const query =  new Query(queryKey, queryFn, config);
        this.queryList.push(query);
        return query
    }
    removeQuery = (query: Query<any, any, any>)=> {
        this.queryList = this.queryList.filter(value => value === query);
    }
}

export const queryManager = reactive(new QueryManager());