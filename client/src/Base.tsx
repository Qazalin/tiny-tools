import { useState } from "react";
import FileUploader from "./FileUpload";
import FiltersPanel from "./Filters";
import Graph from "./Graph";
import { Filters } from "./Graph/Filters";
import { GraphData } from "./types";

export default function Base() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);

  return (
    <div className="flex items-center justify-center min-w-[100vw] min-h-screen">
      {graph == null ? (
        <FileUploader setGraph={setGraph} showTip />
      ) : (
        <>
          <div className="absolute top-5 left-5 z-10 flex flex-col space-y-4">
            <div className="flex space-x-2">
              <FileUploader setGraph={setGraph} />
            </div>
            <FiltersPanel filters={filters} setFilters={setFilters} />
          </div>
          <Graph filters={filters} data={graph} />
        </>
      )}
    </div>
  );
}
