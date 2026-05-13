import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

export type Unsubscribe = () => void;

export type CaptureHandler = (selection: CapturedSelection) => void;

export interface CaptureInbox {
  subscribe(handler: CaptureHandler): Unsubscribe;
}
