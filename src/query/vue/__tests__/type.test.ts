test("tuple", () => {
    // const a: ReadonlyArray<readonly []> = [[1,2]];
    const s: [] = [1, 2, 3]; // 这个readonly 居然可以成tuple 难以理解
    function myFunction<P extends Array<any> | []>(fn: (...params: P) => any, options: { params: P }) {
        fn(...options.params);
    }
    myFunction((a,b)=>console.log(a,b),{
        params: [1, "d"]
    })
});
