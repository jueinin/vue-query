export type QueryKey =
    string
    | number
    | boolean
    | object
    | null
    | undefined
    // | { [key: string]: QueryKey }
    // | { [key: number]: QueryKey }
    | any[];
// export type Thenable<Value, Return> = { then: (value: Value) => Return } & object;
export type QueryFn = <Parameter extends Array<any>,Value=unknown>(...args: Parameter)=> Promise<Value>
export type QueryConfig<TResult=any, TError = unknown, TData = TResult> = {
    retry?: boolean | number | ((failCount: number, error: TError) => boolean)
    initialData?: TResult | (() => TResult)
};

export enum QueryStatus {
    Loading = "loading",
    Error = 'error',
    Success = 'success'
}

export type QueryResult<Result=any,Error=any> = {
    data: Result| undefined,
    error: Result | undefined
    failCount: number
    isError: boolean,
    isFetching: boolean,
    isLoading: boolean,
    status: QueryStatus
}
export type UseQueryObjectConfig<Result=any,Error=any> = {
    queryKey: QueryKey,
    queryFn: QueryFn,
    config?: QueryConfig<Result, Error>
}