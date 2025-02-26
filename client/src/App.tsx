import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TestModeProvider } from "@/lib/TestModeContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import StudyDesigner from "@/pages/StudyDesigner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/study-designer" component={StudyDesigner} />
      <Route path="/study-designer/:id" component={StudyDesigner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestModeProvider>
        <Router />
        <Toaster />
      </TestModeProvider>
    </QueryClientProvider>
  );
}

export default App;
