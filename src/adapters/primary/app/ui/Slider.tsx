import { clsx } from 'clsx';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}

export function Slider({ value, min, max, step = 1, onChange, label, className }: SliderProps) {
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => {
        onChange(Number(event.target.value));
      }}
      className={clsx('accent-accent w-full', className)}
    />
  );
}
