export function describeCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  try {
    return JSON.stringify(cause);
  } catch (serializationError) {
    const reason =
      serializationError instanceof Error ? serializationError.message : String(serializationError);
    return `[describeCause: unserializable cause (${reason})]`;
  }
}
