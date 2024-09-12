import pako from "pako";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Spinner from "./components/Spinner";
import GraphLoader from "./tinygrad/GraphLoader";
import ScheduleGraph, {
  type Filters,
  Legend,
  FiltersBox,
} from "./schedule-graph";
import { GraphData, ScheduleNode } from "./types";
import { API_URL } from "./utils";

export default function Base() {
  // base state
  const [filters, setFilters] = useState<Filters | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  function updateGraph(data: GraphData) {
    const url = new URL(window.location as any);
    window.history.pushState({}, "", `${url.origin}${url.pathname}`);
    setGraph(data);
  }

  // redis fetcher
  const id = new URLSearchParams(window.location.search).get("id");
  const { data, isLoading } = useQuery<GraphData>({
    queryKey: [`?id=${id}`],
    enabled: id != null,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async ({ queryKey }) => {
      const res = await fetch((API_URL + queryKey[0]) as string);
      const data = await res.arrayBuffer();
      return JSON.parse(pako.inflate(new Uint8Array(data), { to: "string" }));
    },
  });
  useEffect(() => {
    if (id == null || data == null) return;
    setGraph(data);
  }, [data, id]);
  if (id != null && (isLoading || graph == null)) {
    return <Spinner className="w-8 h-8" />;
  }

  // start page
  if (graph == null) {
    return <GraphLoader setGraph={updateGraph} showTip />;
  }

  // main tool w filters
  return (
    <>
      <div className="absolute top-5 left-5 z-10 flex flex-col space-y-4">
        <GraphLoader setGraph={updateGraph} />
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-4">
            <FiltersBox
              filters={filters}
              setFilters={setFilters}
              data={graph}
            />
            <Legend />
          </div>
        </div>
      </div>
      <ScheduleGraph
        data={graph as GraphData<ScheduleNode>}
        filters={filters}
      />
    </>
  );
}
