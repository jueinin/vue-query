基于vue composition api的网络请求库

由[React Query](https://github.com/tannerlinsley/react-query)得到启发。

可以理解为基于vue的react query

## 功能概览

-   不限数据获取方式，你可以使用其他网络请求库例如`axios`，或者`umi request`，也可以使用HTTP或者graphql
-   请求自动缓存，当数据过期或者浏览器窗口重新focus时自动重新从服务端获取数据
-   并行请求、依赖请求
-   取消请求
-   开箱即用的滚动恢复

## Documentation

-   [安装]](#安装)
-   [快速上手](#快速上手)
-   [Queries](#queries)
-   [Caching & Invalidation](#caching-and-invalidation)
-   [API](#api)

# 安装

```shell script
$ npm i --save @jueinin/vue-query
# or
$ yarn add @jueinin/vue-query
```

# 快速上手

get请求

方便起见，以下示例均使用jsx编写。和模板差不多的。

```tsx
import Axios from "axios";
import { defineComponent } from "@vue/runtime-core";
import { useQuery } from "./useQuery";
const Todos = defineComponent({
    setup() {
        const query = useQuery<string[]>("/api/test", (url) => {
            return Axios.get({ url }).then((value) => value.data);
        });
        return () => {
            return (
                <ul>
                    {query.data?.map((todo) => (
                        <li>{todo}</li>
                    ))}
                </ul>
            );
        };
    },
});
```

# Queries

## 创建一个简单的请求

调用useQuery，并且至少传入以下两个参数来创建请求

-  `queryKey` 一个能代表你请求的数据的 `queryKey`,可以传任何能被序列化的值，一般来说传请求的地址这个字符串即可。
-   `queryFn` 一个返回Promise的**异步函数**，函数的参数就是queryKey,如果queryKey是数组类型，queryKey数组会被展开一个个地传入(使用拓展操作符...)，否则直接传给queryFn。

```tsx
import Axios from "axios";
import { defineComponent } from "vue";
import { useQuery } from "./useQuery";
const Todos = defineComponent({
    setup() {
        const page = 2
        const query = useQuery<string[]>(["/api/data",page], (url,page) => {
            return Axios.get({ url: url + "?page=" + page }).then((value) => value.data);
        });
        return () => {
            if (query.isLoading) {
                return <div>Loading...</div>;
            }
            // 出现错误时，渲染错误信息
            if (query.error) {
                return <div>{query.error.message}</div>;
            }
            return (
                <div>
                    <ul>
                        {query.data.map((todo) => (
                            <li>{todo}</li>
                        ))}
                    </ul>
                </div>
            );
        };
    },
});
```

## 观察queryKey

如果`queryKey`改变了，`vue-query`会自动向服务端请求最新的数据，为了使`vue-query`可以观察到`queryKey`的改变，你需要传递一个Ref类型
的值给`queryKey`,推荐使用computed方法来得到这个Ref类型的值。

点击下一页时，自动请求下一页数据
```tsx
import Axios from "axios";
import { defineComponent, ref, computed } from "vue";
import { useQuery } from "./useQuery";
const Todos = defineComponent({
    setup() {
        const page = ref(1);
        const query = useQuery<string[]>(
            // 这里将会观察page的值，page改变重新请求
            computed(() => ["/api/articles", page.value]),
            (url,page) => {
                return Axios.get({ url: url + "/" + page }).then((value) => value.data);
            }
        );
        return () => {
            if (query.isLoading) {
                return <div>Loading...</div>;
            }
            if (query.error) {
                return <div>{query.error.message}</div>;
            }
            return (
                <div>
                    <ul>
                        {query.data.map((todo) => (
                            <li>{todo}</li>
                        ))}
                    </ul>
                    // 改变页码
                    <button onClick={() => page.value++}>next page</button>
                </div>
            );
        };
    },
});
```

## 也可以传入一个对象来请求

```tsx
useQuery({
    queryKey: "/api/test",
    queryFn: (url) => Axios.get({ url }),
    config: {},
});
```

## 并行请求

`vue-query`开箱即用地支持并行请求

## 依赖请求

Dependent queries are queries thar depend on previous ones to finish before they can execute.

```tsx
import Axios from "axios";
import { defineComponent, ref, computed } from "vue";
import { useQuery } from "./useQuery";
const Todos = defineComponent({
    setup() {
        const page = ref(1);
        const query = useQuery<string[]>("/api/test", (url) => {
            return Axios.get({ url }).then((value) => value.data);
        });
        const dependentQuery = useQuery<string[]>(
            "/api/test",
            (url) => {
                return Axios.get({ url }).then((value) => value.data);
            },
            computed(() => ({
                // query.data will be `undefined` at first,so it will not execute until the query.data existed
                enabled: query.data,
            }))
        );
        return () => {
            if (query.isLoading) {
                return <div>Loading...</div>;
            }
            if (query.error) {
                return <div>{query.error.message}</div>;
            }
            return (
                <div>
                    <ul>
                        {query.data.map((todo) => (
                            <li>{todo}</li>
                        ))}
                    </ul>
                    <button onClick={() => page.value++}>next page</button>
                </div>
            );
        };
    },
});
```

## global isFetching

when any query status is isFetching. the global isFetching status will be true. it's suitable for a global indicator for data fetching.

```tsx
import { useIsFetching } from "@jueinin/vue-query";
import { defineComponent } from "vue";
const App = defineComponent({
    setup() {
        const globalIsFetching = useIsFetching();
        return () => <div>{globalIsFetching.value && <NetworkIndicator />}</div>;
    },
});
```

# caching and invalidation

the caching is automatical out of box. it use a `stale while revalidate` in memory caching strategy.

```
At a glance:

- The cache is keyed on a deterministic hash of your query key.
- By default, query results become **stale** immediately after a successful fetch. This can be configured using the `staleTime` option at both the global and query-level.
- Stale queries are automatically refetched whenever their **query keys change (this includes variables used in query key tuples)**, when they are freshly mounted from not having any instances on the page, or when they are refetched via the query cache manually.
- Though a query result may be stale, query results are by default **always** _cached_ **when in use**.
- If and when a query is no longer being used, it becomes **inactive** and by default is cached in the background for **5 minutes**. This time can be configured using the `cacheTime` option at both the global and query-level.
- After a query is inactive for the `cacheTime` specified (defaults to 5 minutes), the query is deleted and garbage collected.

<details>
 <summary>A more detailed example of the caching lifecycle</summary>

Let's assume we are using the default `cacheTime` of **5 minutes** and the default `staleTime` of `0`.

- A new instance of `useQuery('todos', fetchTodos)` mounts.
  - Since no other queries have been made with this query + variable combination, this query will show a hard loading state and make a network request to fetch the data.
  - It will then cache the data using `'todos'` and `fetchTodos` as the unique identifiers for that cache.
  - A stale invalidation is scheduled using the `staleTime` option as a delay (defaults to `0`, or immediately).
- A second instance of `useQuery('todos', fetchTodos)` mounts elsewhere.
  - Because this exact data exist in the cache from the first instance of this query, that data is immediately returned from the cache.
- Both instances of the `useQuery('todos', fetchTodos)` query are unmounted and no longer in use.
  - Since there are no more active instances to this query, a cache timeout is set using `cacheTime` to delete and garbage collect the query (defaults to **5 minutes**).
- No more instances of `useQuery('todos', fetchTodos)` appear within **5 minutes**.
  - This query and its data are deleted and garbage collected.
```

quote by React-query.

# api

## `useQuery`

```tsx
const query = useQuery(queryKey, queryFn, config);
JSON.stringify();
```

### Options

-   `queryKey` any | Ref<any>
    -   **Required**
    -   the query key to use for query and cache.
    -   the query will automatically update when this key changes.
    -   if you need watch query key and refetch when it changes. you can pass a computed ref value.
-   `queryFn`: (...args)=>Promise<Data>
    -   **Required**
    -   the query use this function to request data.
    -   receives the following variables in the order that they are provided: query key.
    -   must return a promise that will either resolves data or throws an error.
-   `config`: query config, if you need watch config, and always use latest config, you can pass a computed ref value.
    -   `enabled`: boolean
        -   set this option to false to disable the query from automatically running.
        -   default value is true.
    -   `retry`: int | false | (failCount: number,error: Error)=>boolean
        -   when the query failed. it will use retry option to retry.
        -   when set false. it will not retry request.
        -   when set int, it will retry specified times.
        -   when set a function, if the function return true, it will retry, otherwise, we won't retry.
        -   default value is 3.
    -   `retryDelay`: (retryCount: number)=>number
        -   it receives a retry count as parameter, and get the delay to apply to next attempt in milliseconds.
        -   default value is `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)`
    -   `staleTime`: number
        -   the time in ms that cache data remains fresh. after a successful cache update, the cache will become stale after this duration.
        -   default value is 0. which means the cache data will stale immediately.
    -   `cacheTime`: number
        -   the cache time saved in memory
        -   default value is 5 minutes
