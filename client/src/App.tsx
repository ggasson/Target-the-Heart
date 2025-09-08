import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Groups from "@/pages/groups";
import Prayers from "@/pages/prayers";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import InvitePage from "@/pages/invite";
import BottomNavigation from "@/components/bottom-navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import NotFound from "@/pages/not-found";

function MainApp() {
  const [activeTab, setActiveTab] = useState("home");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <Home onTabChange={setActiveTab} />;
      case "groups":
        return <Groups />;
      case "prayers":
        return <Prayers />;
      case "chat":
        return <Chat />;
      default:
        return <Home onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-card shadow-lg min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="bg-card shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-black">
            <img 
              src="/pray-connect-logo.png" 
              alt="Pray Connect Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Pray Connect</h1>
            <p className="text-xs text-muted-foreground">Your spiritual community</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeSwitcher />
          <button className="relative p-2">
            <i className="fas fa-bell text-muted-foreground"></i>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"
            data-testid="button-profile"
          >
            <i className="fas fa-user text-primary text-sm"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pb-20">
        {activeTab === "profile" ? <Profile /> : renderActiveTab()}
      </div>

      {/* Bottom Navigation */}
      {activeTab !== "profile" && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      )}
      
      {/* Footer */}
      <div className="absolute bottom-1 left-0 right-0 text-center py-1">
        <p className="text-xs text-muted-foreground">Powered By Jesus</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Invitation route - accessible to both authenticated and unauthenticated users */}
      <Route path="/invite/:token" component={InvitePage} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={MainApp} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
