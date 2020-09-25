import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import commonjs from '@rollup/plugin-commonjs';
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
            commonjs()
        ],
        external: ["vue","vue-demi"],
    },
];
