import type { ReactNode } from 'react';

interface ColumnHeaderProps {
  readonly id: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly slot?: ReactNode;
}

export function ColumnHeader({ id, icon, label, slot }: ColumnHeaderProps) {
  return (
    <div className="border-line flex items-center justify-between gap-2 border-b px-4 py-3">
      <h2 id={id} className="text-ink flex items-center gap-2 text-sm font-semibold">
        <span className="text-ink-muted">{icon}</span>
        {label}
      </h2>
      {slot !== undefined && <div>{slot}</div>}
    </div>
  );
}
