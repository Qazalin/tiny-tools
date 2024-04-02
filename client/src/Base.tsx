import { useQuery } from "@tanstack/react-query";

export default function Base() {
  const { data } = useQuery<{ code: string }>({ queryKey: ["/"] });
  if (data == null) {
    return <p>loading</p>;
  }
  return (
    <div>
      <p className="font-mono text-blue-400">{data.code}</p>
    </div>
  );
}
