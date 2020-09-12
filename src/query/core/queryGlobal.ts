import { reactive } from 'vue';

class QueryGlobal {
    isFetchingArr: number[] = [];
    isFetching = false;
    addIsFetching() {
        this.isFetchingArr.push(1);
        this.isFetching = true;
    }
    removeIsFetching() {
        this.isFetchingArr.pop();
        if (this.isFetchingArr.length <= 0) {
            this.isFetching = false;
        }
    }
}

export const queryGlobal = reactive(new QueryGlobal())
