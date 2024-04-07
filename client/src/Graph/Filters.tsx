import Graph from "graphology";
import { RefObject, useEffect, useState } from "react";
import { getAdjacents, GraphCanvasRef } from "reagraph";
import { GraphData, ScheduleNode } from "../types";

export type Filters = Partial<{
  shape: string;
  code: string;
}>;
export function useFilters({
  ref,
  filters,
  data,
}: {
  ref: RefObject<GraphCanvasRef | null>;
  filters: Filters | null;
  data: GraphData;
}): GraphData {
  const [nodes, setNodes] = useState<GraphData["nodes"]>(data.nodes);
  const [edges, setEdges] = useState<GraphData["edges"]>(data.edges);
  useEffect(() => {
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [data]);

  function isTarget(node: ScheduleNode) {
    if (filters?.shape != null) return node.shape.startsWith(filters.shape);
    if (filters?.code != null) return node.code.includes(filters.code);
    return true;
  }

  function reduceNodes(graph: Graph) {
    const targetNodes = data.nodes.filter(isTarget);
    const adjs = getAdjacents(
      graph,
      targetNodes.map((n) => n.id),
      "all",
    );
    console.log(
      `reduced node count from ${data.nodes.length} to ${adjs.nodes.length}`,
    );
    const newNodes: GraphData["nodes"] = adjs.nodes.map((nid) => {
      const node = data.nodes.find((n) => n.id === nid)!;
      return {
        ...node,
        fill: isTarget(node) ? "green" : "gray",
      };
    });
    const newEdges: GraphData["edges"] = adjs.edges.map(
      (eid) => data.edges.find((e) => e.id === eid)!,
    );
    return [newNodes, newEdges];
  }

  useEffect(() => {
    if (filters == null) return;
    const graph = ref.current?.getGraph();
    if (graph == null) {
      console.log("no graph!");
      return;
    }

    const newNodes = data.nodes.map((node) => ({
      ...node,
      fill: isTarget(node) ? "red" : "gray",
    }));
    setNodes(newNodes);
  }, [data, ref, filters]);
  return { nodes, edges };
}
