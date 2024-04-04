import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Base from "./Base";

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
  return (
    <QueryClientProvider client={queryClient}>
      <Base />
    </QueryClientProvider>
  );
}
