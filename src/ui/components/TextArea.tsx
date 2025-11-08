import { ComponentChildren } from "preact";

export function TextArea(props: { label: ComponentChildren; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label class="field" style="display:block;">
      <div class="label">{props.label}</div>
      <textarea
        class="input"
        rows={props.rows ?? 6}
        value={props.value}
        onInput={(e: any) => props.onChange((e.currentTarget as HTMLTextAreaElement).value)}
        placeholder={props.placeholder}
      />
    </label>
  );
}