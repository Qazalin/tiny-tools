import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Base from "./Base";
import { API_URL } from "./utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch((API_URL + queryKey[0]) as string);
        return await res.json();
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Base />
    </QueryClientProvider>
  );
}
