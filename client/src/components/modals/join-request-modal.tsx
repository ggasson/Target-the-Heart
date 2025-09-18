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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface JoinRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: any;
  onSubmit: (data: { message: string; birthday?: string; shareBirthday?: boolean }) => void;
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
  const [birthday, setBirthday] = useState("");
  const [shareBirthday, setShareBirthday] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      message: message.trim(),
      birthday: birthday || undefined,
      shareBirthday: shareBirthday
    });
  };

  const handleClose = () => {
    setMessage("");
    setBirthday("");
    setShareBirthday(false);
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

          {/* Birthday section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="birthday">
                Birthday {group?.requireBirthdayToJoin && <span className="text-red-500">*</span>}
                <span className="text-sm text-muted-foreground ml-1">(optional)</span>
              </Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="mt-1"
                data-testid="input-birthday"
                required={group?.requireBirthdayToJoin}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shareBirthday"
                checked={shareBirthday}
                onCheckedChange={(checked) => setShareBirthday(checked as boolean)}
                data-testid="checkbox-share-birthday"
              />
              <Label 
                htmlFor="shareBirthday" 
                className="text-sm font-normal cursor-pointer"
              >
                Share my birthday with this group
              </Label>
            </div>
            
            {group?.requireBirthdayToJoin && (
              <p className="text-xs text-muted-foreground">
                This group requires a birthday to join
              </p>
            )}
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
