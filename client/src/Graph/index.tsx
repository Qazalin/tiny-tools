import React, { useEffect, useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, useSelection } from "reagraph";
import KernelModal from "./Kernel";
import { GraphData, ScheduleNode } from "../types";
import { graphTheme } from "./theme";

function Graph({ data }: { data: GraphData }) {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);
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
    pathSelectionType: "all",
    pathHoverType: "all",
  });

  const [nodes, setNodes] = useState<ScheduleNode[]>([]);
  useEffect(() => {
    const nodes = data.nodes.map((si) => ({
      ...si,
      /*
      fill:
        si.shape == "(2, 56, 56, 64, 1)"
          ? "red"
          : si.code.includes("void r")
            ? "pink"
            : "gray",
            */
    }));

    setNodes(nodes);
  }, [data]);

  return (
    <>
      <GraphCanvas
        ref={graphRef}
        nodes={nodes}
        edges={data.edges}
        animated={true}
        theme={graphTheme}
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
export default React.memo(Graph, (prev, next) => prev.data === next.data);
