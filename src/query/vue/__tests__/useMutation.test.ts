import { renderHook } from "../../../../tests/utils";
import { useMutation } from "../useMutation";
import flushPromises from "flush-promises/index";
import { CancelablePromise, QueryStatus } from "../../core/types";

const variableValue = "ddd";
const response = "dd";
describe("useMutation", () => {
    const setUp = () => {
        const fn = jest.fn().mockResolvedValue(response);
        const onMutate = jest.fn();
        const onSuccess = jest.fn();
        const onSettled = jest.fn();
        const onError = jest.fn();
        const hook = renderHook(() => {
            const mutation = useMutation(fn, {
                onError: onError,
                onSuccess: onSuccess,
                onSettled: onSettled,
                onMutate: onMutate,
            });
            return { mutation };
        });
        return { fn, onSuccess, onError, onSettled, onMutate, hook };
    };
    describe("callback should be called normally.", () => {
        it("should execute onMutate callback when mutate method is called", async function () {
            const { hook, onMutate } = setUp();
            hook.vm.mutation.mutate(variableValue);
            expect(onMutate.mock.calls).toEqual([[variableValue]]);
        });
        it("should execute onSettled when status is error or success", async function () {
            const { hook, onSettled } = setUp();
            hook.vm.mutation.mutate(variableValue);
            await flushPromises();
            expect(onSettled).toHaveBeenCalledTimes(1);
        });
        it("return value of onMutate will be passed on onSettled and onError for easily optimistic update", async function () {
            const { hook, fn, onError, onSettled } = setUp();
            hook.vm.mutation.mutate(variableValue);
            await flushPromises();
            expect(onSettled.mock.calls).toEqual([[response, undefined, variableValue,undefined]]);
            fn.mockRejectedValue("err");
            hook.vm.mutation.mutate(variableValue);
            await flushPromises();
            expect(onError.mock.calls).toEqual([["err", variableValue,undefined]]);
        });
    });

    it("data,error,loading and Idle state", async function () {
        const { hook, fn } = setUp();
        const mutation = hook.vm.mutation;
        expect(mutation.status).toEqual(QueryStatus.Idle);
        hook.vm.mutation.mutate(variableValue);
        expect(mutation.isLoading).toEqual(true);
        expect(mutation.status).toEqual(QueryStatus.Loading);
        await flushPromises();
        expect(mutation.isSuccess).toEqual(true);
        expect(mutation.status).toEqual(QueryStatus.Success);
        fn.mockRejectedValue("err");
        mutation.mutate(variableValue);
        await flushPromises();
        expect(mutation.status).toEqual(QueryStatus.Error);
        expect(mutation.isError).toEqual(true);
    });
    it("reset should reset state to normal,that is Idle state", async function () {
        const {
            hook: {
                vm: { mutation },
            },
        } = setUp();
        await flushPromises();
        mutation.reset();
        expect(mutation).toEqual(
            expect.objectContaining({
                isError: false,
                isLoading: false,
                isSuccess: false,
                status: QueryStatus.Idle,
            })
        );
    });
    test("mutation config should override useMutation config", async () => {
        const useMutationMutate = jest.fn();
        const mutateOnMutate = jest.fn();
        const hook = renderHook(() => {
            const mutation = useMutation(() => Promise.resolve("ds"), {
                onMutate: useMutationMutate,
            });
            return { mutation };
        });
        hook.vm.mutation.mutate(null, {
            onMutate: mutateOnMutate,
        });
        await flushPromises();
        expect(useMutationMutate).toHaveBeenCalledTimes(0);
        expect(mutateOnMutate).toHaveBeenCalledTimes(1);
    });
    it("should cancel request", async function () {
        const cancelFn = jest.fn();
        const hook = renderHook(() => {
            const mutation = useMutation(() => {
                const promise: CancelablePromise<string> = Promise.resolve("data");
                promise.cancel = cancelFn;
                return promise;
            });
            return { mutation };
        });
        await flushPromises();
        await hook.vm.mutation.mutate(undefined);
        hook.vm.mutation.cancel();
        expect(cancelFn).toHaveBeenCalledTimes(1);
    });
    test("it can rollback update on onError callback ",async ()=> {
        let count = 0;
        const hook = renderHook(() => {
            const mutation = useMutation((pa: number) => Promise.reject("err"), {
                onMutate: variable => {
                    count++;
                    return () => {
                        count--;
                    };
                },
                onError: (error, variable, rollback) => {
                    rollback();
                }
            });
            return { mutation };
        });
        hook.vm.mutation.mutate(2);
        expect(count).toEqual(1);
        await flushPromises();
        expect(count).toEqual(0);
    })
});
