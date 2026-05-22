import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';
import {
  ChevronDownIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
} from '@/adapters/primary/app/ui/icons';
import { Input } from '@/adapters/primary/app/ui/Input';
import { draftStatuses, type DraftStatus } from '@/domain/drafts/Draft';
import { platforms, type Platform } from '@/domain/drafts/Platform';

import { LIBRARY_FILTERS_BAR } from './LibraryFiltersBar.strings';
import { useDebouncedCallback } from './useDebouncedCallback';

const SEARCH_DEBOUNCE_MS = 250;

type DropdownId = 'platform' | 'language' | 'tag' | 'status';

interface LibraryFiltersBarProps {
  readonly onSearchChange: (query: string) => void;
  readonly onPlatformChange: (platform: Platform) => void;
  readonly onLanguageChange: (language: string) => void;
  readonly languageOptions: readonly string[];
  readonly onTagChange: (tag: string) => void;
  readonly tagOptions: readonly string[];
  readonly onNewDraft: () => void;
  readonly onStatusFilterChange: (status: DraftStatus) => void;
}

export function LibraryFiltersBar({
  onSearchChange,
  onPlatformChange,
  onLanguageChange,
  languageOptions,
  onTagChange,
  tagOptions,
  onNewDraft,
  onStatusFilterChange,
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
          renderOption={(platform) => LIBRARY_FILTERS_BAR.platformOptions[platform]}
          onSelect={onPlatformChange}
          {...dropdownProps('platform')}
        />
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.languageLabel}
          options={languageOptions}
          renderOption={(language) => language}
          onSelect={onLanguageChange}
          {...dropdownProps('language')}
        />
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.tagsLabel}
          options={tagOptions}
          renderOption={(tag) => tag}
          onSelect={onTagChange}
          {...dropdownProps('tag')}
        />
        <ChipDropdown
          label={LIBRARY_FILTERS_BAR.statusLabel}
          options={draftStatuses}
          renderOption={(status) => LIBRARY_FILTERS_BAR.statusOptions[status]}
          onSelect={onStatusFilterChange}
          {...dropdownProps('status')}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" iconLeft={<DownloadIcon size={13} />} disabled>
          {LIBRARY_FILTERS_BAR.exportAllButton}
        </Button>
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
}

function ChipDropdown<T extends string>({
  label,
  options,
  renderOption,
  onSelect,
  isOpen,
  onOpenChange,
}: ChipDropdownProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      <Button
        variant="outline"
        size="sm"
        iconRight={<ChevronDownIcon size={12} />}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          onOpenChange(!isOpen);
        }}
      >
        {label}
      </Button>
      {isOpen ? (
        <ul
          role="menu"
          aria-label={label}
          className="border-line bg-surface absolute top-9 left-0 z-10 flex min-w-32 flex-col rounded-md border py-1 shadow-md"
        >
          {options.map((option) => (
            <li key={option} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenChange(false);
                  onSelect(option);
                }}
                className="text-ink hover:bg-elevated w-full px-3 py-1.5 text-left text-[12.5px]"
              >
                {renderOption(option)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
