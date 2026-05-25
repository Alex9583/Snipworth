import clsx from 'clsx';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';
import {
  ChevronDownIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from '@/adapters/primary/app/ui/icons';
import { Input } from '@/adapters/primary/app/ui/Input';
import { draftStatuses, type DraftStatus } from '@/domain/drafts/Draft';
import { platforms, type Platform } from '@/domain/drafts/Platform';

import { LIBRARY_FILTERS_BAR } from './LibraryFiltersBar.strings';
import { platformDisplayLabel } from '@/adapters/primary/shared/platformLabels';
import type { LibraryFilters } from './useLibraryDrafts';
import { useDebouncedCallback } from './useDebouncedCallback';

const SEARCH_DEBOUNCE_MS = 250;

type DropdownId = 'platform' | 'language' | 'tag' | 'status';

interface LibraryFiltersBarProps {
  readonly filters: LibraryFilters;
  readonly onSearchChange: (query: string) => void;
  readonly onPlatformChange: (platform: Platform) => void;
  readonly onLanguageChange: (language: string) => void;
  readonly languageOptions: readonly string[];
  readonly onTagChange: (tag: string) => void;
  readonly tagOptions: readonly string[];
  readonly onNewDraft: () => void;
  readonly onStatusFilterChange: (status: DraftStatus) => void;
  readonly onClearFilter: (key: keyof LibraryFilters) => void;
}

export function LibraryFiltersBar({
  filters,
  onSearchChange,
  onPlatformChange,
  onLanguageChange,
  languageOptions,
  onTagChange,
  tagOptions,
  onNewDraft,
  onStatusFilterChange,
  onClearFilter,
}: LibraryFiltersBarProps) {
  const [query, setQuery] = useState('');
  const debouncedEmit = useDebouncedCallback(onSearchChange, SEARCH_DEBOUNCE_MS);
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);

  const dropdownProps = (id: DropdownId) => ({
    isOpen: openDropdown === id,
    onOpenChange: (open: boolean) => {
      setOpenDropdown(open ? id : null);
    },
  });

  return (
    <div className="border-line flex h-16 shrink-0 items-center justify-between gap-3 border-b px-6">
      <div className="flex items-center gap-2.5">
        <div className="w-80">
          <Input
            type="search"
            aria-label={LIBRARY_FILTERS_BAR.searchLabel}
            placeholder={LIBRARY_FILTERS_BAR.searchPlaceholder}
            icon={<SearchIcon size={14} />}
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              debouncedEmit(next);
            }}
          />
        </div>
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.platformLabel}
          options={platforms}
          renderOption={platformDisplayLabel}
          onSelect={onPlatformChange}
          activeValue={filters.platform && platformDisplayLabel(filters.platform)}
          onClear={() => {
            onClearFilter('platform');
          }}
          {...dropdownProps('platform')}
        />
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.languageLabel}
          options={languageOptions}
          renderOption={(language) => language}
          onSelect={onLanguageChange}
          activeValue={filters.language}
          onClear={() => {
            onClearFilter('language');
          }}
          {...dropdownProps('language')}
        />
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.tagsLabel}
          options={tagOptions}
          renderOption={(tag) => tag}
          onSelect={onTagChange}
          activeValue={filters.tags?.[0]}
          onClear={() => {
            onClearFilter('tags');
          }}
          scrollable
          {...dropdownProps('tag')}
        />
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.statusLabel}
          options={draftStatuses}
          renderOption={(status) => LIBRARY_FILTERS_BAR.statusOptions[status]}
          onSelect={onStatusFilterChange}
          activeValue={filters.status && LIBRARY_FILTERS_BAR.statusOptions[filters.status]}
          onClear={() => {
            onClearFilter('status');
          }}
          {...dropdownProps('status')}
        />
      </div>
      <div className="flex items-center gap-2">
        <span title={LIBRARY_FILTERS_BAR.exportAllTooltip}>
          <Button variant="outline" size="sm" iconLeft={<DownloadIcon size={13} />} disabled>
            {LIBRARY_FILTERS_BAR.exportAllButton}
          </Button>
        </span>
        <Button size="sm" iconLeft={<PlusIcon size={13} />} onClick={onNewDraft}>
          {LIBRARY_FILTERS_BAR.newDraftButton}
        </Button>
      </div>
    </div>
  );
}

