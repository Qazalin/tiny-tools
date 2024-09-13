import { useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, useSelection } from "reagraph";
import { graphTheme } from "../components/graph-theme";
import { GraphData, ScheduleNode } from "../types";
import { Filters, useFilters } from "./filters";
import Kernel from "./kernel";
export { Legend } from "./legend";

export default function ScheduleGraph({ data }: { data: GraphData<ScheduleNode> }) {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null)
  const { nodes, edges } = useFilters({
    ref: graphRef,
    data,
    filters,
  });
  const {
    selections,
    actives,
    onNodePointerOver,
    onNodePointerOut,
    onNodeClick,
    onCanvasClick,
  } = useSelection({
    ref: graphRef,
    nodes: data.nodes,
    edges: data.edges,
    pathHoverType: "all",
  });

  return (
    <>
      <GraphCanvas
        ref={graphRef}
        nodes={nodes}
        edges={edges}
        animated={true}
        theme={graphTheme}
        cameraMode="pan"
        layoutType="treeTd2d"
        selections={selections}
        actives={actives}
        onCanvasClick={onCanvasClick}
        onNodeDoubleClick={(node) => setFocusedSI(node.data as ScheduleNode)}
        onNodeClick={onNodeClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
      />
      <Kernel si={focusedSI} onClose={() => setFocusedSI(null)} />
    </>
  );
}
