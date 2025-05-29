import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Dashboard from "@/pages/dashboard";
import ServersPage from "@/pages/servers";
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
      <Route path="/servers" component={ServersPage} />
      <Route path="/dashboard/:serverId?" component={DashboardLayout} />
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
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/dashboard/:serverId" component={Dashboard} />
          <Route path="/profile/:serverId" component={ProfileEditor} />
          <Route path="/settings/:serverId" component={ServerSettings} />
          <Route path="/marketplace/:serverId" component={Marketplace} />
          <Route path="/achievements/:serverId" component={Achievements} />
          <Route path="/analytics/:serverId" component={Analytics} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
