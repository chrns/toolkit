type Tab = { key: string; label: string };

type BaseProps = Omit<preact.ComponentProps<'section'>, 'onSelect'> & {
  title?: string;
  rightSlot?: preact.ComponentChildren;
  children?: preact.ComponentChildren;
};

type WithTabs = BaseProps & {
  tabs: Tab[];
  active: string;
  onSelect: (key: string) => void;
};

type WithoutTabs = BaseProps & {
  tabs?: undefined;
  active?: undefined;
  onSelect?: never;
};

export type TabbedPanelProps = WithTabs | WithoutTabs;

export function TabbedPanel(props: TabbedPanelProps) {
  const {
    title,
    rightSlot,
    children,
    ...rest
  } = props as BaseProps & { tabs?: Tab[]; active?: string; onSelect?: (key: string) => void };

  const { tabs, active, onSelect, ...sectionProps } = rest as {
    tabs?: Tab[];
    active?: string;
    onSelect?: (key: string) => void;
    [k: string]: unknown;
  };

  const hasTabs = !!tabs?.length;

  return (
    <section class="panel" {...sectionProps}>
      {(title || hasTabs || rightSlot) && (
        <header class="panel-header">
          {title && <h3 class="panel-title">{title}</h3>}

          {hasTabs && (
            <div class="tabs-underline" role="tablist" aria-label={title ?? 'Tabs'}>
              {tabs!.map(t => (
                <button
                  key={t.key}
                  type="button"
                  class="tab-link"
                  role="tab"
                  aria-selected={active === t.key}
                  onClick={() => onSelect?.(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {rightSlot && <div class="panel-right">{rightSlot}</div>}
        </header>
      )}

      <div class="panel-body">{children}</div>
    </section>
  );
}
