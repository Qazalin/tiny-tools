import { GraphEdge, GraphNode } from "reagraph";

export type ScheduleNode = GraphNode & {
  code: string;
  inputs: string[];
  outputs: string[];
  shape: string;
  full_shape: string;
  metadata: string;
  forced_realize: boolean;
  ast?: string;
  ref?: string;
};
export type FuzzNode = GraphNode & { lb: string; code: string };
export type UOpNode = GraphNode & {
  uop: string;
  dtype: string;
  vin: string[];
  arg: string;
};
export type GraphData<T = ScheduleNode | FuzzNode | UOpNode> = {
  nodes: T[];
  edges: GraphEdge[];
};
