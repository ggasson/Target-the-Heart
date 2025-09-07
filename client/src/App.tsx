import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Groups from "@/pages/groups";
import Prayers from "@/pages/prayers";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import BottomNavigation from "@/components/bottom-navigation";
import NotFound from "@/pages/not-found";

function MainApp() {
  const [activeTab, setActiveTab] = useState("home");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "groups":
        return <Groups />;
      case "prayers":
        return <Prayers />;
      case "chat":
        return <Chat />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-card shadow-lg min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="bg-card shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-praying-hands text-white text-sm"></i>
          </div>
          <div>
            <h1 className="font-semibold text-foreground">PrayTogether</h1>
            <p className="text-xs text-muted-foreground">Your spiritual community</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
