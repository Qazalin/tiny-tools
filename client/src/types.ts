import { GraphEdge, GraphNode } from "reagraph";

export type ScheduleNode = GraphNode & {
  code: string;
  inputs: string[];
  outputs: string[];
  shape: string;
  ast?: string;
};
export type FuzzNode = GraphNode & { lb: string };
export type GraphData<T = ScheduleNode | FuzzNode> = {
  nodes: T[];
  edges: GraphEdge[];
};
