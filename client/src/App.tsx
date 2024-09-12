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
      <div className="flex items-center justify-center min-w-[100vw] min-h-screen">
        <Base />
      </div>
    </QueryClientProvider>
  );
}
