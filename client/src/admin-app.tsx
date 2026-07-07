import { QueryClientProvider } from "@tanstack/react-query";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { Toaster } from "./components/ui/toaster";
import Admin from "./pages/admin";
import { queryClient } from "./lib/queryClient";

export default function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <Admin />
        <Toaster />
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}