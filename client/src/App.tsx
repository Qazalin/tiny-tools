import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Base from "./Base";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string);
        console.log(res);
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
