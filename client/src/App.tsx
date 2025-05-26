import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import ProfileEditor from "@/pages/profile-editor";
import ServerSettings from "@/pages/server-settings";
import Marketplace from "@/pages/marketplace";
import Achievements from "@/pages/achievements";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardLayout} />
      <Route path="/profile" component={DashboardLayout} />
      <Route path="/settings" component={DashboardLayout} />
      <Route path="/marketplace" component={DashboardLayout} />
      <Route path="/achievements" component={DashboardLayout} />
      <Route path="/analytics" component={DashboardLayout} />
      <Route path="/" component={() => <LoginPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={ProfileEditor} />
          <Route path="/settings" component={ServerSettings} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/analytics" component={Analytics} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
