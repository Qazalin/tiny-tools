import { Dispatch, SetStateAction } from "react";
import { Filters } from "./Graph/Filters";

export default function FiltersPanel({
  filters,
  setFilters,
}: {
  filters: Filters | null;
  setFilters: Dispatch<SetStateAction<Filters | null>>;
}) {
  return (
    <div className="bg-neutral-800 rounded-md border border-neutral-800 p-2 space-y-3 flex items-center flex-col w-fit">
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
  );
}
