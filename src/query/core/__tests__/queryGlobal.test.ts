import { queryGlobal } from "../queryGlobal";

describe("query global", () => {
    test("isFetching should react to arr.length", function () {
        expect(queryGlobal.isFetching).toEqual(false);
        queryGlobal.addIsFetching();
        expect(queryGlobal.isFetching).toEqual(true);
        queryGlobal.addIsFetching();
        expect(queryGlobal.isFetching).toEqual(true);
        queryGlobal.removeIsFetching();
        expect(queryGlobal.isFetching).toEqual(true);
        queryGlobal.removeIsFetching();
        expect(queryGlobal.isFetching).toEqual(false);
    });
});
