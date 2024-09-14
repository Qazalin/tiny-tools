import { useRef } from "react";
import { GraphCanvas, GraphCanvasRef, useSelection } from "reagraph";
import { graphTheme } from "../components/graph-theme";
import { GraphData, UOpNode } from "../types";

export default function UOpGraph({ data }: { data: GraphData<UOpNode> }) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
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
        nodes={data.nodes}
        edges={data.edges}
        animated={true}
        theme={graphTheme}
        cameraMode="pan"
        layoutType="treeTd2d"
        selections={selections}
        actives={actives}
        onCanvasClick={onCanvasClick}
        onNodeClick={onNodeClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
      />
    </>
  );
}
