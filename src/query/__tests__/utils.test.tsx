import {  getQueryArgs } from "../utils";
import { defaultConfig } from "../core/config";
import { pipe } from "fp-ts/pipeable";
import { array } from "fp-ts";
import objectHash from "object-hash";
describe("test utils function", () => {
    describe("getQueryArgs", () => {
        it("should parse different forms of params", function () {
            const fn = jest.fn().mockResolvedValue("dd");
            pipe(
                getQueryArgs({args: ["key", fn],contextConfigRef: undefined}),
                (a) => [a[0], a[2]],
                array.map((v) => v.value),
                (c) => expect(c).toEqual(["key", defaultConfig])
            );
            pipe(
                getQueryArgs({args: [[1, 2, 3, null], fn, { retry: 4 }],contextConfigRef: undefined}),
                (a) => [a[0], a[2]],
                array.map((v) => v.value),
                (c) => expect(c).toEqual([[1, 2, 3, null], Object.assign({}, defaultConfig, { retry: 4 })])
            );
            pipe(
                getQueryArgs({
                    args: [{
                        queryKey: [{ dd: "d" }],
                        queryFn: fn,
                        config: { retry: 5 },
                    }],
                    contextConfigRef: undefined
                }),
                (a) => [a[0], a[2]],
                array.map((v) => v.value),
                (c) => expect(c).toEqual([[{ dd: "d" }], Object.assign({}, defaultConfig, { retry: 5 })])
            );
        });
    });
});
