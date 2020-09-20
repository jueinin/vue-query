import { defineComponent, inject, Ref } from "vue"
import { VueQueryProvider } from "../VueQueryProvider"
import { PlainBaseQueryConfig } from "../../core/types"
import { mount } from "@vue/test-utils"

describe("test the provider",()=> {
    test("child should get config of parent provider",async ()=> {
        const Child = defineComponent({
            setup() {
                const config: Ref<PlainBaseQueryConfig> | undefined = inject('config')
                expect(config!.value).toEqual({enabled: false})
                return ()=><div class="fvhg">
                    test
                </div>
            }
        })
        const Parent = defineComponent({
            setup() {
                return ()=> {
                    return <div>
                        <VueQueryProvider config={{enabled: false}}>
                            <Child/>
                        </VueQueryProvider>
                    </div>
                }
            }
        })
        const hook = mount(Parent)
        console.log("sda")
    })
})