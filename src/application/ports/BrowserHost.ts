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

export type InstalledHandler = () => void | Promise<void>;

export interface BrowserHost {
  readonly selfId: string;
  onInstalled(handler: InstalledHandler): void;
  onMessage(handler: RuntimeMessageHandler): void;
  enableSidePanelOnActionClick(): Promise<ConfigureSidePanelOutcome>;
}
