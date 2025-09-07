import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrayerModal({ open, onOpenChange }: PrayerModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myGroups = [] } = useQuery({
    queryKey: ["/api/groups/my"],
  });

  const createPrayerMutation = useMutation({
    mutationFn: async (prayerData: any) => {
      // For now, create prayer for each selected group
      // In a real app, you might want to handle this differently
      const promises = selectedGroups.map(groupId =>
        apiRequest("POST", "/api/prayers", {
          ...prayerData,
          groupId,
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Prayer request shared",
        description: "Your prayer request has been shared with the selected groups.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/my"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share prayer request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || selectedGroups.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select at least one group.",
        variant: "destructive",
      });
      return;
    }

    createPrayerMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
    });
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setCategory("other");
    setSelectedGroups([]);
    onOpenChange(false);
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setSelectedGroups(prev => 
      checked 
        ? [...prev, groupId]
        : prev.filter(id => id !== groupId)
    );
  };

  const categories = [
    { value: "health_healing", label: "Health & Healing" },
    { value: "family_relationships", label: "Family & Relationships" },
    { value: "work_career", label: "Work & Career" },
    { value: "spiritual_growth", label: "Spiritual Growth" },
    { value: "financial_provision", label: "Financial Provision" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Prayer Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Prayer Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like prayer for?"
              data-testid="input-prayer-title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share more details about your prayer request..."
              rows={4}
              className="resize-none"
              data-testid="textarea-prayer-description"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-prayer-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Share with Groups</Label>
            <div className="space-y-2 mt-2">
              {myGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You need to join a group before you can share prayer requests.
                </p>
              ) : (
                myGroups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={(checked) => 
                        handleGroupToggle(group.id, checked as boolean)
                      }
                      data-testid={`checkbox-group-${group.id}`}
                    />
                    <Label 
                      htmlFor={`group-${group.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {group.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-prayer"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createPrayerMutation.isPending || myGroups.length === 0}
              className="flex-1"
              data-testid="button-share-prayer"
            >
              {createPrayerMutation.isPending ? "Sharing..." : "Share Prayer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
