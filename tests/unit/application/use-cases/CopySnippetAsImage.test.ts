import { describe, it, expect } from 'vitest';

import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

import { anExportedPng } from '../../../setup/fakes/imageOutcomes';
import { SpyClipboardCopier } from '../../../setup/fakes/SpyClipboardCopier';
import { SpyFontPreloader } from '../../../setup/fakes/SpyFontPreloader';
import { SpyImageExporter } from '../../../setup/fakes/SpyImageExporter';

const DEFAULT_FONT: FontFamily = 'JetBrains Mono';

describe('CopySnippetAsImage', () => {
  it('should_return_copied_when_export_and_copy_both_succeed', async () => {
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'), DEFAULT_FONT);

    expect(outcome).toEqual({ kind: 'copied' });
  });

  it('should_return_denied_carrying_the_cause_when_clipboard_returns_denied', async () => {
    const cause = new Error('clipboard permission denied');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const clipboard = new SpyClipboardCopier({ kind: 'denied', cause });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'), DEFAULT_FONT);

    expect(outcome).toEqual({ kind: 'denied', cause });
  });

  it('should_return_copy_failed_carrying_the_cause_when_export_succeeds_but_clipboard_returns_copy_failed', async () => {
    const cause = new Error('clipboard service unavailable');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const clipboard = new SpyClipboardCopier({ kind: 'copy_failed', cause });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'), DEFAULT_FONT);

    expect(outcome).toEqual({ kind: 'copy_failed', cause });
  });

  it('should_return_export_failed_carrying_the_cause_when_image_exporter_reports_a_rasterization_failure', async () => {
    const cause = new Error('rasterization went wrong');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter({ kind: 'rasterization_failed', cause });
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'), DEFAULT_FONT);

    expect(outcome).toEqual({ kind: 'export_failed', cause });
  });

  it('should_call_font_preloader_and_clipboard_copier_synchronously_to_preserve_the_user_gesture_chain', () => {
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    void useCase.execute(document.createElement('div'), DEFAULT_FONT);

    expect(fontPreloader.calls).toHaveLength(1);
    expect(clipboard.factories).toHaveLength(1);
  });

  it('should_pass_the_target_and_the_2x_png_export_options_to_image_exporter', async () => {
    const target = document.createElement('div');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    await useCase.execute(target, DEFAULT_FONT);

    expect(exporter.calls).toEqual([{ target, options: { scale: 2, format: 'png' } }]);
  });

  it('should_preload_the_provided_font_family_before_invoking_image_exporter', async () => {
    const events: string[] = [];
    const fontPreloader = new SpyFontPreloader({ kind: 'preloaded' }, events);
    const exporter = new SpyImageExporter(anExportedPng(), events);
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(fontPreloader, exporter, clipboard);

    await useCase.execute(document.createElement('div'), 'Fira Code');

    expect(events).toEqual(['preload:Fira Code', 'export']);
  });
});
