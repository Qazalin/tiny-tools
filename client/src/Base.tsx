import { useState } from "react";
import FileUploader from "./FileUpload";
import Graph from "./Graph";
import { GraphData } from "./types";

export default function Base() {
  const [graph, setGraph] = useState<GraphData | null>(null);

  return (
    <div className="flex items-center justify-center min-w-[100vw] min-h-screen">
      {graph == null ? (
        <div className="space-y-2">
          <FileUploader setGraph={setGraph} />
          <p>
            Tip: checkout{" "}
            <a
              href="https://github.com/Qazalin/tinygrad/tree/tool-0"
              target="_blank"
              className="text-blue-500 underline underline-offset-1"
            >
              this branch
            </a>
            , run tinygrad with <code>GRAPHSCHEDULE=1</code>
          </p>
        </div>
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
