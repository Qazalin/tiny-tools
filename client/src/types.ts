import { GraphEdge, GraphNode } from "reagraph";

export type ScheduleNode = GraphNode & {
  code: string;
  inputs: string[];
  outputs: string[];
  shape: string;
};
export type GraphData = { nodes: ScheduleNode[]; edges: GraphEdge[] };
