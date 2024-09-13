import { GraphBatch, ScheduleNode } from "../types";
import ScheduleGraph from "./graph";

export default function ScheduleGraphBatch({
  batch,
}: {
  batch: GraphBatch<ScheduleNode>;
}) {
  return (
    <div>
      <ScheduleGraph data={batch.graphs[0]} />
    </div>
  );
}
