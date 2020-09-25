import { Ref, computed} from 'vue-demi';
import { queryManager } from "../core/queryManager";

export const useIsFetching = (): Ref<boolean> => {
    return computed(()=>{
        return queryManager.queryList.some(value => value.result.isFetching === true);
    })
};