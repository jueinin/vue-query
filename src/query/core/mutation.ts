import { CancelablePromise, MutationResult, PlainMutationConfig, QueryStatus } from "./types";
import { defaultMutationConfig } from "./config";
import { reactive } from "vue-demi";

export class Mutation<Data, Error, Variable> {
    result: MutationResult<Data, Error, Variable>;

    resolvedConfig: typeof defaultMutationConfig;
    defaultMutationResult: Partial<MutationResult<Data, Error, Variable>> = {
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        isLoading: false,
        status: QueryStatus.Idle,
    };
    constructor(public mutationFn: (variable: Variable) => CancelablePromise<Data>, config?: PlainMutationConfig<Variable, Data, Error>) {
        const self = this;
        this.resolvedConfig = Object.assign({}, defaultMutationConfig, config);
        this.result = reactive({
            data: undefined,
            error: undefined,
            isError: false,
            isSuccess: false,
            isLoading: false,
            status: QueryStatus.Idle,
            cancel: () => {
                console.warn("you should pass a cancel property to promise first.");
            },
            reset: self.reset,
            mutate: self.mutate,
        });
    }
    setSuccessStatus = (value: Data): void => {
        this.result.data = value;
        this.result.isSuccess = true;
        this.result.status = QueryStatus.Success;
    };
    setErrorStatus = (error: Error) => {
        this.result.error = error;
        this.result.isError = true;
        this.result.status = QueryStatus.Error;
    };
    reset = () => {
        Object.assign(this.result, this.defaultMutationResult);
    };
    mutate = (variable: Variable, config?: PlainMutationConfig<Variable, Data, Error>) => {
        this.result.status = QueryStatus.Loading;
        this.result.isLoading = true;
        let rollback:any;
        if (config?.onMutate) {
            rollback = config.onMutate(variable);
        } else {
            rollback = this.resolvedConfig.onMutate(variable);
        }
        const promise = this.mutationFn(variable);
        if (promise.cancel) {
            this.result.cancel = promise.cancel;
        }
        return promise
            .then((value: Data) => {
                this.setSuccessStatus(value);
                if (config?.onSuccess) {
                    config.onSuccess(value, variable);
                } else {
                    this.resolvedConfig.onSuccess(value, variable);
                }
                return value;
            })
            .catch((error: any) => {
                this.setErrorStatus(error);
                if (config?.onError) {
                    config.onError(error, variable,rollback);
                } else {
                    this.resolvedConfig.onError(error, variable,rollback);
                }
                return error;
            })
            .finally(() => {
                if (config?.onSettled) {
                    config.onSettled(this.result.data, this.result.error, variable,rollback);
                } else {
                    this.resolvedConfig.onSettled(this.result.data, this.result.error, variable,rollback);
                }
                this.result.isLoading = false;
            });
    };
}
