export function openJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null);
    });
    input.click();
  });
}
