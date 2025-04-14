export const InlineSnippet = ({ children }: { children: string }) => {
  return (
    <span className="inline-block rounded-md bg-[#3971ff] px-1 py-0.5 font-mono text-white">
      {children}
    </span>
  );
};
