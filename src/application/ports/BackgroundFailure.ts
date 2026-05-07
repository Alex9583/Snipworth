export const backgroundFailureCodes = [
  'handler_crashed',
  'unauthorized_sender',
  'malformed_request',
] as const;

export type BackgroundFailureCode = (typeof backgroundFailureCodes)[number];
