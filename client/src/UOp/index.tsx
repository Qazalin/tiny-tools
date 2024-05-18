import React, { useRef, useState } from "react";
import {
  GraphCanvas,
  NodePositionArgs,
  GraphCanvasRef,
  useSelection,
} from "reagraph";
import { GraphData, UOpNode } from "../types";
import { graphTheme } from "../Graph/theme";

function Graph({ data }: { data: GraphData<UOpNode> }) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const [selectedNode, setSelectedNode] = useState<UOpNode | null>(null);
  const {
    selections,
    actives,
    onNodePointerOver,
    setSelections,
    onNodePointerOut,
    onNodeClick,
    onCanvasClick,
  } = useSelection({
    ref: graphRef,
    nodes: data.nodes,
    edges: data.edges,
    pathHoverType: "direct",
    onSelection: (nodes) => {
      const node = data.nodes.find((n) => n.id === nodes[0]);
      if (node == null) {
        return;
      }
      setSelectedNode(node);
      setSelections(
        data.nodes.filter((n) => n.fill === node.fill).map((n) => n.id),
      );
    },
  });

  return (
    <>
      <div className="absolute top-28 left-5 z-10 flex flex-col space-y-4">
        <div className="bg-neutral-800 rounded-md border border-neutral-800 p-2 space-y-2 flex flex-col w-fit font-mono">
          <p className="text-base self-start">UOp</p>
          {selectedNode && (
            <>
              <p>{selectedNode.uop}</p>
              <p>{selectedNode.dtype}</p>
              {selectedNode.vin.map((v) => (
                <div>
                  <p>{v}</p>
                </div>
              ))}
              <p>arg={selectedNode.arg}</p>
            </>
          )}
        </div>
      </div>
      <GraphCanvas
        ref={graphRef}
        nodes={data.nodes}
        edges={data.edges}
        animated={true}
        theme={graphTheme}
        layoutType="custom"
        layoutOverrides={
          {
            getNodePosition: (id: string, { nodes }: NodePositionArgs) => {
              const idx = nodes.findIndex((n) => n.id === id);
              const node = nodes[idx];
              const seqIdx = parseInt(node.id.split("_")[0]);
              const nodeIdx = parseInt(node.id.split("_")[1]);
              return {
                x: 35 * nodeIdx,
                y: seqIdx === 0 ? 0 : seqIdx * 50,
                z: 1,
              };
            },
          } as any
        }
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

export default React.memo(Graph, (prev, next) => {
  return prev.data === next.data;
});
