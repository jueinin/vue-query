import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
const extensions = [".ts", ".tsx"];
export default [
    {
        input: "src/query/index.ts",
        output: [
            {
                file: "build/lib/index.js",
                format: "cjs",
            },
            {
                file: "build/es/index.js",
                format: "es",
            },
        ],
        plugins: [
            resolve({
                extensions,
            }),
            typescript({
                tsconfig: "tsconfig.build.json",
            }),
        ],
        external: ["vue","vue-demi"],
    },
];
