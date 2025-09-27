type Opt = { label: string; value: string };
export function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
}) {
  return (
    <label class="field">
      <span class="fi-field-label">{props.label}</span>
      <select class="select" value={props.value} onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}>
        {props.options.map(o => <option value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
