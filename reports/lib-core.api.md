## API Report File for "@openshift/dynamic-plugin-sdk"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import * as React_2 from 'react';

// @public
export type AnyObject = Record<string, unknown>;

// @public
export const applyDefaults: <TObject>(obj: TObject, defaults: unknown) => TObject;

// @public
export const applyOverrides: <TObject>(obj: TObject, overrides: unknown) => TObject;

// @public (undocumented)
export type CodeRef<TValue = unknown> = () => Promise<TValue>;

// @public
export const consoleLogger: Logger;

// @public
export class CustomError extends Error {
    constructor(message?: string);
}

// @public
export type EitherNotBoth<TypeA, TypeB> = (TypeA & Never<TypeB>) | (TypeB & Never<TypeA>);

// @public
export type EitherOrNone<TypeA, TypeB> = EitherNotBoth<TypeA, TypeB> | (Never<TypeA> & Never<TypeB>);

// @public (undocumented)
export type EncodedCodeRef = {
    $codeRef: string;
};

// @public (undocumented)
export type EncodedExtension<TExtension extends Extension = Extension> = ReplaceProperties<TExtension, {
    properties: ReplaceProperties<ExtractExtensionProperties<TExtension>, MapCodeRefsToEncodedCodeRefs<ExtractExtensionProperties<TExtension>>>;
}>;

// @public (undocumented)
export type Extension<TType extends string = string, TProperties extends AnyObject = AnyObject> = {
    type: TType;
    properties: TProperties;
    flags?: ExtensionFlags;
    [customProperty: string]: unknown;
};

// @public (undocumented)
export type ExtensionFlags = Partial<{
    required: string[];
    disallowed: string[];
}>;

// @public (undocumented)
export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;

// @public (undocumented)
export type ExtractExtensionProperties<T> = T extends Extension<any, infer TProperties> ? TProperties : never;

// @public (undocumented)
export type FailedPlugin = {
    errorMessage: string;
    errorCause?: unknown;
};

// @public (undocumented)
export type FailedPluginInfoEntry = {
    pluginName: string;
    status: 'failed';
} & Pick<FailedPlugin, 'errorMessage' | 'errorCause'>;

// @public (undocumented)
export type FeatureFlags = {
    [key: string]: boolean;
};

// @public (undocumented)
export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
    pluginName: string;
    uid: string;
    [customProperty: string]: unknown;
};

// @public (undocumented)
export type LoadedPlugin = {
    metadata: Readonly<PluginRuntimeMetadata>;
    extensions: Readonly<LoadedExtension[]>;
    entryModule: PluginEntryModule;
    enabled: boolean;
    disableReason?: string;
};

// @public (undocumented)
export type LoadedPluginInfoEntry = {
    pluginName: string;
    status: 'loaded';
} & Pick<LoadedPlugin, 'metadata' | 'enabled' | 'disableReason'>;

// @public (undocumented)
export type LogFunction = (message?: any, ...optionalParams: any[]) => void;

// @public
export type Logger = Record<'info' | 'warn' | 'error', LogFunction>;

// @public (undocumented)
export type MapCodeRefsToEncodedCodeRefs<T> = {
    [K in keyof T]: T[K] extends CodeRef ? EncodedCodeRef : MapCodeRefsToEncodedCodeRefs<T[K]>;
};

// @public (undocumented)
export type MapCodeRefsToValues<T> = {
    [K in keyof T]: T[K] extends CodeRef<infer TValue> ? TValue : MapCodeRefsToValues<T[K]>;
};

// @public
export type Never<T> = {
    [K in keyof T]?: never;
};

// @public
export type PluginEntryModule = {
    init: (sharedScope: AnyObject) => void | Promise<void>;
    get: <TModule extends AnyObject>(moduleRequest: string) => Promise<() => TModule>;
};

// @public (undocumented)
export enum PluginEventType {
    ExtensionsChanged = "ExtensionsChanged",
    FeatureFlagsChanged = "FeatureFlagsChanged",
    PluginInfoChanged = "PluginInfoChanged"
}

// @public (undocumented)
export type PluginInfoEntry = LoadedPluginInfoEntry | FailedPluginInfoEntry;

// @public
export class PluginLoader {
    constructor(options?: PluginLoaderOptions);
    loadPlugin(baseURL: string, manifestNameOrObject?: string | PluginManifest): Promise<void>;
    registerPluginEntryCallback(): void;
    subscribe(listener: PluginLoadListener): VoidFunction;
}

// @public (undocumented)
export type PluginLoaderOptions = Partial<{
    canLoadPlugin: (manifest: PluginManifest, reload: boolean) => boolean;
    canReloadScript: (manifest: PluginManifest, scriptName: string) => boolean;
    entryCallbackName: string;
    fetchImpl: ResourceFetch;
    fixedPluginDependencyResolutions: Record<string, string>;
    sharedScope: AnyObject;
    postProcessManifest: (manifest: PluginManifest) => PluginManifest;
    getPluginEntryModule: (manifest: PluginManifest) => PluginEntryModule | void;
}>;

