import Vue, {defineComponent} from 'vue'
import { shallowMount } from '@vue/test-utils'

export function renderHook<V, Props = unknown, Data = unknown>(
    setup: () => V,
) {
    const App = defineComponent({
        setup,
        template: '<div ref="app" id="app"></div>',
    })

    return shallowMount<typeof Vue & V>(App as any)
}