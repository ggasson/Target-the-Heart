import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  meetingDate: string;
  venue?: string;
  venueAddress?: string;
  maxAttendees?: number;
  status: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringDayOfWeek?: string;
  recurringTime?: string;
  group: {
    id: string;
    name: string;
  };
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  // Fetch all meetings for the user's groups
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings/all"],
  });

  // Filter meetings for the selected month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  const meetingsInMonth = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.meetingDate);
    return meetingDate >= monthStart && meetingDate <= monthEnd;
  });

  // Get meetings for selected date
  const meetingsForSelectedDate = meetings.filter(meeting => 
    isSameDay(parseISO(meeting.meetingDate), selectedDate)
  );

  // Get dates that have meetings for calendar highlighting
  const datesWithMeetings = meetings.map(meeting => parseISO(meeting.meetingDate));

  const exportToCalendar = (meeting: Meeting) => {
    const startDate = parseISO(meeting.meetingDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const event = {
      title: meeting.title,
      description: meeting.description || '',
      location: meeting.venue ? `${meeting.venue}${meeting.venueAddress ? `, ${meeting.venueAddress}` : ''}` : '',
      start: formatDate(startDate),
      end: formatDate(endDate),
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pray Connect//Calendar//EN
BEGIN:VEVENT
UID:${meeting.id}@prayconnect.app
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prayer Calendar</h1>
          <p className="text-muted-foreground">View and manage your prayer meetings</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            data-testid="button-month-view"
          >
            <i className="fas fa-calendar mr-2"></i>
            Month
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-list-view"
          >
            <i className="fas fa-list mr-2"></i>
            List
          </Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Calendar View</span>
                <Badge variant="outline">
                  {meetingsInMonth.length} meeting{meetingsInMonth.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasMeeting: datesWithMeetings,
                }}
                modifiersClassNames={{
                  hasMeeting: "bg-primary/20 text-primary font-bold",
                }}
                className="rounded-md border"
                data-testid="calendar-widget"
              />
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetingsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-calendar-alt text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">No meetings scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetingsForSelectedDate.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 border rounded-lg space-y-3"
                      data-testid={`meeting-${meeting.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">{meeting.group.name}</p>
                          {meeting.topic && (
                            <p className="text-sm text-primary mt-1">Topic: {meeting.topic}</p>
                          )}
                        </div>
                        <Badge variant={meeting.status === "scheduled" ? "default" : "secondary"}>
                          {meeting.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {format(parseISO(meeting.meetingDate), "h:mm a")}
                        </span>
                        {meeting.venue && (
                          <span>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {meeting.venue}
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCalendar(meeting)}
                          data-testid={`button-export-${meeting.id}`}
                        >
                          <i className="fas fa-download mr-2"></i>
                          Add to Calendar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/meeting/${meeting.id}`}
                          data-testid={`button-view-${meeting.id}`}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>All Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-calendar-alt text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No meetings scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings
                  .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
                  .map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 border rounded-lg space-y-3"
                      data-testid={`meeting-list-${meeting.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">{meeting.group.name}</p>
                          {meeting.topic && (
                            <p className="text-sm text-primary mt-1">Topic: {meeting.topic}</p>
                          )}
                        </div>
                        <Badge variant={meeting.status === "scheduled" ? "default" : "secondary"}>
                          {meeting.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {format(parseISO(meeting.meetingDate), "MMM d, yyyy")}
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {format(parseISO(meeting.meetingDate), "h:mm a")}
                        </span>
                        {meeting.venue && (
                          <span>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {meeting.venue}
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCalendar(meeting)}
                          data-testid={`button-export-list-${meeting.id}`}
                        >
                          <i className="fas fa-download mr-2"></i>
                          Add to Calendar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/meeting/${meeting.id}`}
                          data-testid={`button-view-list-${meeting.id}`}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}