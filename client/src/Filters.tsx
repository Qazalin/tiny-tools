import { Dispatch, SetStateAction } from "react";
import { Filters } from "./Graph/Filters";

type BaseProps = {
  filters: Filters | null;
  setFilters: Dispatch<SetStateAction<Filters | null>>;
};
export default function FiltersPanel({ filters, setFilters }: BaseProps) {
  return (
    <div className="bg-neutral-800 rounded-md border border-neutral-800 p-2 space-y-3 flex flex-col w-fit">
      <p className="text-base self-start mb-2">Filters</p>
      <Filter
        filters={filters}
        setFilters={setFilters}
        field="shape"
        name="Shape is"
        placeholder="eg. (2, 2)"
      />
      <Filter
        filters={filters}
        setFilters={setFilters}
        field="code"
        name="Code contains"
        placeholder="eg. r_256_512"
      />
      <Filter
        filters={filters}
        setFilters={setFilters}
        field="ast"
        name="AST contains"
        placeholder="eg. ADD"
      />
    </div>
  );
}

function Filter({
  filters,
  setFilters,
  field,
  name,
  placeholder,
}: BaseProps & { field: any; name: string; placeholder: string }) {
  return (
    <div className="space-x-2 flex-1 w-full flex items-center">
      <label className="text-sm flex-1">{name}</label>
      <input
        /* @ts-ignore */
        value={filters == null ? "" : filters[field]}
        placeholder={placeholder}
        onChange={(e) => {
          setFilters((prev) => ({
            ...prev,
            [field]: e.target.value.length != 0 ? e.target.value : undefined,
          }));
        }}
      />
    </div>
  );
}
