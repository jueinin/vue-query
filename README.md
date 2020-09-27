基于 vue composition api 的网络请求库

由[React Query](https://github.com/tannerlinsley/react-query)得到启发。

可以理解为基于 vue 的 react query, 实在是太好用了，所以想移植到 vue 中来。

## 功能概览

-   兼容 vue2 和 3 版本。使用 vue2.x 版本，你需要先安装 `@vue/composition-api`依赖。thanks to [vue-demi](https://github.com/antfu/vue-demi)
-   不限数据获取方式，你可以使用其他网络请求库例如`axios`，或者`umi request`，也可以使用 HTTP 或者 graphql
-   请求自动缓存，当数据过期或者浏览器窗口重新 focus 时自动重新从服务端获取数据
-   并行请求、依赖请求
-   取消请求
-   开箱即用的滚动恢复
-   支持 tree shaking

## Documentation

-   [安装](#安装)
-   [快速上手](#快速上手)
-   [例子](#例子)
-   [Queries](#queries)
-   [缓存](#缓存)
-   [Mutation](#useMutation)
-   [API 指南](#api指南)

# 安装

```shell script
$ npm i --save @jueinin/vue-query
# or
$ yarn add @jueinin/vue-query
```

# 快速上手

get 请求

方便起见，以下示例均使用基于 vue3.0 的 tsx 编写，和模板差不多的。

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

# 例子

codesandbox

-   [基础请求](https://codesandbox.io/s/jichuqingqiu-vfozo)
-   [依赖请求](https://codesandbox.io/s/yilaiqingqiu-xf19c)
-   [取消请求](https://codesandbox.io/s/quxiaoqingqiu-srcjt)

# Queries

## 创建一个简单的请求

调用 useQuery，并且至少传入以下两个参数来创建请求

-   `queryKey` 一个能代表你请求的数据的 `queryKey`,可以传任何能被序列化的值，一般来说传请求的地址这个字符串即可。
-   `queryFn` 一个返回 Promise 的**异步函数**，函数的参数就是 queryKey,如果 queryKey 是数组类型，queryKey 数组会被展开一个个地传入(使用拓展操作符...)，否则直接传给 queryFn。

```tsx
import Axios from "axios";
import { defineComponent } from "vue";
import { useQuery } from "./useQuery";
const Todos = defineComponent({
    setup() {
        const page = 2;
        const query = useQuery<string[]>(["/api/data", page], (url, page) => {
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

## 观察 queryKey

如果`queryKey`改变了，`vue-query`会自动向服务端请求最新的数据，为了使`vue-query`可以观察到`queryKey`的改变，你需要传递一个 Ref 类型
的值给`queryKey`,推荐使用 computed 方法来得到这个 Ref 类型的值。

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
            (url, page) => {
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

依赖请求指，一个请求依赖于另一个请求。通常是当前请求依赖于上一个请求的数据

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
            // 这里传入ref类型值，这样enabled属性就变得可观察了
            computed(() => ({
                // query.data首先是undefined，当上一个请求执行完毕后，这个请求才会执行
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

## 取消请求

一般而言，我们并不会取消请求，而是直接忽略对请求数据的处理。为什么呢：

-   对大多数情况而言直接不处理即可。
-   不是所有的网络请求方式都能方便的取消请求。
-   就算能够取消请求，他们的实现方式也各不相同。

不过如果遇到了需要请求大量数据的场景，请求可能会耗时比较久，这个时候取消请求就变得有必要了。

以下以 Axios 为例，取消请求

```tsx
import { CancelToken } from "axios";

const query = useQuery("/api/test", (url) => {
    const source = CancelToken.source();
    const promise = axios.get({
        url,
        cancelToken: source.token,
    });
    // cancel方法来取消请求
    promise.cancel = () => {
        source.cancel("cancel request");
    };
    return promise;
});
```

## 全局 isFetching 状态

只要有 query 请求正在进行，全局的 isFetching 状态就会为 true，这个适合作为全局的 isFetching 状态。

```tsx
import { useIsFetching } from "@jueinin/vue-query";
import { defineComponent } from "vue";
import { NetworkIndicator } from "someUILib";
const App = defineComponent({
    setup() {
        const globalIsFetching = useIsFetching();
        return () => <div>{globalIsFetching.value && <NetworkIndicator />}</div>;
    },
});
```

# 缓存

请求结束后，会自动关联`queryKey`缓存请求结果。使用`stale while revalidate`内存缓存策略

```
概览

- 缓存和queryKey的hash值对应
- 默认情况下，成功请求后缓存结果立即过期（但不会被删除，见下文），这个行为可以通过配置staleTime这个option来改变
- queryKey改变了的话，vue-query会自动请求，他会首先检查这个queryKey有没有对应的缓存，有缓存并且缓存数据没有过期的话，直接返回缓存值，不再请求。如果缓存过期了，就返回缓存值，并重新请求并更新缓存值。
- 默认的缓存时间是5分钟，默认情况下缓存会在5分钟后从内存中释放。这个选项可以通过配置cacheTime来改变

以下以cacheTime为5分钟，staleTime为0举个例子
- 我们调用了一个新的useQuery('todos',fetchTodoFn)。
    - 因为是第一次使用这个queryKey，所以isLoading会为true，isFetching也是true，然后执行网络请求。
    - 获取请求后，以queryKey的hash值，作为缓存的标识符。把数据缓存起来。
    - 根据statleTime来决定这个缓存何时过期。默认是0，所以会立即过期。
- 在其他地方我们再次调用了useQuery，使用相同的queryKey
    - 由于缓存中有相应的缓存数据，所以这个请求会立即从缓存中返回数据。
    - 检查缓存是否过期，过期了就请求一下服务端，拿到最新的数据。
- 5分钟后删除缓存的数据。
```

# useMutation

和`useQuery`不同，`useMutation`一般用来执行 POST 请求，用来创建，更新，删除数据。
useMutation 的请求不会参与缓存处理。
基础 mutation

```tsx
import { defineComponent } from "vue";
const App = defineComponent({
    setup() {
        const mutation = useMutation(() => Promise.resolve("dd"));
        const requestData = () => {
            console.log("we will request data");
            mutation.mutate();
        };
        return () => {
            return <div onClick={requestData}>点击获取数据。数据： {mutation.data}</div>;
        };
    },
});
```

带参数的 mutation 以及带 callback 的 mutation 示例。

可以给示例的 mutation.mutate 方法传递一个值，这个值作为 useMutationFn 的参数去请求服务端。

useMutation 可以有 onSuccess onError 等 callback，mutation.mutate 的第二个参数也可以传入这些 callback。 mutation.mutate 的 callback 会覆盖 useMutation 的 callback

```tsx
import { defineComponent } from "vue";
const App = defineComponent({
    setup() {
        // 使用传来的todo向服务端请求新建一个todo
        const createTodoMutation = useMutation(
            (todo: { title: string }) =>
                Axios.post({
                    url: "/api/createTodo",
                    data: todo,
                }),
            {
                onSuccess: (data) => {
                    alert("创建成功！");
                },
            }
        );
        return () => {
            return (
                <div
                    onClick={() => {
                        // 传递一个todo
                        createTodoMutation.mutate(
                            { title: "write doc!" },
                            {
                                // mutate的回调会覆盖useMutation的回调。上面的回调不会生效
                                onSuccess: (data) => {
                                    alert("我会覆盖掉上面的onSuccess回调");
                                },
                            }
                        );
                    }}
                >
                    点击创建todo
                </div>
            );
        };
    },
});
```

### 乐观更新

onMutate 先进行乐观更新，并返回一个 rollback 函数，在 onError 或者 onSettled 函数中回滚更新。

```tsx
const hook = renderHook(() => {
    const count = ref(0);
    const mutation = useMutation((pa: number) => Promise.reject("err"), {
        onMutate: (variable) => {
            count.value++;
            // 返回rollback函数
            return () => {
                count.value--;
            };
        },
        onError: (error, variable, rollback) => {
            rollback();
        },
    });
    return { mutation };
});
```

# api 指南

## `useQuery`

useQuery 通常用于幂等 get 请求。具有自动重试，自动重新获取数据，自动缓存等功能。

```tsx
const query = useQuery(queryKey, queryFn, config);
```

### 参数

-   `queryKey` any | Ref<any>
    -   **Required**
    -   用来缓存以及获取数据的唯一 key。
    -   如果需要在 queryKey 改变时，重新请求，你需要使用 computed()生成一个 ref 值，传入。
-   `queryFn`: (...args)=>Promise<Data> & {cancel: ()=>void}

    -   **Required**
    -   使用这个函数来请求数据
    -   按序接收 queryKey 的值作为参数。举个例子，queryKey 不是数组时： useQueryKey('todo',(todo: string)=>Promise.resolved('data))

        queryKey 是数组时 useQueryKey(['todo',2],(todo: string,page: number)=>Promise.resolved('data))

    -   必须返回一个 Promise，可选带有一个 cancel 方法，来取消请求。

-   `config`: 请求配置对象，
    -   `enabled`: boolean
        -   如果是 falsy 值，调用后不会进行请求。当使用此选项时，需要传入 ref 类型的 config，否则无法观察它的变动。
        -   默认为 true。
    -   `retry`: int | false | (failCount: number,error: any)=>boolean
        -   请求失败时，使用此选项进行重试。
        -   为 false 时，不会重新请求。
        -   设置为 int 时，重试指定的次数。
        -   设置为函数时，将会根据函数返回的 boolean 值来决定是否重试
        -   默认值为 3
    -   `retryDelay`: (retryCount: number)=>number
        -   接受请求的重试次数为参数，返回值来决定下次重试的延迟时间。
        -   默认值为`attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)`
    -   `staleTime`: number
        -   设置缓存的过期时间，过期后请求时将会先返回缓存值再请求，如果尚未过期，则只返回缓存值，不再请求。
        -   默认值为 0，缓存生成后会立即过期
    -   `cacheTime`: number
        -   缓存在内存中存在的时间。超时了自动被清理掉。
        -   默认值是 5*60*1000，也就是 5 分钟。
    -   `initialData`: any | () => any
        -   设置初始值，在首次请求时不再请求，直接返回 initialData。
        -   默认值 undefined
    -   `onSuccess`: (data:Data)=>viud
        -   promise 成功后的回调函数。
        -   默认值()=>{}
    -   `onError`: (error: Error)=>void
        -   promise 失败后的回调函数
        -   默认值()=>{}
    -   `refetchOnReconnect`: boolean
        -   断网重连后是否重新请求服务端数据
        -   默认值 true
    -   `refetchOnWindowFocus`: boolean
        -   浏览器 tab 重新获得焦点后是否重新请求服务端数据
        -   默认值 true
    -   `refetchInterval`: number | false
        -   是否轮询数据，设置为 number 时以这个毫秒数轮询服务端，设置为 false 时取消轮询，注意你可能需要传入 Ref 类型的 config 来动态改变此选项。
        -   默认值 false
    -   `refetchIntervalInBackground`: boolean
        -   是否在当前浏览器 tab 不在前台时轮询。因为不在前台状态下轮询，很多时候没有意义。
        -   默认值 false
-   query：useQuery 返回值,注意返回值尽量不要使用解构赋值去结构，可能会**丢失响应性**
    -   `data`: Data | undefined
        -   queyFn 返回的 promise resolved 的数据
        -   默认值 undefined
    -   `error`: Error | undefined
        -   queryFn 返回的 promise rejected 的数据
        -   默认值 undefined
    -   `isError`: boolean
        -   默认值 false
    -   `isSuccess`: boolean
        -   默认值 false
    -   `isLoading`: false
        -   默认值 false
    -   `status`: "loading" | "error" | "success" | "idle"
        -   对上面三个状态的一个封装，初始状态时 idle，请求结束后状态也是 idle
        -   默认值 "idle"
    -   `retryCount`: number
        -   请求失败后的重试次数。
        -   默认值 0
    -   `isFetching`: boolean
        -   是否正在请求，容易跟`isLoading`混淆，区别在于，在缓存过期时请求 isFetching 为 true，isLoading 为 false。isLoading 仅在首次无缓存请求时为 true。
        -   默认值为 false
    -   `refetch`: (option: RefetchOption)=>void
        -   RefetchOption: {force?: boolean}，当 force 设置为 true 时，将会忽略缓存处理直接请求。
    -   `cancel`: ()=>void
        -   取消请求，仅当 queryFn 返回的 Promise 有 cancel 方法时可用。你需要通过 cancelToken 等方式自定义一个 promise.cancel 方法

# useMutation

一般用于 post 请求，只有在调用返回值的 mutate 方法时才执行。

```tsx
import { defineComponent } from "vue";

const App = defineComponent({
    setup() {
        const mutation = useMutation(() => Promise.resolve("data"), {
            onError: () => void 0,
            onSuccess: () => void 0,
            onSettled: () => void 0,
            onMutate: () => void 0,
        });
        return () => {
            // 注意不要直接写成onClick={mutation.mutate}, 这样mutate方法会被传入一个event对象
            return <div onClick={() => mutation.mutate()}></div>;
        };
    },
});
```

### 参数

-   mutationFn: (variable)=>Promise<Data>
    -   mutationFn 返回 Promise，通过它来发起请求，参数由返回值的 mutate 方法传入
-   config: object
    ```tsx
    type PlainMutationConfig<Variable, Data, Error, MutateValue = any> = {
        // 发送请求时触发
        onMutate?: (variable?: Variable) => MutateValue;
        onSuccess?: (data: Data, variable?: Variable) => void;
        onError?: (error: Error, variable?: Variable, mutableValue?: MutateValue) => void;
        // 请求结束后触发
        onSettled?: (data: Data | undefined, error: Error | undefined, variable?: Variable, mutableValue?: MutateValue) => void;
    };
    ```
-   mutation: 返回值
    -   data: Data | undefined
        -   返回的数据，默认 undefined
    -   error: Error | undefined
        -   错误信息， 默认 undefined
    -   isError: boolean
    -   isLoading: boolean
    -   isSuccess: boolean
    -   status: "loading" | "success" | "error"
    -   reset: ()=>void
        -   初始化状态，将 data,error,isError,isSuccess,status 设置为

# VueQueryProvider

context，用于配置全局 config，可以在这里设置全局的 config，例如设置全局的 stateTime。

```tsx
const Child = defineComponent({
    setup() {
        // useQuery将会使用staleTime5000的config
        const query = useQuery("api/test", jest.fn().mockResolvedValue("dd"));
        return () => <div></div>;
    },
});
const Parent = defineComponent({
    setup() {
        return () => (
            <div>
                <VueQueryProvider config={{ staleTime: 5000 }}>
                    <Suspense>
                        <Child />
                    </Suspense>
                </VueQueryProvider>
            </div>
        );
    },
});
```

# useIsFetching

返回是否全局中有请求正在处理。

```tsx
import { useIsFetching } from "@jueinin/vue-query";
const isFetching: Ref<boolean> = useIsFetching();
```
