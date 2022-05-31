import * as React from 'react';
import type { PluginConsumer, PluginManager } from '../types/store';
import type { PluginStore } from './PluginStore';

const PluginStoreContext = React.createContext<PluginStore | undefined>(undefined);

/**
 * React Context provider for passing the {@link PluginStore} down the component tree.
 */
export const PluginStoreProvider: React.FC<PluginStoreProviderProps> = ({ store, children }) => {
  if (!store.hasLoader()) {
    throw new Error('PluginLoader must be set on the PluginStore');
  }

  return <PluginStoreContext.Provider value={store}>{children}</PluginStoreContext.Provider>;
};

export type PluginStoreProviderProps = React.PropsWithChildren<{
  store: PluginStore;
}>;

/**
 * React hook that provides access to the {@link PluginStore} functionality.
 */
export const usePluginStore = (): PluginConsumer & PluginManager => {
  const store = React.useContext(PluginStoreContext);

  if (store === undefined) {
    throw new Error('usePluginStore hook called outside a PluginStoreProvider');
  }

  return store;
};

/**
 * React hook that provides access to a feature flag.
 *
 * @example
 * ```ts
 * const [flag, setFlag] = useFeatureFlag('MY_FLAG');
 * ...
 * setFlag('MY_FLAG', true);
 * ```
 */
export const useFeatureFlag = (
  flagName: string,
): [boolean, (flagName: string, newValue: boolean) => void] => {
  const store = usePluginStore();

  return [store.getFeatureFlag(flagName), store.setFeatureFlag];
};
