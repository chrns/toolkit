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

  const handleSelect = (key: string) => {
    if (onSelect) onSelect(key);
  };

  const hasTabs = !!tabs?.length;

  const onTabListKeyDown = (e: KeyboardEvent) => {
    if (!tabs || !tabs.length) return;
    const i = Math.max(0, tabs.findIndex(t => t.key === active));
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    handleSelect(tabs[next].key);
  };

  return (
    <section class="panel" {...sectionProps}>
      {(title || hasTabs || rightSlot) && (
        <header class="panel-header">
          {title && <h3 class="panel-title">{title}</h3>}

          {hasTabs && (
            <div class="tabs-underline" role="tablist" aria-label={title ?? 'Tabs'} onKeyDown={onTabListKeyDown as any}>
              {tabs!.map(t => (
                <button
                  key={t.key}
                  type="button"
                  class="tab-link"
                  role="tab"
                  id={`tab-${t.key}`}
                  aria-controls={`panel-${t.key}`}
                  aria-selected={active === t.key}
                  tabIndex={active === t.key ? 0 : -1}
                  onClick={() => handleSelect(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {rightSlot && <div class="panel-right">{rightSlot}</div>}
        </header>
      )}

      <div class="panel-body" role={hasTabs ? 'tabpanel' : undefined} id={hasTabs ? `panel-${active}` : undefined} aria-labelledby={hasTabs ? `tab-${active}` : undefined}>
        {children}
      </div>
    </section>
  );
}
