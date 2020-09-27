import { CancelablePromise, MutationResult, PlainMutationConfig, QueryStatus } from "../core/types";
import { Mutation } from "../core/mutation";
// todo add rollback fn for optimization update, and handle the optional Variable generic
export const useMutation = <Variable, Data, Error>(
    mutationFn: (variable: Variable)=> CancelablePromise<Data>,
    config?: PlainMutationConfig<Variable, Data, Error>
) => {
    return new Mutation(mutationFn, config).result;
};