interface ChipDropdownProps<T extends string> {
  readonly label: string;
  readonly options: readonly T[];
  readonly renderOption: (value: T) => string;
  readonly onSelect: (value: T) => void;
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly activeValue?: string;
  readonly onClear: () => void;
  readonly scrollable?: boolean;
}

function ChipDropdown<T extends string>({
  label,
  options,
  renderOption,
  onSelect,
  isOpen,
  onOpenChange,
  activeValue,
  onClear,
  scrollable,
}: ChipDropdownProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isActive = activeValue !== undefined;

  const handleOutsideMouseDown = useEffectEvent((event: MouseEvent) => {
    const target = event.target;
    if (target instanceof Node && wrapperRef.current?.contains(target) === true) {
      return;
    }
    onOpenChange(false);
  });

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideMouseDown);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <ChipTrigger
        isActive={isActive}
        isOpen={isOpen}
        label={label}
        activeValue={activeValue}
        onToggle={() => {
          onOpenChange(!isOpen);
        }}
        onClear={onClear}
      />
      {isOpen && (
        <ChipMenuList
          label={label}
          options={options}
          renderOption={renderOption}
          onSelect={(option) => {
            onOpenChange(false);
            onSelect(option);
          }}
          scrollable={scrollable}
        />
      )}
    </div>
  );
}

interface ChipTriggerProps {
  readonly isActive: boolean;
  readonly isOpen: boolean;
  readonly label: string;
  readonly activeValue?: string;
  readonly onToggle: () => void;
  readonly onClear: () => void;
}

function ChipTrigger({
  isActive,
  isOpen,
  label,
  activeValue,
  onToggle,
  onClear,
}: ChipTriggerProps) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={
          isActive
            ? 'bg-accent/15 text-accent border-accent/30 inline-flex items-center gap-1.5 rounded-l-sm border px-2.5 text-xs font-medium transition-colors h-7 hover:bg-accent/25'
            : 'border-line text-ink hover:bg-elevated inline-flex items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium transition-colors h-7'
        }
      >
        {isActive ? activeValue : label}
        {!isActive && <ChevronDownIcon size={12} />}
      </button>
      {isActive && (
        <button
          type="button"
          aria-label={LIBRARY_FILTERS_BAR.clearFilterLabel(label)}
          onClick={onClear}
          className="bg-accent/15 text-accent border-accent/30 -ml-px flex h-7 items-center rounded-r-sm border border-l-0 px-1 transition-colors hover:bg-accent/25"
        >
          <XIcon size={11} />
        </button>
      )}
    </div>
  );
}

interface ChipMenuListProps<T extends string> {
  readonly label: string;
  readonly options: readonly T[];
  readonly renderOption: (value: T) => string;
  readonly onSelect: (value: T) => void;
  readonly scrollable?: boolean;
}

function ChipMenuList<T extends string>({
  label,
  options,
  renderOption,
  onSelect,
  scrollable,
}: ChipMenuListProps<T>) {
  return (
    <ul
      role="menu"
      aria-label={label}
      className={clsx(
        'border-line bg-surface absolute top-9 left-0 z-10 flex min-w-32 flex-col rounded-md border py-1 shadow-md',
        scrollable && 'max-h-64 overflow-y-auto',
      )}
    >
      {options.map((option) => (
        <li key={option} role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSelect(option);
            }}
            className="text-ink hover:bg-elevated w-full px-3 py-1.5 text-left text-[12.5px]"
          >
            {renderOption(option)}
          </button>
        </li>
      ))}
    </ul>
  );
}
