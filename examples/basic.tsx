import {defineComponent} from 'vue'
import {useQuery} from "../src/query";
const Basic = defineComponent({
    setup() {
        const query = useQuery('dd',(key)=>Promise.resolve("ds"))
    }
})