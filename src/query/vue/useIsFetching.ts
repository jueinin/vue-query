import {queryGlobal} from "../core/queryGlobal";
import { Ref, computed} from 'vue-demi';

export const useIsFetching = (): Ref<boolean> => {
    return computed(()=>{
        return queryGlobal.isFetching
    })
};