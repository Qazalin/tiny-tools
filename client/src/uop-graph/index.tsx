import { useState } from "react";
import PageSelector from "../components/page-selector";
import { GraphBatch, UOpNode } from "../types";
import UOpGraph from "./graph";

export default function UOpGraphBatch({ batch }: { batch: GraphBatch<UOpNode> }) {
  console.log(batch)
  const [page, setPage] = useState(0);
  return (
    <div>
      <PageSelector page={page} setPage={setPage} total={batch.graphs.length} />
      <UOpGraph data={batch.graphs[page]} />
    </div>
  );
}
