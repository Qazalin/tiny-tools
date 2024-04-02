import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, GraphEdge, useSelection } from "reagraph";
import KernelModal from "./Kernel";
import { ScheduleNode } from "./types";

export default function Base() {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);

  const graphRef = useRef<GraphCanvasRef | null>(null);

  const { data } = useQuery<{
    code: string;
    nodes: ScheduleNode[];
    edges: GraphEdge[];
  }>({ queryKey: ["/"] });
  const { selections, actives, onNodeClick, onCanvasClick } = useSelection({
    ref: graphRef,
    nodes: data?.nodes ?? [],
    edges: data?.edges ?? [],
    pathSelectionType: "all",
  });

  if (data == null) {
    return <p>loading</p>;
  }

  console.log(data.nodes);
  return (
    <div className="h-screen w-screen p-10">
      <GraphCanvas
        ref={graphRef}
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
            opacity: 0.2,
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
        layoutType="treeTd2d"
        onNodeDoubleClick={(node) => setFocusedSI(node.data as ScheduleNode)}
        selections={selections}
        actives={actives}
        onCanvasClick={onCanvasClick}
        animated={false}
        onNodeClick={onNodeClick}
      />
      <KernelModal si={focusedSI} onClose={() => setFocusedSI(null)} />
    </div>
  );
}
