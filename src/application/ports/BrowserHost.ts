export type ConfigureSidePanelOutcome =
  | { readonly kind: 'configured' }
  | { readonly kind: 'failed'; readonly cause: unknown };

export interface RuntimeMessageContext {
  readonly raw: unknown;
  readonly senderId: string | undefined;
}

export type RuntimeMessageHandler = (
  context: RuntimeMessageContext,
) => Promise<{ readonly response: unknown }>;

export type LifecycleHandler = () => void | Promise<void>;

export type HostCrashReporter = (cause: unknown) => void;

export interface BrowserHost {
  readonly selfId: string;
  onInstalled(handler: LifecycleHandler): void;
  onStartup(handler: LifecycleHandler): void;
  onMessage(handler: RuntimeMessageHandler): void;
  enableSidePanelOnActionClick(): Promise<ConfigureSidePanelOutcome>;
}
