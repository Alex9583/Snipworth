import { useState } from 'react';
import type { RefObject } from 'react';
import type {
  CopySnippetAsImage,
  CopySnippetOutcome,
} from '@/application/use-cases/CopySnippetAsImage';
import { copyButtonLabel, copyStatusLabel } from './strings';
import { Button } from './ui/Button';

interface CopyActionProps<T extends HTMLElement> {
  readonly useCase: CopySnippetAsImage;
  readonly targetRef: RefObject<T | null>;
}

export function CopyAction<T extends HTMLElement>({ useCase, targetRef }: CopyActionProps<T>) {
  const [status, setStatus] = useState<CopySnippetOutcome | null>(null);

  const onCopy = (): void => {
    const target = targetRef.current;
    if (target === null) return;
    void useCase.execute(target).then(setStatus);
  };

  return (
    <>
      <Button onClick={onCopy}>{copyButtonLabel()}</Button>
      {status && <p role="status">{copyStatusLabel(status)}</p>}
    </>
  );
}
