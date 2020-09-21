import resolve from "rollup-plugin-node-resolve"
import typescript from "rollup-plugin-typescript2"
import babel from '@rollup/plugin-babel'
const extensions = ['.ts','.tsx']
export default [
    // {
    //     input: 'src/query/index.ts',
    //     output: {
    //         file: "build/es/vue-query.es.js",
    //         format: "es"
    //     },
    //     plugins: [
    //         resolve({
    //             extensions
    //         }),
    //         typescript()
    //     ],
    // },
    {
        input: 'src/query/index.ts',
        output: {
            file: "build/index.js",
            format: "cjs"
        },
        plugins: [
            resolve({
                extensions
            }),
            typescript()
        ],
    }
]