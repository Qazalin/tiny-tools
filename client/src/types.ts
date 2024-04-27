import { GraphEdge, GraphNode } from "reagraph";

export type ScheduleNode = GraphNode & {
  code: string;
  inputs: string[];
  outputs: string[];
  shape: string;
  ast?: string;
  ref?: string;
};
export type FuzzNode = GraphNode & { lb: string; code: string };
export type GraphData<T = ScheduleNode | FuzzNode> = {
  nodes: T[];
  edges: GraphEdge[];
};
