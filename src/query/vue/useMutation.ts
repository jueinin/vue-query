import { MutationResult, PlainMutationConfig, QueryStatus } from "@/query/core/types";
import { defaultMutationConfig } from "@/query/core/config";
import { reactive, ref } from "vue";

export const getMutationConfig = () => {};
export const useMutation = <Variable, Data, Error, MutableValue>(
    mutationFn: (variable: Variable) => Promise<Data>,
    config?: PlainMutationConfig<Variable, Data, Error, MutableValue>
) => {
    const actualConfig: typeof defaultMutationConfig = Object.assign({}, defaultMutationConfig, config);
    const defaultMutationResult: MutationResult<Data, Error> = {
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        isLoading: false,
        status: QueryStatus.Idle,
    };
    const result: MutationResult<Data, Error> = reactive({
        data: undefined,
        error: undefined,
        isError: false,
        isSuccess: false,
        isLoading: false,
        status: QueryStatus.Idle,
    });
    const mutableValueRef = ref<MutableValue | undefined>(undefined);
    const setSuccessStatus = (value: Data, variable: Variable): void => {
        result.data = value;
        result.isSuccess = true;
        result.status = QueryStatus.Success;
        actualConfig.onSuccess(value, variable);
    };
    const setErrorStatus = (error: Error, variable: Variable) => {
        result.error = error;
        result.isError = true;
        result.status = QueryStatus.Error;
        actualConfig.onError(error, variable, mutableValueRef.value);
    };

    const mutate = (variable: Variable) => {
        result.status = QueryStatus.Loading;
        result.isLoading = true;
        mutableValueRef.value = actualConfig.onMutate(variable);
        mutationFn(variable)
            .then((value) => {
                setSuccessStatus(value, variable);
            })
            .catch((error: Error) => {
                setErrorStatus(error, variable);
            })
            .finally(() => {
                actualConfig.onSettled(result.data, result.error, variable, mutableValueRef.value);
                result.isLoading = false;
            });
    };
    const reset = () => {
        Object.assign(result, defaultMutationResult);
    };
    return {result,reset,mutate}
};
