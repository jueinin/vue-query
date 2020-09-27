import { CancelablePromise, MutationResult, PlainMutationConfig, QueryStatus } from "../core/types";
import { Mutation } from "../core/mutation";
export const useMutation = <Variable, Data, Error>(
    mutationFn: (variable: Variable)=> CancelablePromise<Data>,
    config?: PlainMutationConfig<Variable, Data, Error>
) => {
    return new Mutation(mutationFn, config).result;
};
