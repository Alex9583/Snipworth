export interface LinkOpener {
  open: (url: string) => void;
}

export const WINDOW_OPENER: LinkOpener = {
  open: (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};
