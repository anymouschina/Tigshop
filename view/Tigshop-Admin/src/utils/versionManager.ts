import { version } from '../../package.json'
import { useUserStore } from "@/store/user";
const store = useUserStore() as any;
interface VersionManagerOptions {
    storageKey?: string
    forceRefresh?: boolean
    clearOnMismatch?: boolean
}

const DEFAULT_OPTIONS = {
    storageKey: 'version',
    forceRefresh: true,
    clearOnMismatch: true
}

export function useVersionManager(options?: VersionManagerOptions) {
    const config = { ...DEFAULT_OPTIONS, ...options }
    const currentVersion = version

    const clearStorage = () => {
        store.logout();
    }

    const checkVersion = () => {
        const storedVersion = localStorage.getItem(config.storageKey)

        if (storedVersion !== currentVersion) {
            if (config.clearOnMismatch) {
                clearStorage()
            }
            localStorage.setItem(config.storageKey, currentVersion)
            return true
        }
        return false
    }

    const forceRefresh = () => {
        if (config.forceRefresh) {
            window.location.href = `${window.location.pathname}`
        }
    }

    const init = () => {
        const versionChanged = checkVersion()
        if (versionChanged) {
            forceRefresh()
        } else if (!localStorage.getItem(config.storageKey)) {
            localStorage.setItem(config.storageKey, currentVersion)
        }
    }

    init()

    return {
        currentVersion,
        storedVersion: localStorage.getItem(config.storageKey),
        forceRefresh
    }
}