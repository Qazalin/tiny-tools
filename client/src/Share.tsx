import { useMutation } from "@tanstack/react-query";
import { GraphData } from "./types";
import { API_URL } from "./utils";

export default function Share({ graph }: { graph: GraphData | null }) {
  const { mutate, isPending, data } = useMutation({
    mutationKey: ["share"],
    mutationFn: async () => {
      if (graph == null) return;
      const res = await fetch(API_URL, {
        method: "PUT",
        body: JSON.stringify(graph),
      });
      return (await res.json()).id as string;
    },
  });
  return (
    <div className="space-y-2">
      <button className="px-5 h-[44px] bg-black rounded-md text-white flex items-center border border-white hover:bg-neutral-900 w-[98px] justify-center">
        <span className="text-xl" onClick={() => mutate()}>
          Share
        </span>
      </button>
    </div>
  );
}
