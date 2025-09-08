import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Meeting } from "@shared/schema";

const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  topic: z.string().optional(),
  meetingDate: z.string().min(1, "Meeting date is required"),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  maxAttendees: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  recurringDayOfWeek: z.string().optional(),
  recurringTime: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  meeting?: Meeting | null;
}

export default function MeetingModal({ open, onOpenChange, groupId, meeting }: MeetingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecurring, setIsRecurring] = useState(false);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      description: "",
      topic: "",
      meetingDate: "",
      venue: "",
      venueAddress: "",
      maxAttendees: "",
      isRecurring: false,
      recurringPattern: "weekly",
      recurringDayOfWeek: "Friday",
      recurringTime: "17:45",
    },
  });

  useEffect(() => {
    if (meeting) {
      const meetingDate = new Date(meeting.meetingDate);
      form.reset({
        title: meeting.title,
        description: meeting.description || "",
        topic: meeting.topic || "",
        meetingDate: meetingDate.toISOString().slice(0, 16),
        venue: meeting.venue || "",
        venueAddress: meeting.venueAddress || "",
        maxAttendees: meeting.maxAttendees || "",
        isRecurring: meeting.isRecurring || false,
        recurringPattern: meeting.recurringPattern || "weekly",
        recurringDayOfWeek: meeting.recurringDayOfWeek || "Friday",
        recurringTime: meeting.recurringTime || "17:45",
      });
      setIsRecurring(meeting.isRecurring || false);
    } else {
      form.reset({
        title: "",
        description: "",
        topic: "",
        meetingDate: "",
        venue: "",
        venueAddress: "",
        maxAttendees: "",
        isRecurring: false,
        recurringPattern: "weekly",
        recurringDayOfWeek: "Friday",
        recurringTime: "17:45",
      });
      setIsRecurring(false);
    }
  }, [meeting, form]);

  const createMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const meetingData = {
        ...data,
        groupId,
        meetingDate: new Date(data.meetingDate),
        status: "scheduled" as const,
      };
      return apiRequest("POST", `/api/groups/${groupId}/meetings`, meetingData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/meetings`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const meetingData = {
        ...data,
        meetingDate: new Date(data.meetingDate),
      };
      return apiRequest("PUT", `/api/meetings/${meeting?.id}`, meetingData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/meetings`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meeting",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MeetingFormData) => {
    if (meeting) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? "Edit Meeting" : "Create New Meeting"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="e.g., Friday Prayer Meeting"
              data-testid="input-meeting-title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="topic">Meeting Topic</Label>
            <Input
              id="topic"
              {...form.register("topic")}
              placeholder="e.g., Healing & Restoration"
              data-testid="input-meeting-topic"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe what this meeting will focus on..."
              data-testid="textarea-meeting-description"
            />
          </div>

          <div>
            <Label htmlFor="meetingDate">Date & Time *</Label>
            <Input
              id="meetingDate"
              type="datetime-local"
              {...form.register("meetingDate")}
              data-testid="input-meeting-date"
            />
            {form.formState.errors.meetingDate && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.meetingDate.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              {...form.register("venue")}
              placeholder="e.g., Community Center"
              data-testid="input-meeting-venue"
            />
          </div>

          <div>
            <Label htmlFor="venueAddress">Venue Address</Label>
            <Textarea
              id="venueAddress"
              {...form.register("venueAddress")}
              placeholder="Full address of the meeting location"
              data-testid="textarea-meeting-address"
            />
          </div>

          <div>
            <Label htmlFor="maxAttendees">Max Attendees</Label>
            <Input
              id="maxAttendees"
              type="number"
              {...form.register("maxAttendees")}
              placeholder="e.g., 20"
              data-testid="input-max-attendees"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isRecurring"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setIsRecurring(checked);
                form.setValue("isRecurring", checked);
              }}
              data-testid="switch-recurring"
            />
            <Label htmlFor="isRecurring">Recurring Meeting</Label>
          </div>

          {isRecurring && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                <Select
                  value={form.watch("recurringPattern")}
                  onValueChange={(value) => form.setValue("recurringPattern", value)}
                >
                  <SelectTrigger data-testid="select-recurring-pattern">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurringDayOfWeek">Day of Week</Label>
                <Select
                  value={form.watch("recurringDayOfWeek")}
                  onValueChange={(value) => form.setValue("recurringDayOfWeek", value)}
                >
                  <SelectTrigger data-testid="select-recurring-day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurringTime">Time</Label>
                <Input
                  id="recurringTime"
                  type="time"
                  {...form.register("recurringTime")}
                  data-testid="input-recurring-time"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-meeting"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-save-meeting"
            >
              {isLoading ? "Saving..." : meeting ? "Update Meeting" : "Create Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}