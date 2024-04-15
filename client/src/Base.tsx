import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import FiltersPanel from "./Filters";
import ScheduleGraph from "./Graph";
import FuzzGraph from "./Fuzzer";
import { Filters } from "./Graph/Filters";
import Spinner from "./Spinner";
import { FuzzNode, GraphData, ScheduleNode } from "./types";
import Share from "./Share";
import TinygradParser from "./BasePy";

export default function Base() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const id = new URLSearchParams(window.location.search).get("id");
  const { data, isLoading } = useQuery<GraphData>({
    queryKey: [`?id=${id}`],
    enabled: id != null,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (id == null || data == null) return;
    setGraph(data);
  }, [data, id]);

  function updateGraph(data: GraphData) {
    const url = new URL(window.location as any);
    window.history.pushState({}, "", `${url.origin}${url.pathname}`);
    setGraph(data);
  }

  return (
    <div className="flex items-center justify-center min-w-[100vw] min-h-screen">
      {id != null && (isLoading || graph == null) ? (
        <Spinner className="w-8 h-8" />
      ) : graph == null ? (
        <TinygradParser setGraph={updateGraph} showTip />
      ) : (
        <>
          <div className="absolute top-5 left-5 z-10 flex flex-col space-y-4">
            <TinygradParser setGraph={updateGraph} showTip={id != null} />
            {"outputs" in graph.nodes[0] && (
              <FiltersPanel filters={filters} setFilters={setFilters} />
            )}
          </div>
          {"outputs" in graph.nodes[0] ? (
            <ScheduleGraph
              data={graph as GraphData<ScheduleNode>}
              filters={filters}
            />
          ) : (
            <FuzzGraph data={graph as GraphData<FuzzNode>} />
          )}
        </>
      )}
    </div>
  );
}
