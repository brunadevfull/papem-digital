
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { DisplayProvider } from "@/context/DisplayContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="papem-ui-theme">
      <DisplayProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Switch>
              <Route path="/" component={Index} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </TooltipProvider>
      </DisplayProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
