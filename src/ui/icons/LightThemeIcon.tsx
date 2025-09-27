export function LightThemeIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg
        class="bi bi-lightbulb-fill"
        fill="white"
        width="16"
        height="16"
        viewBox="0 0 16 16" 
      {...props}
    >
        <path d="M2 6a6 6 0 1 1 10.48 4.14c-.24.26-.45.57-.61.9-.17.35-.29.75-.29 1.16v.8a1 1 0 0 1-.52.87l-.96.48c-.2.1-.33.3-.33.52V15a1 1 0 0 1-1 1H7.23a1 1 0 0 1-1-1v-.13c0-.22-.13-.42-.33-.52l-.96-.48A1 1 0 0 1 4.42 13v-.8c0-.41-.12-.81-.29-1.16a3.5 3.5 0 0 0-.61-.9A6 6 0 0 1 2 6z"/>
    </svg>
  );
}
