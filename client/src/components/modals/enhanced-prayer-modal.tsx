import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Shield, MessageSquare, Heart, Tag, Star, AlertCircle } from "lucide-react";

interface EnhancedPrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  templateId?: string;
}

interface PrayerTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  tags: string;
}

export default function EnhancedPrayerModal({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName,
  templateId 
}: EnhancedPrayerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [privacyLevel, setPrivacyLevel] = useState("group");
  const [tags, setTags] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState("weekly");
  const [allowComments, setAllowComments] = useState(true);
  const [allowPrayerResponses, setAllowPrayerResponses] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Load prayer templates
  const { data: templates = [] } = useQuery<PrayerTemplate[]>({
    queryKey: ["/api/prayer-templates", groupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/prayer-templates?groupId=${groupId}`);
      return response as unknown as PrayerTemplate[];
    },
    enabled: open,
  });

  // Load specific template if templateId is provided
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        setTitle(template.name);
        setDescription(template.template);
        setCategory(template.category);
        setTags(template.tags || "");
      }
    }
  }, [templateId, templates]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t: PrayerTemplate) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTitle(template.name);
      setDescription(template.template);
      setCategory(template.category);
      setTags(template.tags || "");
    }
  };

  // Create prayer request mutation
  const createPrayerMutation = useMutation({
    mutationFn: async (prayerData: any) => {
      return apiRequest('POST', '/api/prayers', prayerData);
    },
    onSuccess: (data) => {
      // Update template usage count if template was used
      if (selectedTemplate) {
        apiRequest('PUT', `/api/prayer-templates/${selectedTemplate}/usage`);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "prayers"] });
      
      toast({
        title: "Prayer Request Created",
        description: "Your prayer request has been shared with the group.",
      });
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prayer request",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("other");
    setPriority("normal");
    setPrivacyLevel("group");
    setTags("");
    setExpiresAt("");
    setReminderEnabled(false);
    setReminderFrequency("weekly");
    setAllowComments(true);
    setAllowPrayerResponses(true);
    setSelectedTemplate("");
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title and description.",
        variant: "destructive",
      });
      return;
    }

    const prayerData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      privacyLevel,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      reminderEnabled,
      reminderFrequency,
      allowComments,
      allowPrayerResponses,
      templateId: selectedTemplate || null,
      groupId,
    };

    createPrayerMutation.mutate(prayerData);
  };

  const categories = [
    { value: "health_healing", label: "Health & Healing" },
    { value: "family_relationships", label: "Family & Relationships" },
    { value: "work_career", label: "Work & Career" },
    { value: "spiritual_growth", label: "Spiritual Growth" },
    { value: "financial_provision", label: "Financial Provision" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low", icon: "🟢" },
    { value: "normal", label: "Normal", icon: "🟡" },
    { value: "high", label: "High", icon: "🟠" },
    { value: "urgent", label: "Urgent", icon: "🔴" },
  ];

  const privacyLevels = [
    { value: "public", label: "Public", description: "Visible to everyone" },
    { value: "group", label: "Group Only", description: "Visible to group members only" },
    { value: "private", label: "Private", description: "Only visible to you and group leaders" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Create Prayer Request</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share your prayer request with "{groupName}"
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prayer Templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Prayer Templates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map((template: PrayerTemplate) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate === template.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prayer-title">Title *</Label>
                <Input
                  id="prayer-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief title for your prayer request"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="prayer-description">Description *</Label>
                <Textarea
                  id="prayer-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share the details of what you'd like prayer for..."
                  rows={4}
                  className="mt-1 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prayer-category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="prayer-priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center space-x-2">
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="prayer-tags">Tags (comma-separated)</Label>
                <Input
                  id="prayer-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., surgery, family, job search"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add tags to help others find and understand your prayer request
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Privacy & Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="privacy-level">Privacy Level</Label>
                <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {privacyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-comments">Allow Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others add encouraging comments
                    </p>
                  </div>
                  <Switch
                    id="allow-comments"
                    checked={allowComments}
                    onCheckedChange={setAllowComments}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-responses">Allow Prayer Responses</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others say "I'm praying"
                    </p>
                  </div>
                  <Switch
                    id="allow-responses"
                    checked={allowPrayerResponses}
                    onCheckedChange={setAllowPrayerResponses}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing & Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Timing & Reminders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set when this prayer request should expire
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reminder-enabled">Enable Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders to update your prayer request
                  </p>
                </div>
                <Switch
                  id="reminder-enabled"
                  checked={reminderEnabled}
                  onCheckedChange={setReminderEnabled}
                />
              </div>

              {reminderEnabled && (
                <div>
                  <Label htmlFor="reminder-frequency">Reminder Frequency</Label>
                  <Select value={reminderFrequency} onValueChange={setReminderFrequency}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPrayerMutation.isPending || !title.trim() || !description.trim()}
          >
            {createPrayerMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Create Prayer Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
