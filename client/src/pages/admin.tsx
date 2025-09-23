/**
 * Admin Dashboard Page for Target The Heart
 * Provides administrative interface for managing users, groups, meetings, prayers, and chats
 * 
 * @description Admin-only page accessible to garygasson@gmail.com for system management
 * @returns {JSX.Element} Admin dashboard interface
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminDashboardStats {
  stats: {
    users: number;
    groups: number;
    meetings: number;
    prayers: number;
  };
  recent: {
    users: any[];
    groups: any[];
  };
}

interface AdminUsersResponse {
  users: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminGroupsResponse {
  groups: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminMeetingsResponse {
  meetings: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminPrayersResponse {
  prayers: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminHealthResponse {
  status: string;
  database: {
    connected: boolean;
    responseTime: number;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Main admin dashboard component
 * 
 * @description Renders the complete admin interface with tabs for different management sections
 * @returns {JSX.Element} Admin dashboard UI
 */
export default function AdminDashboard() {
  const { user, isLoading, getToken } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  const isAdmin = user?.email === "garygasson@gmail.com";


  useEffect(() => {
    // Only show access denied if we're not loading and user is definitely not admin
    if (!isLoading && user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive"
      });
    }
  }, [isAdmin, isLoading, user, toast]);

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats, error: statsError } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const token = await getToken();
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    enabled: isAdmin,
    retry: 1,
  });


  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-card shadow-lg min-h-screen">
        <div className="px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Loading...</h1>
          <p className="text-muted-foreground">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  // Show access denied only if we're not loading and user is definitely not admin
  if (!isLoading && user && !isAdmin) {
    return (
      <div className="max-w-md mx-auto bg-card shadow-lg min-h-screen">
        <div className="px-6 py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have administrative privileges.</p>
          <p className="text-sm text-muted-foreground mt-2">Email: {user.email}</p>
          <Button
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show access denied if no user (not authenticated)
  if (!isLoading && !user) {
    return (
      <div className="max-w-md mx-auto bg-card shadow-lg min-h-screen">
        <div className="px-6 py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Not Authenticated</h1>
          <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
          <Button
            onClick={() => window.location.href = "/"}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-card shadow-lg min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-3"
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">System Management</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <i className="fas fa-crown mr-1"></i>
          Administrator
        </Badge>
      </header>

      {/* Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="prayers">Prayers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Users"
                value={dashboardStats?.stats.users || 0}
                icon="fas fa-users"
                color="blue"
                loading={isLoadingStats}
              />
              <StatCard
                title="Groups"
                value={dashboardStats?.stats.groups || 0}
                icon="fas fa-users-cog"
                color="green"
                loading={isLoadingStats}
              />
              <StatCard
                title="Meetings"
                value={dashboardStats?.stats.meetings || 0}
                icon="fas fa-calendar"
                color="purple"
                loading={isLoadingStats}
              />
              <StatCard
                title="Prayers"
                value={dashboardStats?.stats.prayers || 0}
                icon="fas fa-hands-praying"
                color="orange"
                loading={isLoadingStats}
              />
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats?.recent.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats?.recent.groups.map((group) => (
                      <div key={group.id} className="p-2 border rounded">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">{group.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {new Date(group.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground break-words leading-relaxed">
                          {group.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <AdminUsersSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          {/* Groups Management */}
          <TabsContent value="groups" className="space-y-4">
            <AdminGroupsSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          {/* Meetings Management */}
          <TabsContent value="meetings" className="space-y-4">
            <AdminMeetingsSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          {/* Prayers Management */}
          <TabsContent value="prayers" className="space-y-4">
            <AdminPrayersSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          {/* System Management */}
          <TabsContent value="system" className="space-y-4">
            <AdminSystemSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Statistics card component
 * 
 * @description Displays a statistic with icon and color coding
 * @param {object} props - Component props
 * @param {string} props.title - Card title
 * @param {number} props.value - Numeric value to display
 * @param {string} props.icon - FontAwesome icon class
 * @param {string} props.color - Color theme
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Statistics card
 */
function StatCard({ title, value, icon, color, loading }: {
  title: string;
  value: number;
  icon: string;
  color: string;
  loading: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
    orange: "bg-orange-100 text-orange-800",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {loading ? (
                <i className="fas fa-spinner fa-spin text-lg"></i>
              ) : (
                value.toLocaleString()
              )}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
            <i className={`${icon} text-lg`}></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Users management section
 * 
 * @description Manages user accounts with search, view, edit, and delete capabilities
 * @param {object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {function} props.setSearchTerm - Function to update search term
 * @returns {JSX.Element} Users management interface
 */
function AdminUsersSection({ searchTerm, setSearchTerm }: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const { data: usersData, isLoading } = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm })
      });
      const response = await apiRequest("GET", `/api/admin/users?${params}`);
      return response as unknown as AdminUsersResponse;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      // Refetch users data
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting user", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline">
          <i className="fas fa-download mr-2"></i>
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
          <p className="text-muted-foreground mt-2">Loading users...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium">Groups</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.users?.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{user.email}</td>
                      <td className="p-4 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge variant="outline">0 groups</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {usersData?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, usersData.pagination.total)} of {usersData.pagination.total} users
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= usersData.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Groups management section
 * 
 * @description Manages groups with search, view, edit, and delete capabilities
 * @param {object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {function} props.setSearchTerm - Function to update search term
 * @returns {JSX.Element} Groups management interface
 */
function AdminGroupsSection({ searchTerm, setSearchTerm }: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const { toast } = useToast();

  const { data: groupsData, isLoading } = useQuery<AdminGroupsResponse>({
    queryKey: ["/api/admin/groups", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm })
      });
      const response = await apiRequest("GET", `/api/admin/groups?${params}`);
      return response as unknown as AdminGroupsResponse;
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("DELETE", `/api/admin/groups/${groupId}`);
    },
    onSuccess: () => {
      toast({ title: "Group deleted successfully" });
      // Refetch groups data
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting group", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline">
          <i className="fas fa-download mr-2"></i>
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
          <p className="text-muted-foreground mt-2">Loading groups...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Group</th>
                    <th className="p-4 font-medium">Description</th>
                    <th className="p-4 font-medium">Members</th>
                    <th className="p-4 font-medium">Created</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupsData?.groups?.map((group: any) => (
                    <tr key={group.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-users text-green-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {group.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm max-w-xs">
                        <p className="truncate">{group.description || "No description"}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{group.memberCount || 0} members</Badge>
                      </td>
                      <td className="p-4 text-sm">{new Date(group.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedGroup(group)}>
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            disabled={deleteGroupMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {groupsData?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, groupsData.pagination.total)} of {groupsData.pagination.total} groups
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= groupsData.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Meetings management section
 * 
 * @description Manages meetings with search, view, edit, and delete capabilities
 * @param {object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {function} props.setSearchTerm - Function to update search term
 * @returns {JSX.Element} Meetings management interface
 */
function AdminMeetingsSection({ searchTerm, setSearchTerm }: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const { toast } = useToast();

  const { data: meetingsData, isLoading } = useQuery<AdminMeetingsResponse>({
    queryKey: ["/api/admin/meetings", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm })
      });
      const response = await apiRequest("GET", `/api/admin/meetings?${params}`);
      return response as unknown as AdminMeetingsResponse;
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      return apiRequest("DELETE", `/api/admin/meetings/${meetingId}`);
    },
    onSuccess: () => {
      toast({ title: "Meeting deleted successfully" });
      // Refetch meetings data
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting meeting", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleDeleteMeeting = (meetingId: string, meetingTitle: string) => {
    if (confirm(`Are you sure you want to delete the meeting "${meetingTitle}"? This action cannot be undone.`)) {
      deleteMeetingMutation.mutate(meetingId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search meetings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline">
          <i className="fas fa-download mr-2"></i>
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
          <p className="text-muted-foreground mt-2">Loading meetings...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Meeting</th>
                    <th className="p-4 font-medium">Group</th>
                    <th className="p-4 font-medium">Date & Time</th>
                    <th className="p-4 font-medium">Location</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetingsData?.meetings?.map((meeting: any) => (
                    <tr key={meeting.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-calendar text-purple-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">ID: {meeting.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{meeting.groupName || "No group"}</td>
                      <td className="p-4 text-sm">
                        <div>
                          <p>{new Date(meeting.meetingDate).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {meeting.startTime} - {meeting.endTime}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-sm max-w-xs">
                        <p className="truncate">{meeting.location || "No location"}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedMeeting(meeting)}>
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                            disabled={deleteMeetingMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {meetingsData?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, meetingsData.pagination.total)} of {meetingsData.pagination.total} meetings
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= meetingsData.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Prayers management section
 * 
 * @description Manages prayers with search, view, edit, and delete capabilities
 * @param {object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {function} props.setSearchTerm - Function to update search term
 * @returns {JSX.Element} Prayers management interface
 */
function AdminPrayersSection({ searchTerm, setSearchTerm }: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedPrayer, setSelectedPrayer] = useState<any>(null);
  const { toast } = useToast();

  const { data: prayersData, isLoading } = useQuery<AdminPrayersResponse>({
    queryKey: ["/api/admin/prayers", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm })
      });
      const response = await apiRequest("GET", `/api/admin/prayers?${params}`);
      return response as unknown as AdminPrayersResponse;
    },
  });

  const deletePrayerMutation = useMutation({
    mutationFn: async (prayerId: string) => {
      return apiRequest("DELETE", `/api/admin/prayers/${prayerId}`);
    },
    onSuccess: () => {
      toast({ title: "Prayer deleted successfully" });
      // Refetch prayers data
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting prayer", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleDeletePrayer = (prayerId: string, prayerTitle: string) => {
    if (confirm(`Are you sure you want to delete the prayer "${prayerTitle}"? This action cannot be undone.`)) {
      deletePrayerMutation.mutate(prayerId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search prayers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline">
          <i className="fas fa-download mr-2"></i>
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
          <p className="text-muted-foreground mt-2">Loading prayers...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Prayer</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Group</th>
                    <th className="p-4 font-medium">Created</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prayersData?.prayers?.map((prayer: any) => (
                    <tr key={prayer.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-hands-praying text-orange-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium">{prayer.title}</p>
                            <p className="text-xs text-muted-foreground">ID: {prayer.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{prayer.category || "General"}</Badge>
                      </td>
                      <td className="p-4 text-sm">{prayer.groupName || "No group"}</td>
                      <td className="p-4 text-sm">{new Date(prayer.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedPrayer(prayer)}>
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeletePrayer(prayer.id, prayer.title)}
                            disabled={deletePrayerMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {prayersData?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, prayersData.pagination.total)} of {prayersData.pagination.total} prayers
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= prayersData.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * System management section
 * 
 * @description System health, logs, and maintenance tools
 * @returns {JSX.Element} System management interface
 */
function AdminSystemSection() {
  const { data: healthData } = useQuery<AdminHealthResponse>({
    queryKey: ["/api/admin/health"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/health");
      return response as unknown as AdminHealthResponse;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-heartbeat text-green-500"></i>
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {healthData?.status || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Database</p>
              <p className="font-medium flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${healthData?.database?.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {healthData?.database?.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="font-medium">{Math.floor((healthData?.uptime || 0) / 60)} minutes</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memory</p>
              <p className="font-medium">{Math.round((healthData?.memory?.used || 0) / 1024 / 1024)} MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-8">
        <i className="fas fa-cogs text-4xl text-muted-foreground mb-4"></i>
        <h3 className="text-lg font-medium mb-2">System Management</h3>
        <p className="text-muted-foreground">Additional system tools coming soon...</p>
      </div>
    </div>
  );
}
