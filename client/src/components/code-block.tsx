export default function CodeBlock({ code, className }: { code: string; className?: string; }) {
  if (code.length === 0) {
    return null;
  }
  return (
    <div className={"font-mono " + className ?? ""} id="code-block">
      {code.split("\n").map((s) => (
        <p className="whitespace-pre" key={s}>
          {s}
        </p>
      ))}
    </div>
  );
}
