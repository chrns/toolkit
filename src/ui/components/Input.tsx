import { TOLERANCE_OPTIONS } from '@/lib/units';
import { JSX } from 'preact/jsx-runtime';
import { QuestionMarkIcon } from '@/ui/icons/QuesionMarkIcon';

type FixableInputProps = {
  label: preact.ComponentChildren;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  isFixed?: boolean;
  fixedContent?: JSX.Element | string;
  onToggleFix?: () => void;
  disabled?: boolean;
  tolerance?: number;
  onToleranceChange?: (n: number) => void;
};

export function Input({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  tolerance,
  onToleranceChange,
  isFixed = false,
  fixedContent = <QuestionMarkIcon />,
  onToggleFix,
  disabled = false,
}: FixableInputProps): JSX.Element {
  const inputDisabled = disabled || (isFixed && !!onToggleFix);

  return (
    <label class="flex flex-col gap-1 w-full">
      {label && <span class="fi-field-label">{label}</span>}

      <div class="fixable-input min-w-0 flex-1">
        <input
          value={value}
          placeholder={placeholder}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          disabled={inputDisabled}
        />

        {suffix && (
          <span aria-hidden="true" class="suffix">
            {suffix}
          </span>
        )}

        {tolerance !== undefined && (
          <select
            value={tolerance}
            onChange={(e) => { const v = Number((e.currentTarget as HTMLSelectElement).value); if (!Number.isNaN(v)) onToleranceChange?.(v); }}
          >
            {TOLERANCE_OPTIONS.map(o => (
              <option value={o.percentage}>{o.percentage} %</option>
            ))}
          </select>
        )}

        {onToggleFix && (
          <button
            type="button"
            class={!isFixed ? 'active' : ''}
            aria-pressed={!isFixed}
            onClick={onToggleFix}
          >
            {fixedContent}
          </button>
        )}
      </div>
    </label>
  );
}