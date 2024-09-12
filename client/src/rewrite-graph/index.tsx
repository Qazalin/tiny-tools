import { useRef } from "react";
import { GraphCanvas, GraphCanvasRef, useSelection } from "reagraph";
import { GraphData, UOpNode } from "../types";
import { graphTheme } from "./theme";

export default function Graph({ data }: { data: GraphData<UOpNode> }) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const { nodes, edges } = data;
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
        onNodeDoubleClick={(node) => {
          console.log(node);
          // setFocusedSI(node.data as ScheduleNode)
        }}
        onNodeClick={onNodeClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
      />
    </>
  );
}