// @public (undocumented)
export type PluginLoadListener = (result: PluginLoadResult) => void;

// @public (undocumented)
export type PluginLoadResult = {
    success: true;
    pluginName: string;
    manifest: PluginManifest;
    entryModule: PluginEntryModule;
} | {
    success: false;
    pluginName?: string;
    errorMessage: string;
    errorCause?: unknown;
};

// @public (undocumented)
export type PluginManifest = PluginRuntimeMetadata & {
    extensions: Extension[];
    loadScripts: string[];
    registrationMethod: PluginRegistrationMethod;
    buildHash?: string;
};

// @public (undocumented)
export type PluginRegistrationMethod = 'callback' | 'custom';

// @public (undocumented)
export type PluginRuntimeMetadata = {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
};

// @public
export class PluginStore implements PluginStoreInterface {
    constructor(options?: PluginStoreOptions);
    // (undocumented)
    disablePlugins(pluginNames: string[], disableReason?: string): void;
    // (undocumented)
    enablePlugins(pluginNames: string[]): void;
    // (undocumented)
    getExposedModule<TModule extends AnyObject>(pluginName: string, moduleName: string): Promise<TModule>;
    // (undocumented)
    getExtensions(): LoadedExtension<Extension<string, AnyObject>>[];
    // (undocumented)
    getFeatureFlags(): {
        [x: string]: boolean;
    };
    // (undocumented)
    getPluginInfo(): PluginInfoEntry[];
    hasLoader(): boolean;
    // (undocumented)
    loadPlugin(baseURL: string, manifestNameOrObject?: string | PluginManifest): Promise<void>;
    // (undocumented)
    setFeatureFlags(newFlags: FeatureFlags): void;
    setLoader(loader: PluginLoader): VoidFunction;
    // (undocumented)
    subscribe(eventTypes: PluginEventType[], listener: VoidFunction): VoidFunction;
}

// @public (undocumented)
export type PluginStoreInterface = {
    subscribe: (eventTypes: PluginEventType[], listener: VoidFunction) => VoidFunction;
    getExtensions: () => LoadedExtension[];
    getPluginInfo: () => PluginInfoEntry[];
    setFeatureFlags: (newFlags: FeatureFlags) => void;
    getFeatureFlags: () => FeatureFlags;
    loadPlugin: (baseURL: string, manifestNameOrObject?: string | PluginManifest) => Promise<void>;
    enablePlugins: (pluginNames: string[]) => void;
    disablePlugins: (pluginNames: string[], disableReason?: string) => void;
    getExposedModule: <TModule extends AnyObject>(pluginName: string, moduleName: string) => Promise<TModule>;
};

// @public (undocumented)
export type PluginStoreOptions = Partial<{
    autoEnableLoadedPlugins: boolean;
    postProcessExtensions: (extensions: LoadedExtension[]) => LoadedExtension[];
}>;

// @public
export const PluginStoreProvider: React_2.FC<PluginStoreProviderProps>;

// @public (undocumented)
export type PluginStoreProviderProps = React_2.PropsWithChildren<{
    store: PluginStore;
}>;

// @public
export type ReplaceProperties<T, R> = {
    [K in keyof T]: K extends keyof R ? R[K] : T[K];
};

// @public (undocumented)
export type ResolvedExtension<TExtension extends Extension = Extension> = ReplaceProperties<TExtension, {
    properties: ReplaceProperties<ExtractExtensionProperties<TExtension>, MapCodeRefsToValues<ExtractExtensionProperties<TExtension>>>;
}>;

// @public
export type ResourceFetch = (url: string, requestInit?: RequestInit, isK8sAPIRequest?: boolean) => Promise<Response>;

// @public
export const useExtensions: <TExtension extends Extension<string, AnyObject>>(predicate?: ExtensionPredicate<TExtension> | undefined) => LoadedExtension<TExtension>[];

// @public
export const useFeatureFlag: (name: string) => UseFeatureFlagResult;

// @public (undocumented)
export type UseFeatureFlagResult = [currentValue: boolean, setValue: (newValue: boolean) => void];

// @public
export const usePluginInfo: () => PluginInfoEntry[];

// @public
export const usePluginStore: () => PluginStoreInterface;

// @public
export const useResolvedExtensions: <TExtension extends Extension<string, AnyObject>>(predicate?: ExtensionPredicate<TExtension> | undefined) => UseResolvedExtensionsResult<TExtension>;

// @public (undocumented)
export type UseResolvedExtensionsResult<TExtension extends Extension> = [
resolvedExtensions: LoadedExtension<ResolvedExtension<TExtension>>[],
resolved: boolean,
errors: unknown[]
];

```
