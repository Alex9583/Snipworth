export class InvalidCapturedSelection extends Error {
  constructor(reason: string) {
    super(`InvalidCapturedSelection: ${reason}`);
    this.name = 'InvalidCapturedSelection';
  }
}

export interface CapturedSelectionInput {
  readonly code: string;
  readonly sourceUrl: string | undefined;
}

export interface CapturedSelectionSnapshot {
  readonly code: string;
  readonly sourceUrl: string | undefined;
}

export class CapturedSelection {
  readonly code: string;
  readonly sourceUrl: string | undefined;

  private constructor(props: CapturedSelectionInput) {
    this.code = props.code;
    this.sourceUrl = props.sourceUrl;
  }

  static from(input: CapturedSelectionInput): CapturedSelection {
    if (input.code.length === 0) {
      throw new InvalidCapturedSelection('code must not be empty');
    }
    return new CapturedSelection({ code: input.code, sourceUrl: input.sourceUrl });
  }

  toSnapshot(): CapturedSelectionSnapshot {
    return { code: this.code, sourceUrl: this.sourceUrl };
  }
}
