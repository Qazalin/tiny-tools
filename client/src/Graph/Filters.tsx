import { RefObject, useEffect, useState } from "react";
import { GraphCanvasRef } from "reagraph";
import { GraphData, ScheduleNode } from "../types";

export type Filters = Partial<{
  shape: string;
  code: string;
  ast: string;
  ref: string;
}>;
export function useFilters({
  ref,
  filters,
  data,
}: {
  ref: RefObject<GraphCanvasRef | null>;
  filters: Filters | null;
  data: GraphData<ScheduleNode>;
}): GraphData<ScheduleNode> {
  const [nodes, setNodes] = useState<ScheduleNode[]>(data.nodes);
  const [edges, setEdges] = useState<GraphData["edges"]>(data.edges);
  useEffect(() => {
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [data]);

  function isTarget(node: ScheduleNode) {
    const conds = [];
    if (filters?.shape) conds.push(node.shape.startsWith(filters.shape));
    if (filters?.code) conds.push(node.code.includes(filters.code));
    if (filters?.ast) conds.push(node.ast?.includes(filters.ast));
    if (filters?.ref) conds.push(node.ref === filters.ref);
    if (conds.length === 0) return;
    return conds.every((c) => c);
  }

  useEffect(() => {
    if (filters == null) return;
    const graph = ref.current?.getGraph();
    if (graph == null) {
      console.log("no graph!");
      return;
    }

    const newNodes = data.nodes.map((node) => {
      const target = isTarget(node);
      if (target == null) return node;
      return { ...node, fill: target ? "red" : "gray" };
    });

    setNodes(newNodes);
  }, [data, ref, filters]);
  return { nodes, edges };
}
