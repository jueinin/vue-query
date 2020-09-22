import { defineComponent, inject, Ref, Suspense } from "vue-demi";
import { VueQueryProvider } from "../VueQueryProvider";
import { PlainBaseQueryConfig } from "../../core/types";
import { mount, flushPromises } from "@vue/test-utils";
import { useQuery } from "../useQuery";
const renderWithContext = (config: PlainBaseQueryConfig, setup: any) => {
    const Child = defineComponent({
        setup,
    });
    const Parent = defineComponent({
        setup() {
            return () => (
                <div>
                    <VueQueryProvider config={config}>
                        <Suspense>
                            <Child />
                        </Suspense>
                    </VueQueryProvider>
                </div>
            );
        },
    });
    return mount(Parent);
};
describe("test the provider", () => {

    test("child should get config of parent provider", async () => {
        const config = { enabled: false };
        const wrapper = renderWithContext(config, () => {
            const configRef: Ref<PlainBaseQueryConfig> | undefined = inject("vueQueryConfig");
            expect(configRef!.value).toEqual(config);
            return () => <div></div>;
        });
        wrapper.unmount()
    });
    test("user defined config should override context config", async () => {
        const onSuccess = jest.fn();
        const config: PlainBaseQueryConfig = { onSuccess };
        const wrapper = renderWithContext(config, async () => {
            useQuery("ddd", () => Promise.resolve("dd"));
            await flushPromises();
            expect(onSuccess).toHaveBeenCalledTimes(1);
            return () => <div></div>;
        });
        wrapper.unmount()
    });
});
