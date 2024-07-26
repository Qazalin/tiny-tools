import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import FiltersPanel from "./Filters";
import ScheduleGraph from "./Graph";
import FuzzGraph from "./Fuzzer";
import UOpGraph from "./UOp";
import { Filters } from "./Graph/Filters";
import Spinner from "./Spinner";
import { FuzzNode, GraphData, ScheduleNode, UOpNode } from "./types";
import TinygradParser from "./BasePy";
import Legend from "./Legend";
import { API_URL } from "./utils";
import pako from "pako";

export default function Base() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  console.log(graph);
  const id = new URLSearchParams(window.location.search).get("id");
  const { data, isLoading } = useQuery<GraphData>({
    queryKey: [`?id=${id}`],
    enabled: id != null,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async ({ queryKey }) => {
      const res = await fetch((API_URL + queryKey[0]) as string);
      const data = await res.arrayBuffer();
      const de = pako.inflate(new Uint8Array(data), { to: "string" });
      return JSON.parse(de);
    },
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
            <TinygradParser setGraph={updateGraph} />
            {"outputs" in graph.nodes[0] && (
              <div className="flex flex-col space-y-4">
                <FiltersPanel filters={filters} setFilters={setFilters} />
                <Legend />
              </div>
            )}
          </div>
          {"outputs" in graph.nodes[0] ? (
            <ScheduleGraph
              data={graph as GraphData<ScheduleNode>}
              filters={filters}
            />
          ) : "vin" in graph.nodes[0] ? (
            <UOpGraph data={graph as GraphData<UOpNode>} />
          ) : (
            <FuzzGraph data={graph as GraphData<FuzzNode>} />
          )}
        </>
      )}
    </div>
  );
}
