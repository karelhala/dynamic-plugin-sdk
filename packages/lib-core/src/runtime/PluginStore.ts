import { v4 as uuidv4 } from 'uuid';
import type { AnyObject } from '@monorepo/common';
import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import type { Extension, LoadedExtension } from '../types/extension';
import type {
  PluginRuntimeMetadata,
  PluginManifest,
  LoadedPlugin,
  FailedPlugin,
} from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';
import type { PluginInfoEntry, PluginStoreInterface, FeatureFlags } from '../types/store';
import { PluginEventType } from '../types/store';
import { decodeCodeRefs, getPluginModule } from './coderefs';
import type { PluginLoader } from './PluginLoader';

export type PluginStoreOptions = Partial<{
  /**
   * Control whether to enable plugins automatically once they are loaded.
   *
   * Default value: `true`.
   */
  autoEnableLoadedPlugins: boolean;

  /**
   * Post-process the plugin's extension objects.
   *
   * By default, no post-processing is performed on the extension objects.
   */
  postProcessExtensions: (extensions: LoadedExtension[]) => LoadedExtension[];
}>;

/**
 * Manages plugins and their extensions.
 */
export class PluginStore implements PluginStoreInterface {
  private readonly options: Required<PluginStoreOptions>;

  private loader?: PluginLoader;

  /** Plugins that were successfully loaded and processed. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin>();

  /** Plugins that failed to load or get processed properly. */
  private readonly failedPlugins = new Map<string, FailedPlugin>();

  /** Extensions which are currently in use. */
  private extensions: LoadedExtension[] = [];

  /** Subscribed event listeners. */
  private readonly listeners = new Map<PluginEventType, Set<VoidFunction>>();

  /** Feature flags used to determine the availability of extensions. */
  private featureFlags: FeatureFlags = {};

