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
      <Route path="/profile/:serverId" component={DashboardLayout} />
      <Route path="/profile-editor" component={DashboardLayout} />
      <Route path="/server/:serverId/settings" component={DashboardLayout} />
      <Route path="/server/:serverId/marketplace" component={DashboardLayout} />
      <Route path="/server/:serverId/achievements" component={DashboardLayout} />
      <Route path="/server/:serverId/analytics" component={DashboardLayout} />
      <Route path="/settings/:serverId" component={DashboardLayout} />
      <Route path="/marketplace/:serverId" component={DashboardLayout} />
      <Route path="/achievements/:serverId" component={DashboardLayout} />
      <Route path="/analytics/:serverId" component={DashboardLayout} />
      <Route path="/" component={() => <LoginPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardLayout() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  // Simple path-based routing
  const renderPage = () => {
    if (location.startsWith('/dashboard')) {
      return <Dashboard />;
    } else if (location.startsWith('/profile-editor') || location.startsWith('/profile')) {
      return <ProfileEditor />;
    } else if (location.includes('/settings')) {
      return <ServerSettings />;
    } else if (location.includes('/marketplace')) {
      return <Marketplace />;
    } else if (location.includes('/achievements')) {
      return <Achievements />;
    } else if (location.includes('/analytics')) {
      return <Analytics />;
    } else if (location === '/' || location === '/servers') {
      return <ServersPage />;
    } else {
      return <ServersPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-0 ml-0">
        <div className="lg:p-6 p-4 pt-16 lg:pt-6">
          {renderPage()}
        </div>
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
