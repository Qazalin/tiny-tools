import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { GraphCanvas, GraphEdge } from "reagraph";
import KernelModal from "./Kernel";
import { ScheduleNode } from "./types";

export default function Base() {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);

  const { data } = useQuery<{
    code: string;
    nodes: ScheduleNode[];
    edges: GraphEdge[];
  }>({
    queryKey: ["/"],
  });
  if (data == null) {
    return <p>loading</p>;
  }
  console.log(focusedSI);

  return (
    <div className="h-screen w-screen p-10">
      <GraphCanvas
        nodes={data.nodes}
        edges={data.edges}
        theme={{
          canvas: { background: "#000" },
          node: {
            fill: "#7CA0AB",
            activeFill: "#1DE9AC",
            opacity: 1,
            selectedOpacity: 1,
            inactiveOpacity: 0.2,
            label: { color: "white", activeColor: "#1DE9AC" },
          },
          lasso: {
            border: "1px solid #55aaff",
            background: "rgba(75, 160, 255, 0.1)",
          },
          ring: { fill: "#000", activeFill: "#1DE9AC" },
          edge: {
            fill: "#D8E6EA",
            activeFill: "#1DE9AC",
            opacity: 1,
            selectedOpacity: 1,
            inactiveOpacity: 0.1,
            label: {
              stroke: "#000",
              color: "#2A6475",
              activeColor: "#1DE9AC",
              fontSize: 6,
            },
          },
          arrow: { fill: "#D8E6EA", activeFill: "#1DE9AC" },
        }}
        onNodeDoubleClick={(node) => setFocusedSI(node.data as ScheduleNode)}
      />
      <KernelModal si={focusedSI}
onClose={() => setFocusedSI(null)}
      />
    </div>
  );
}
