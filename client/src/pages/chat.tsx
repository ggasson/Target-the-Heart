import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Chat() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: myGroups = [] } = useQuery({
    queryKey: ["/api/groups/my"],
  });

  // Select first group by default
  useEffect(() => {
    if (myGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(myGroups[0].id);
    }
  }, [myGroups, selectedGroupId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "messages"],
    enabled: !!selectedGroupId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/groups/${selectedGroupId}/messages`, {
        content,
        messageType: "text"
      });
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroupId, "messages"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageContent.trim() && selectedGroupId) {
      sendMessageMutation.mutate(messageContent.trim());
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedGroup = myGroups.find(group => group.id === selectedGroupId);

  if (myGroups.length === 0) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-12">
          <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">No groups to chat with.</p>
          <p className="text-sm text-muted-foreground">Join a prayer group to start messaging with your community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <div className="bg-card px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <i className="fas fa-church text-primary"></i>
          </div>
          <div>
            <h3 className="font-semibold text-foreground" data-testid="text-group-name">
              {selectedGroup?.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {/* This would need member count from group memberships */}
              Active chat
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {myGroups.length > 1 && (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-1 bg-background"
              data-testid="select-group"
            >
              {myGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          <Button variant="ghost" size="icon">
            <i className="fas fa-ellipsis-v"></i>
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-comments text-3xl text-muted-foreground mb-3"></i>
            <p className="text-muted-foreground">No messages yet.</p>
            <p className="text-sm text-muted-foreground">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.user.id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${isCurrentUser ? 'justify-end' : ''}`}
                data-testid={`message-${message.id}`}
              >
                {!isCurrentUser && (
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-secondary">
                      {message.user.firstName?.[0]}{message.user.lastName?.[0]}
                    </span>
                  </div>
                )}
                
                <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                  <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                    <span className="text-sm font-medium text-foreground">
                      {isCurrentUser ? 'You' : `${message.user.firstName} ${message.user.lastName}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className={`rounded-lg rounded-${isCurrentUser ? 'tr' : 'tl'}-none p-3 max-w-xs ${
                    isCurrentUser 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>

                {isCurrentUser && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">You</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-border flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Button type="button" variant="ghost" size="icon">
            <i className="fas fa-plus"></i>
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="pr-12 rounded-full"
              data-testid="input-message"
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <i className="fas fa-smile"></i>
            </Button>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full"
            disabled={!messageContent.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </Button>
        </form>
      </div>
    </div>
  );
}
