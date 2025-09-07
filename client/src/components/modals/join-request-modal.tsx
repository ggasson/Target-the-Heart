import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface JoinRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: any;
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export default function JoinRequestModal({ 
  open, 
  onOpenChange, 
  group, 
  onSubmit,
  isLoading 
}: JoinRequestModalProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message.trim());
  };

  const handleClose = () => {
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-2xl text-primary"></i>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">Join Prayer Group</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground mt-2">
            Send a request to join {group?.name}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">Message to Administrator</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell them why you'd like to join this group..."
              rows={3}
              className="resize-none"
              data-testid="textarea-join-message"
            />
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-join"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-send-request"
            >
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
