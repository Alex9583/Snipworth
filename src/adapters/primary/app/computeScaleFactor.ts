export function computeScaleFactor(
  contentWidth: number,
  contentHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  paddingPercent: number,
): number {
  const fill = 1 - paddingPercent / 100;
  return Math.min((canvasWidth * fill) / contentWidth, (canvasHeight * fill) / contentHeight);
}
