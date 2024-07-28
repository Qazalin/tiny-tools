import {  useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, useSelection } from "reagraph";
import KernelModal from "./Kernel";
import { GraphData, ScheduleNode } from "../types";
import { graphTheme } from "./theme";
import { Filters, useFilters } from "./Filters";

export default function Graph({
  data,
  filters,
}: {
  data: GraphData<ScheduleNode>;
  filters: Filters | null;
}) {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);
  const graphRef = useRef<GraphCanvasRef | null>(null);
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
      <KernelModal si={focusedSI} onClose={() => setFocusedSI(null)} />
    </>
  );
}
