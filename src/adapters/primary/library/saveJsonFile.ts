const JSON_MIME = 'application/json';

export function saveJsonFile(json: string, filename: string): void {
  const blob = new Blob([json], { type: JSON_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
