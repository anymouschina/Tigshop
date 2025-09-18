import { ref, reactive } from "vue";
function defaultClone(value) {
    if (typeof value !== "object" || value === null)
        return value;
    return JSON.parse(JSON.stringify(value));
}
export function useResetReactive(value, clone = defaultClone) {
    const state = reactive(clone(value));
    const reset = () => {
        const clonedValue = clone(value);
        Object.keys(state).forEach((key) => {
            if (key in clonedValue) {
                state[key] = clonedValue[key];
            }
            else {
                delete state[key];
            }
        });
    };
    return [state, reset];
}
export function useResettableRef(value, clone = defaultClone) {
    const state = ref(clone(value));
    const reset = () => {
        state.value = clone(value);
    };
    return [state, reset];
}
//# sourceMappingURL=useResetState.js.map