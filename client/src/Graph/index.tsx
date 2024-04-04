import { useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, useSelection } from "reagraph";
import KernelModal from "./Kernel";
import { GraphData, ScheduleNode } from "../types";
import { graphTheme } from "./theme";

export default function Graph({ data }: { data: GraphData }) {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);
  const [nodes, setNodes] = useState<ScheduleNode[]>(data.nodes);
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const { selections, actives, onNodeClick, onCanvasClick } = useSelection({
    ref: graphRef,
    nodes: data.nodes,
    edges: data.edges,
    pathSelectionType: "all",
  });

  return (
    <div className="fixed w-[100%] h-full">
      <GraphCanvas
        ref={graphRef}
        nodes={nodes}
        edges={data.edges}
        theme={graphTheme}
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
