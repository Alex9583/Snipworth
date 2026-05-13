import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';

export interface ExporterCall {
  readonly target: HTMLElement;
  readonly options: ImageExportOptions;
}

export class SpyImageExporter implements ImageExporter {
  readonly calls: ExporterCall[] = [];

  constructor(
    private readonly outcome: ExportImageOutcome,
    private readonly events?: string[],
  ) {}

  export(target: HTMLElement, options: ImageExportOptions): Promise<ExportImageOutcome> {
    this.calls.push({ target, options });
    this.events?.push('export');
    return Promise.resolve(this.outcome);
  }
}
