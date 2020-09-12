import {queryGlobal} from "@/query/core/queryGlobal";
import { reactive, Ref, toRef, computed, ref} from 'vue';

export const useIsFetching = (): Ref<boolean> => {
    return computed(()=>{
        return queryGlobal.isFetching
    })
};