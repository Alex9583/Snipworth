/// <reference types="chrome-types" />

// `chrome-types` declares `chrome.runtime.lastError` without `| undefined`, but at runtime the
// field is set only inside the scope of an async API callback and is `undefined` elsewhere
// (https://developer.chrome.com/docs/extensions/reference/api/runtime#property-lastError).
// Production code relies on this nullability to detect the success path; the widening below
// matches Chrome's documented semantics. Test-only mutation goes through `setRuntimeLastError`
// in `tests/setup/chrome-mock`, never through this global.
declare namespace chrome.runtime {
  let lastError: { message?: string } | undefined;
}
