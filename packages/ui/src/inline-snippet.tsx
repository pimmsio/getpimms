export const InlineSnippet = ({ children }: { children: string }) => {
  return (
    <span className="inline-block rounded bg-brand-primary px-1 py-0.5 font-mono text-white">
      {children}
    </span>
  );
};
