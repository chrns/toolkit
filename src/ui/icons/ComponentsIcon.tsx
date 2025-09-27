export function ComponentsIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="72"
      height="72"
      {...props}
    >
      <path fill="var(--icon-main-color)" d="M8,17H6V10.82A3,3,0,0,0,7.82,9h.77l2.69,2.69,2-4L14.59,9h1.6A3,3,0,0,0,18,10.82V17H16v2h6V17H20V10.82A3,3,0,1,0,16.18,7h-.77L12.73,4.31l-2,4L9.41,7H7.82A3,3,0,1,0,4,10.82V17H2v2H8ZM19,7a1,1,0,1,1-1,1A1,1,0,0,1,19,7ZM5,7A1,1,0,1,1,4,8,1,1,0,0,1,5,7Z" />
    </svg>
  );
}
