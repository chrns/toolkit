export function RadioGroup(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: preact.ComponentChildren; value: string }[];
}) {
  return (
    <fieldset class="panel">
      <legend class="small">{props.label}</legend>
      <div class="grid">
        {props.options.map(o => (
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name={props.label}
              checked={props.value === o.value}
              onChange={() => props.onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
