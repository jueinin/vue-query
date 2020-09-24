import { CancelablePromise, MutationResult, PlainMutationConfig, QueryStatus } from "../core/types";
import { defaultMutationConfig } from "../core/config";
import { reactive, ref } from "vue-demi";
// todo add rollback fn for optimization update, and handle the optional Variable generic
export const useMutation = <Variable, Data, Error, MutableValue>(
    mutationFn: (variable: Variable) => CancelablePromise<Data>,
    config?: PlainMutationConfig<Variable, Data, Error>
) => {
    const actualConfig: typeof defaultMutationConfig = Object.assign({}, defaultMutationConfig, config);
    const defaultMutationResult: Partial<MutationResult<Data, Error, Variable>> = {
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        isLoading: false,
        status: QueryStatus.Idle,
    };
    const result: Partial<MutationResult<Data, Error, Variable>> = reactive({
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        isLoading: false,
        status: QueryStatus.Idle,
        cancel: () => {
            console.warn("you should pass a cancel property to promise first.");
        },
        reset: () => {
            Object.assign(result, defaultMutationResult);
        },
    });
    const setSuccessStatus = (value: Data): void => {
        result.data = value;
        result.isSuccess = true;
        result.status = QueryStatus.Success;
    };
    const setErrorStatus = (error: Error) => {
        result.error = error;
        result.isError = true;
        result.status = QueryStatus.Error;
    };
    result.mutate = (variable: Variable, config?: PlainMutationConfig<Variable, Data, Error>) => {
        result.status = QueryStatus.Loading;
        result.isLoading = true;
        if (config?.onMutate) {
            config.onMutate(variable);
        } else {
            actualConfig.onMutate(variable);
        }
        const promise = mutationFn(variable);
        if (promise.cancel) {
            result.cancel = promise.cancel;
        }
        return promise
            .then((value) => {
                setSuccessStatus(value);
                if (config?.onSuccess) {
                    config.onSuccess(value, variable);
                } else {
                    actualConfig.onSuccess(value, variable);
                }
                return value;
            })
            .catch((error: any) => {
                setErrorStatus(error);
                if (config?.onError) {
                    config.onError(error, variable);
                } else {
                    actualConfig.onError(error, variable);
                }
                return error;
            })
            .finally(() => {
                if (config?.onSettled) {
                    config.onSettled(result.data, result.error, variable);
                } else {
                    actualConfig.onSettled(result.data, result.error, variable);
                }
                result.isLoading = false;
            });
    };
    return result as MutationResult<Data, Error, Variable>;
};
