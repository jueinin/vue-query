import { delay, getQueryArgs, getValueFromRefOrNot } from "@/query/utils";
import { defaultConfig } from "@/query/core/config";
import flushPromises from "flush-promises/index";
import { mount } from "@vue/test-utils";
import { ref, watch, Ref, computed } from "vue";
import { renderHook } from "../../../tests/utils";
import { pipe } from "fp-ts/pipeable";
import { array } from "fp-ts";

describe("test utils function", () => {
    describe("getQueryArgs", () => {
        it("should parse different forms of params ", function () {
            const fn = jest.fn().mockResolvedValue("dd");
            pipe(
                getQueryArgs("key", fn),
                (a) => [a[0], a[2]],
                array.map((v) => v.value),
                (c) => expect(c).toEqual(["key", defaultConfig])
            );
            pipe(
                getQueryArgs([1, 2, 3, null], fn, { retry: 4 }),
                (a) => [a[0], a[2]],
                array.map((v) => v.value),
                (c) => expect(c).toEqual([[1, 2, 3, null], Object.assign({}, defaultConfig, { retry: 4 })])
            );
            pipe(
                getQueryArgs({
                    queryKey: [{ dd: "d" }],
                    queryFn: fn,
                    config: { retry: 5 },
                }),
                (a) => [a[0], a[2]],
                array.map((v) => v.value),
                (c) => expect(c).toEqual([[{ dd: "d" }], Object.assign({}, defaultConfig, { retry: 5 })])
            );
        });
    });
    it("should delay some ms to exec", async function () {
        jest.useFakeTimers();
        const fn = jest.fn();
        delay(200).then(fn);
        jest.advanceTimersByTime(200);
        await flushPromises();
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
