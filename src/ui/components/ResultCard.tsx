export function ResultCard(props: { rows: { label: preact.ComponentChildren; value: string; value_min?: string; value_max?: string }[] }) {
  return (
    <div class="panel result-card">
      {props.rows.map(r => (
        <div class="kpi">
          <span class="small">{r.label}</span>
          <div class="result-value">
            {(r.value_min !== undefined || r.value_max !== undefined)
              ? (
                <>
                  {r.value_min !== undefined && <span class="result-min muted">{r.value_min}</span>}
                  <strong class="result-main">{r.value}</strong>
                  {r.value_max !== undefined && <span class="result-max muted">{r.value_max}</span>}
                </>
              ) : (
                <strong class="result-main">{r.value}</strong>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
