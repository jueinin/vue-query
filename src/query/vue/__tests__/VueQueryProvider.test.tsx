import { defineComponent, inject, Ref, Suspense } from "vue";
import { VueQueryProvider } from "../VueQueryProvider";
import { PlainBaseQueryConfig } from "../../core/types";
import { mount, flushPromises } from "@vue/test-utils";
import { useQuery } from "../useQuery";
describe("test the provider", () => {
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
    test("child should get config of parent provider", async () => {
        const config = { enabled: false };
        renderWithContext(config, () => {
            const configRef: Ref<PlainBaseQueryConfig> | undefined = inject("vueQueryConfig");
            expect(configRef!.value).toEqual(config);
            return () => <div></div>;
        });
    });
    test("user defined config should override context config", async () => {
        const onSuccess = jest.fn();
        const config: PlainBaseQueryConfig = { onSuccess };
        renderWithContext(config, async () => {
            useQuery("ddd", () => Promise.resolve("dd"));
            await flushPromises();
            expect(onSuccess).toHaveBeenCalledTimes(1);
            return () => <div></div>;
        });
    });
});
