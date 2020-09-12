import Vue, {defineComponent} from 'vue'
import { mount } from '@vue/test-utils'

export function renderHook<V, Props = unknown, Data = unknown>(
    setup: () => V,
) {
    const App = defineComponent({
        setup,
        template: '<div ref="app" id="app"></div>',
    })

    return mount<typeof Vue & V>(App as any)
}