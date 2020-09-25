<script lang="tsx">
import {defineComponent, reactive} from 'vue'
export default defineComponent({
  setup() {
    const state = reactive({
      count: {
        count: 2
      }
    });
    const countObj = state.count;
    const changeCount = () => countObj.count++;
    return () => {
      return <div>
        <div>{state.count.count}</div>
        <button onClick={()=>changeCount()}>change count</button>
      </div>
    }
  }
})
</script>
