import { RefObject, Dispatch, SetStateAction, useState, useEffect } from "react";
import { GraphData, ScheduleNode } from "../types";
import { GraphCanvasRef } from "reagraph";

export type Filters = Partial<{
  shape: string;
  code: string;
  ast: string;
  ref: string;
  category: string[];
}>;
export function useFilters({
  ref,
  filters,
  data,
}: {
  ref: RefObject<GraphCanvasRef | null>;
  filters: Filters | null;
  data: GraphData<ScheduleNode>;
}): GraphData<ScheduleNode> {
  console.log(filters);
  const [nodes, setNodes] = useState<ScheduleNode[]>(data.nodes);
  const [edges, setEdges] = useState<GraphData["edges"]>(data.edges);
  useEffect(() => {
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [data]);

  function isTarget(node: ScheduleNode) {
    const conds = [];
    if (filters?.shape) conds.push(node.shape.startsWith(filters.shape));
    if (filters?.code) conds.push(node.code.includes(filters.code));
    if (filters?.ast) conds.push(node.ast?.includes(filters.ast));
    if (filters?.ref) conds.push(node.ref === filters.ref);
    if (filters?.category && filters.category.length !== 0)
      conds.push(filters.category.includes(node.category));
    if (conds.length === 0) return;
    return conds.every((c) => c);
  }

  useEffect(() => {
    if (filters == null) return;
    const graph = ref.current?.getGraph();
    if (graph == null) {
      console.log("no graph!");
      return;
    }

    const newNodes = data.nodes.map((node) => {
      const target = isTarget(node);
      if (target == null) return node;
      return { ...node, fill: target ? "red" : "gray" };
    });

    setNodes(newNodes);
  }, [data, ref, filters]);
  return { nodes, edges };
}

type BaseProps = {
  filters: Filters | null;
  setFilters: Dispatch<SetStateAction<Filters | null>>;
};
export function FiltersBox({
  data,
  filters,
  setFilters,
}: BaseProps & {
  data: GraphData<ScheduleNode>;
}) {
  const [categories, setCategories] = useState<{ [k: string]: string[] }>({});
  useEffect(() => {
    const newCategories: { [k: string]: string[] } = {};
    data.nodes.forEach((n) => {
      if (n.category === "") return;
      if (!(n.category in newCategories)) {
        newCategories[n.category] = [];
      }
      newCategories[n.category].push(n.id);
    });
    const sorted = Object.entries(newCategories).sort(
      ([a, b]) => a.length - b.length,
    );
    setCategories(Object.fromEntries(sorted));
  }, [data]);

  return (
    <div className="bg-[#212225] rounded-md p-2 space-y-3 flex flex-col w-fit max-w-[320px]">
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
      <Filter
        filters={filters}
        setFilters={setFilters}
        field="ref"
        name="Buffer ref"
        placeholder=""
      />
      <div className="space-y-2 w-full flex flex-col">
        <label className="text-sm">Functions:</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(categories).map((c) => {
            return (
              <div className="space-x-2 flex">
                <input
                  onChange={(e) => {
                    let category =
                      filters?.category != null ? [...filters.category] : [];
                    if (e.target.checked) {
                      if (!category.includes(c)) category.push(c);
                    } else {
                      category = category.filter((rc) => rc !== c);
                    }
                    setFilters((prev) => ({ ...prev, category }));
                  }}
                  type="checkbox"
                  checked={(filters?.category || []).includes(c)}
                />
                <label className="text-sm flex-1 font-mono">{c}</label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Filter({
  filters,
  setFilters,
  field,
  name,
  placeholder,
}: {
  field: any;
  name: string;
  placeholder: string;
  filters: any;
  setFilters: any;
}) {
  return (
    <div className="space-x-2 flex-1 w-full flex items-center">
      <label className="text-sm flex-1">{name}</label>
      <input
        /* @ts-ignore */
        value={filters == null ? "" : filters[field]}
        placeholder={placeholder}
        onChange={(e) => {
          setFilters((prev: any) => ({
            ...prev,
            [field]: e.target.value.length !== 0 ? e.target.value : undefined,
          }));
        }}
      />
    </div>
  );
}
