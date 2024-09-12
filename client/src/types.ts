import { GraphEdge, GraphNode } from "reagraph";

export type ScheduleNode = GraphNode & {
  code: string;
  inputs: string[];
  outputs: string[];
  shape: string;
  full_shape: string;
  metadata: string;
  category: string;
  forced_realize: boolean;
  ast?: string;
  ref?: string;
};

export type UOpNode = GraphNode & {
  op: string;
  dtype: string;
  src: string;
  arg: string;
};

export type GraphData<T = ScheduleNode> = {
  nodes: T[];
  edges: GraphEdge[];
};
