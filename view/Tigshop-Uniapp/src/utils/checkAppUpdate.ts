import { useAppVersionStore } from "@/store/appVersion";

export default function checkAppUpdate() {
    const appVersionStore = useAppVersionStore();
    appVersionStore
        .getAppUpdateStatus()
        .then((res: string) => {
            console.log("App update check result:", res);
            if (res) {
                appVersionStore.setShowUpdateAppPop(true);
                appVersionStore.setUpdateUrl(res);
            }
        })
        .catch((err) => {
            console.error("App update check failed:", err);
        });
}
