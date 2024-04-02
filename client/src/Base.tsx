import { useQuery } from "@tanstack/react-query";

export default function Base() {
  const { data } = useQuery({ queryKey: ["http://localhost:8000"] });
  console.log(data);
  return (
    <div>
      <p className="text-blue-400">hi</p>
    </div>
  );
}
