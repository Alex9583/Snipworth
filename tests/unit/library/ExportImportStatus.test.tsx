import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExportImportStatus } from '@/adapters/primary/library/ExportImportStatus';

describe('ExportImportStatus', () => {
  it('should_render_nothing_when_there_is_no_status', () => {
    const { container } = render(<ExportImportStatus exportStatus={null} importStatus={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should_announce_a_successful_import_with_a_polite_status_role', () => {
    render(
      <ExportImportStatus exportStatus={null} importStatus={{ kind: 'imported', count: 2 }} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Imported 2 drafts');
  });

  it('should_use_the_singular_noun_when_a_single_draft_is_imported', () => {
    render(
      <ExportImportStatus exportStatus={null} importStatus={{ kind: 'imported', count: 1 }} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Imported 1 draft');
  });

  it('should_announce_an_invalid_file_with_an_assertive_alert_role', () => {
    render(
      <ExportImportStatus
        exportStatus={null}
        importStatus={{ kind: 'invalid_file', message: 'boom' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/valid Snipworth export/i);
  });

  it('should_announce_an_empty_export_with_a_status_role', () => {
    render(<ExportImportStatus exportStatus={{ kind: 'empty' }} importStatus={null} />);

    expect(screen.getByRole('status')).toHaveTextContent(/empty/i);
  });

  it('should_announce_an_export_failure_with_an_alert_role', () => {
    render(
      <ExportImportStatus
        exportStatus={{ kind: 'export_failed', cause: new Error('x') }}
        importStatus={null}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/export failed/i);
  });

  it('should_prefer_the_import_status_when_both_are_present', () => {
    render(
      <ExportImportStatus
        exportStatus={{ kind: 'exported' }}
        importStatus={{ kind: 'imported', count: 1 }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Imported 1 draft');
  });
});
