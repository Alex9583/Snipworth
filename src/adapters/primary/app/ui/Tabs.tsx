import { clsx } from 'clsx';
import { createContext, use, type ReactNode } from 'react';

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsContext value={{ value, onChange }}>
      <div className={clsx('flex flex-col', className)}>{children}</div>
    </TabsContext>
  );
}

interface TabsListProps {
  children: ReactNode;
  label: string;
  className?: string;
}

export function TabsList({ children, label, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={clsx(
        'border-line bg-elevated inline-flex gap-0.5 rounded-lg border p-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  iconLeft?: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, iconLeft, className }: TabsTriggerProps) {
  const ctx = use(TabsContext);
  if (ctx === null) {
    throw new Error('Tabs.Trigger must be rendered inside <Tabs>');
  }
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        ctx.onChange(value);
      }}
      className={clsx(
        'inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors',
        'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
        active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
        className,
      )}
    >
      {iconLeft}
      {children}
    </button>
  );
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
