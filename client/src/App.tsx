import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import FileUploader from "./FileUpload";
import Graph from "./Graph";
import { GraphData } from "./types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        if (process.env.REACT_APP_API_URL == null) {
          throw new Error("No BASE_URL found");
        }
        const res = await fetch(
          (process.env.REACT_APP_API_URL + queryKey[0]) as string,
        );
        const data = await res.json();
        return data;
      },
    },
  },
});
export default function App() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <FileUploader setGraph={setGraph} />
      {graph != null && <Graph data={graph} />}
    </QueryClientProvider>
  );
}
