import { useState } from "react";
import FileUploader from "./FileUpload";
import Graph from "./Graph";
import { GraphData } from "./types";

export default function Base() {
  const [graph, setGraph] = useState<GraphData | null>(null);

  return (
    <div className="flex items-center justify-center min-w-[100vw] min-h-screen">
      {graph == null ? (
        <FileUploader setGraph={setGraph} />
      ) : (
        <>
          <div className={"absolute top-5 left-5 z-10"}>
            <FileUploader setGraph={setGraph} />
          </div>
          <Graph data={graph} />
        </>
      )}
    </div>
  );
}