  constructor(options: PluginStoreOptions = {}) {
    this.options = {
      autoEnableLoadedPlugins: options.autoEnableLoadedPlugins ?? true,
      postProcessExtensions: options.postProcessExtensions ?? _.identity,
    };

    Object.values(PluginEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });
  }

  /**
   * Connect this {@link PluginStore} to the provided {@link PluginLoader}.
   *
   * This must be done before attempting to load any plugins.
   *
   * Returns a function for disconnecting from the {@link PluginLoader}.
   */
  setLoader(loader: PluginLoader): VoidFunction {
    if (this.loader !== undefined) {
      throw new Error('PluginLoader is already set');
    }

    this.loader = loader;

    const unsubscribe = loader.subscribe((result) => {
      if (!result.success) {
        const { pluginName, errorMessage, errorCause } = result;

        consoleLogger.error(..._.compact([errorMessage, errorCause]));

        if (pluginName) {
          this.registerFailedPlugin(pluginName, errorMessage, errorCause);
        }

        return;
      }

      const { pluginName, manifest, entryModule } = result;

      this.addPlugin(manifest, entryModule);

      if (this.options.autoEnableLoadedPlugins) {
        this.enablePlugins([pluginName]);
      }
    });

    return () => {
      unsubscribe();
      this.loader = undefined;
    };
  }

  /**
   * Returns `true` if this {@link PluginStore} is connected to a {@link PluginLoader}.
   */
  hasLoader() {
    return this.loader !== undefined;
  }

  subscribe(eventTypes: PluginEventType[], listener: VoidFunction): VoidFunction {
    if (eventTypes.length === 0) {
      consoleLogger.warn('subscribe method called with empty eventTypes');
      return _.noop;
    }

    eventTypes.forEach((t) => {
      this.listeners.get(t)?.add(listener);
    });

    let isSubscribed = true;

    return () => {
      if (isSubscribed) {
        isSubscribed = false;

        eventTypes.forEach((t) => {
          this.listeners.get(t)?.delete(listener);
        });
      }
    };
  }

  private invokeListeners(eventType: PluginEventType) {
    this.listeners.get(eventType)?.forEach((listener) => {
      listener();
    });
  }

  getExtensions() {
    return [...this.extensions];
  }

  getPluginInfo() {
    const entries: PluginInfoEntry[] = [];

    Array.from(this.loadedPlugins.entries()).forEach(([pluginName, plugin]) => {
      entries.push({
        pluginName,
        status: 'loaded',
        metadata: plugin.metadata,
        enabled: plugin.enabled,
        disableReason: plugin.disableReason,
      });
    });

    Array.from(this.failedPlugins.entries()).forEach(([pluginName, plugin]) => {
      entries.push({
        pluginName,
        status: 'failed',
        errorMessage: plugin.errorMessage,
        errorCause: plugin.errorCause,
      });
    });

    return entries;
  }

  setFeatureFlags(newFlags: FeatureFlags) {
    const prevFeatureFlags = this.featureFlags;

    this.featureFlags = {
      ...this.featureFlags,
      ..._.pickBy(newFlags, (value) => typeof value === 'boolean'),
    };

    if (!_.isEqual(prevFeatureFlags, this.featureFlags)) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.FeatureFlagsChanged);
    }
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  async loadPlugin(baseURL: string, manifestNameOrObject?: string | PluginManifest) {
    if (this.loader === undefined) {
      consoleLogger.error('PluginLoader must be set before loading any plugins');
      return;
    }

    // TODO(vojtech): PluginLoader.loadPlugin is now properly async, we can consider
    // removing PluginLoader.subscribe API in favor of directly handling the Promise
    await this.loader.loadPlugin(baseURL, manifestNameOrObject);
  }

  private setPluginsEnabled(
    pluginNames: string[],
    enabled: boolean,
    onEnabledChange: (plugin: LoadedPlugin) => void,
  ) {
    let updateRequired = false;

    pluginNames.forEach((pluginName) => {
      if (!this.loadedPlugins.has(pluginName)) {
        consoleLogger.warn(
          `Attempt to ${
            enabled ? 'enable' : 'disable'
          } plugin ${pluginName} which is not loaded yet`,
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const plugin = this.loadedPlugins.get(pluginName)!;

      if (plugin.enabled !== enabled) {
        plugin.enabled = enabled;
        onEnabledChange(plugin);
        updateRequired = true;

        consoleLogger.info(`Plugin ${pluginName} will be ${enabled ? 'enabled' : 'disabled'}`);
      }
    });

    if (updateRequired) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.PluginInfoChanged);
    }
  }

  enablePlugins(pluginNames: string[]) {
    this.setPluginsEnabled(pluginNames, true, (plugin) => {
      // eslint-disable-next-line no-param-reassign
      plugin.disableReason = undefined;
    });
  }

  disablePlugins(pluginNames: string[], disableReason?: string) {
    this.setPluginsEnabled(pluginNames, false, (plugin) => {
      // eslint-disable-next-line no-param-reassign
      plugin.disableReason = disableReason;
    });
  }

  private isExtensionInUse(extension: Extension) {
    return (
      (extension.flags?.required?.every((f) => this.featureFlags[f] === true) ?? true) &&
      (extension.flags?.disallowed?.every((f) => this.featureFlags[f] === false) ?? true)
    );
  }

  private updateExtensions() {
    const prevExtensions = this.extensions;

    this.extensions = Array.from(this.loadedPlugins.values()).reduce<LoadedExtension[]>(
      (acc, p) =>
        p.enabled ? [...acc, ...p.extensions.filter((e) => this.isExtensionInUse(e))] : acc,
      [],
    );

    if (!_.isEqual(prevExtensions, this.extensions)) {
      this.invokeListeners(PluginEventType.ExtensionsChanged);
    }
  }

  /**
   * Add a plugin to the {@link PluginStore}.
   *
   * Once added, the plugin is disabled by default. Enable it to put its extensions into use.
   */
  private addPlugin(manifest: PluginManifest, entryModule: PluginEntryModule) {
    const pluginName = manifest.name;
    const buildHash = manifest.buildHash ?? uuidv4();
    const reload = this.loadedPlugins.has(pluginName) || this.failedPlugins.has(pluginName);

    const metadata: PluginRuntimeMetadata = _.pick(manifest, ['name', 'version', 'dependencies']);

    const processedExtensions = this.processExtensions(
      pluginName,
      buildHash,
      manifest.extensions,
      entryModule,
    );

    this.loadedPlugins.set(pluginName, {
      metadata: Object.freeze(metadata),
      extensions: processedExtensions.map((e) => Object.freeze(e)),
      entryModule,
      enabled: false,
    });

    this.failedPlugins.delete(pluginName);
    this.invokeListeners(PluginEventType.PluginInfoChanged);

    if (reload) {
      this.updateExtensions();
    }

    consoleLogger.info(`Plugin ${pluginName} has been ${reload ? 'reloaded' : 'loaded'}`);
  }

  private registerFailedPlugin(pluginName: string, errorMessage: string, errorCause?: unknown) {
    const reload = this.loadedPlugins.has(pluginName) || this.failedPlugins.has(pluginName);

    this.loadedPlugins.delete(pluginName);
    this.failedPlugins.set(pluginName, { errorMessage, errorCause });
    this.invokeListeners(PluginEventType.PluginInfoChanged);

    if (reload) {
      this.updateExtensions();
    }

    consoleLogger.error(`Plugin ${pluginName} has failed to ${reload ? 'reload' : 'load'}`);
  }

  /**
   * Process extension objects as received from the plugin manifest.
   */
  private processExtensions(
    pluginName: string,
    buildHash: string,
    extensions: Extension[],
    entryModule: PluginEntryModule,
  ) {
    return this.options.postProcessExtensions(
      extensions.map<LoadedExtension>((e, index) =>
        decodeCodeRefs(
          {
            ...e,
            pluginName,
            uid: `${pluginName}[${index}]_${buildHash}`,
          },
          entryModule,
        ),
      ),
    );
  }

  async getExposedModule<TModule extends AnyObject>(pluginName: string, moduleName: string) {
    if (!this.loadedPlugins.has(pluginName)) {
      throw new Error(
        `Attempt to get module '${moduleName}' of plugin ${pluginName} which is not loaded yet`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const plugin = this.loadedPlugins.get(pluginName)!;

    const referencedModule = await getPluginModule<TModule>(
      moduleName,
      plugin.entryModule,
      (message) => `${message} of plugin ${pluginName}`,
    );

    return referencedModule;
  }
}
