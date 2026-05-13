import { describe, it, expect } from 'vitest';
import { downloadStatusLabel } from '@/adapters/primary/app/ui/ExportControls.strings';

describe('downloadStatusLabel', () => {
  it('should_describe_a_successful_download', () => {
    expect(downloadStatusLabel({ kind: 'downloaded' })).toBe('Downloaded');
  });

  it('should_describe_a_failed_download', () => {
    expect(downloadStatusLabel({ kind: 'download_failed', cause: new Error('boom') })).toBe(
      'Could not save the file',
    );
  });

  it('should_describe_an_export_failure_during_download', () => {
    expect(downloadStatusLabel({ kind: 'export_failed', cause: new Error('boom') })).toBe(
      'Could not export the snippet as an image',
    );
  });
});
