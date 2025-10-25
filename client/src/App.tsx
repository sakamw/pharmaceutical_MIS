import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { useEffect, useState } from "react";
import { me, MeResponse } from "./lib/auth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import Stock from "./pages/Stock";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection after 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Refetch when network reconnects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});

const App = () => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            {user ? (
              <Route
                element={
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        <DashboardHeader user={user} />
                        <main className="flex-1 p-6 bg-muted/30">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/medicines" element={<Medicines />} />
                            <Route path="/stock" element={<Stock />} />
                            <Route path="/sales" element={<Sales />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                }
              >
                <Route path="*" element={<></>} />
              </Route>
            ) : loading ? (
              <Route path="*" element={<div />} />
            ) : (
              <Route path="*" element={<Auth />} />
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
