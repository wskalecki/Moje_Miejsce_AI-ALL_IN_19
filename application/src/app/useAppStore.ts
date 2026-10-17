import { useContext } from 'react'
import { AppStoreContext, type AppStore } from './storeCore'

/**
 * Access the app store. Must be used under <AppStoreProvider>.
 *
 *   const { state, setProfile, togglePriority, setWeight, resetWeights, setHorizon } = useAppStore()
 *   state.weights.zielen // 0–100
 */
export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return store
}
