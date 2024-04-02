import { useQuery } from "@tanstack/react-query";

export default function Base() {
  const { data } = useQuery<{ code: string }>({ queryKey: ["/"] });
  if (data == null) {
    return <p>loading</p>;
  }

  data.code.split("\n").forEach((s) => console.log(s));
  return (
    <div className="h-screen w-screen p-10">
      {data.code.split("\n").map((s) => (
        <p className="font-mono whitespace-pre">{s}</p>
      ))}
    </div>
  );
}
