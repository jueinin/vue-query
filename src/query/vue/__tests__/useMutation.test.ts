import { renderHook } from "../../../../tests/utils";
import { useMutation } from "../useMutation";
import flushPromises from "flush-promises/index";
import { QueryStatus } from "../../core/types";

const variableValue = "ddd";
const response = "dd";
const mutateValue = "mutateValue";
describe("useMutation", () => {
    const setUp = () => {
        const fn = jest.fn().mockResolvedValue(response);
        const onMutate = jest.fn((_variable) => mutateValue);
        const onSuccess = jest.fn((_data, _variable) => void 0);
        const onSettled = jest.fn((_data, _error, _variable, _mutableValue) => {});
        const onError = jest.fn((_error, _variable, _mutableValue) => {});
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
            expect(onSettled.mock.calls).toEqual([[response, undefined, variableValue, mutateValue]]);
            fn.mockRejectedValue("err");
            hook.vm.mutation.mutate(variableValue);
            await flushPromises();
            expect(onError.mock.calls).toEqual([["err", variableValue, mutateValue]]);
        });
    });

    it("data,error,loading and Idle state", async function () {
        const { hook, fn } = setUp();
        const mutation = hook.vm.mutation;
        expect(mutation.result.status).toEqual(QueryStatus.Idle);
        hook.vm.mutation.mutate(variableValue);
        expect(mutation.result.isLoading).toEqual(true);
        expect(mutation.result.status).toEqual(QueryStatus.Loading);
        await flushPromises();
        expect(mutation.result.isSuccess).toEqual(true);
        expect(mutation.result.status).toEqual(QueryStatus.Success);
        fn.mockRejectedValue("err");
        mutation.mutate(variableValue);
        await flushPromises();
        expect(mutation.result.status).toEqual(QueryStatus.Error);
        expect(mutation.result.isError).toEqual(true);
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
                result: {
                    isError: false,
                    isLoading: false,
                    isSuccess: false,
                    status: QueryStatus.Idle,
                },
            })
        );
    });
    test("mutation config should override useMutation config",async ()=> {
        const useMutationMutate = jest.fn()
        const mutateOnMutate = jest.fn()
        const hook = renderHook(()=>{
            const mutation = useMutation(()=>Promise.resolve("ds"),{
                onMutate: useMutationMutate
            })
            return {mutation}
        })
        hook.vm.mutation.mutate(null,{
            onMutate: mutateOnMutate
        })
        await flushPromises()
        expect(useMutationMutate).toHaveBeenCalledTimes(0)
        expect(mutateOnMutate).toHaveBeenCalledTimes(1)
    })
});
