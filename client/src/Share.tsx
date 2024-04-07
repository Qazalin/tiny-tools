import { useMutation } from "@tanstack/react-query";
import { GraphData } from "./types";
import { API_URL } from "./utils";

export default function Share({ data }: { data: GraphData | null }) {
  const { mutate } = useMutation({
    mutationKey: ["share"],
    mutationFn: async () => {
      if (data == null) return;
      const res = await fetch(API_URL, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const { link } = await res.json();
      return link as string;
    },
  });

  return (
    <div className="space-y-2">
      <button className="px-5 h-[44px] bg-transparent rounded-md text-white flex items-center w-fit border border-white hover:bg-neutral-900">
        <span className="text-xl" onClick={() => mutate()}>
          Share
        </span>
      </button>
    </div>
  );
}
