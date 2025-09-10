import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const tabs = [
    {
      id: "home",
      icon: "fas fa-home",
      label: "Home",
    },
    {
      id: "groups",
      icon: "fas fa-users",
      label: "Groups",
    },
    {
      id: "prayers",
      icon: "target-symbol",
      label: "Prayers",
    },
    {
      id: "chat",
      icon: "fas fa-comments",
      label: "Chat",
      hasNotification: hasUnreadMessages,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-6 py-3 z-40">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center space-y-1 p-2 h-auto relative ${
              activeTab === tab.id 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`nav-${tab.id}`}
          >
            {tab.icon === "target-symbol" ? (
              <img src="/target-symbol.png" alt="Target Symbol" className="w-4 h-4" />
            ) : (
              <i className={`${tab.icon} text-lg`}></i>
            )}
            <span className="text-xs">{tab.label}</span>
            {tab.hasNotification && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            )}
          </Button>
        ))}
      </div>
    </nav>
  );
}
