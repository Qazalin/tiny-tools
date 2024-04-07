import { useState } from "react";
import FileUploader from "./FileUpload";
import Graph from "./Graph";
import { Filters } from "./Graph/Filters";
import { GraphData } from "./types";

export default function Base() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);

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
          <div className="absolute top-5 left-5 z-10 flex flex-col space-y-4">
            <FileUploader setGraph={setGraph} />

            <div className="bg-neutral-800 rounded-md border border-neutral-800 p-2 space-y-3 flex items-center flex-col">
              <div className="space-x-2 flex-1">
                <label>shape</label>
                <input
                  value={filters?.shape ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, shape: e.target.value }))
                  }
                />
              </div>
              <div className="space-x-2 flex-1">
                <label>code</label>
                <input
                  value={filters?.code ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <Graph filters={filters} data={graph} />
        </>
      )}
    </div>
  );
}
