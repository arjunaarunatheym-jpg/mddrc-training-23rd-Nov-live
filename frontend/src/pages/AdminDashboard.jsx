import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Building2, Users, Calendar, ClipboardList, MessageSquare } from "lucide-react";

const AdminDashboard = ({ user, onLogout }) => {
  const [companies, setCompanies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("companies");

  // Company form
  const [companyName, setCompanyName] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  // Session form
  const [sessionForm, setSessionForm] = useState({
    name: "",
    company_id: "",
    location: "",
    start_date: "",
    end_date: "",
    supervisor_ids: [],
  });
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // User form
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
    role: "participant",
    company_id: "",
    location: "",
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadSessions();
    loadUsers();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await axiosInstance.get("/companies");
      setCompanies(response.data);
    } catch (error) {
      toast.error("Failed to load companies");
    }
  };

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/sessions");
      setSessions(response.data);
    } catch (error) {
      toast.error("Failed to load sessions");
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/companies", { name: companyName });
      toast.success("Company created successfully");
      setCompanyName("");
      setCompanyDialogOpen(false);
      loadCompanies();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create company");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/sessions", sessionForm);
      toast.success("Session created successfully");
      setSessionForm({
        name: "",
        company_id: "",
        location: "",
        start_date: "",
        end_date: "",
        supervisor_ids: [],
      });
      setSessionDialogOpen(false);
      loadSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create session");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/register", userForm);
      toast.success("User created successfully");
      setUserForm({
        email: "",
        password: "",
        full_name: "",
        id_number: "",
        role: "participant",
        company_id: "",
        location: "",
      });
      setUserDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create user");
    }
  };

  const supervisors = users.filter((u) => u.role === "supervisor");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button
            data-testid="admin-logout-button"
            onClick={onLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="companies" data-testid="companies-tab">
              <Building2 className="w-4 h-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="sessions-tab">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="feedback" data-testid="feedback-tab">
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Companies</CardTitle>
                    <CardDescription>Manage training companies</CardDescription>
                  </div>
                  <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-company-button">
                        <Building2 className="w-4 h-4 mr-2" />
                        Add Company
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Company</DialogTitle>
                        <DialogDescription>
                          Add a new company to the system
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCompany} className="space-y-4">
                        <div>
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            data-testid="company-name-input"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                          />
                        </div>
                        <Button data-testid="submit-company-button" type="submit" className="w-full">
                          Create Company
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companies.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No companies yet</p>
                  ) : (
                    companies.map((company) => (
                      <div
                        key={company.id}
                        data-testid={`company-item-${company.id}`}
                        className="p-4 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{company.name}</h3>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(company.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Training Sessions</CardTitle>
                    <CardDescription>Manage training sessions</CardDescription>
                  </div>
                  <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-session-button">
                        <Calendar className="w-4 h-4 mr-2" />
                        Add Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Session</DialogTitle>
                        <DialogDescription>
                          Add a new training session
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateSession} className="space-y-4">
                        <div>
                          <Label htmlFor="session-name">Session Name</Label>
                          <Input
                            id="session-name"
                            data-testid="session-name-input"
                            value={sessionForm.name}
                            onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="session-company">Company</Label>
                          <Select
                            value={sessionForm.company_id}
                            onValueChange={(value) => setSessionForm({ ...sessionForm, company_id: value })}
                          >
                            <SelectTrigger data-testid="session-company-select">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="session-location">Location</Label>
                          <Input
                            id="session-location"
                            data-testid="session-location-input"
                            value={sessionForm.location}
                            onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                              id="start-date"
                              data-testid="session-start-date-input"
                              type="date"
                              value={sessionForm.start_date}
                              onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                              id="end-date"
                              data-testid="session-end-date-input"
                              type="date"
                              value={sessionForm.end_date}
                              onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button data-testid="submit-session-button" type="submit" className="w-full">
                          Create Session
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No sessions yet</p>
                  ) : (
                    sessions.map((session) => {
                      const company = companies.find((c) => c.id === session.company_id);
                      return (
                        <div
                          key={session.id}
                          data-testid={`session-item-${session.id}`}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <h3 className="font-semibold text-gray-900">{session.name}</h3>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p>Company: {company?.name || "N/A"}</p>
                            <p>Location: {session.location}</p>
                            <p>
                              Duration: {session.start_date} to {session.end_date}
                            </p>
                            <p>Participants: {session.participant_ids.length}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage system users</CardDescription>
                  </div>
                  <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-user-button">
                        <Users className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                          <Label htmlFor="user-email">Email</Label>
                          <Input
                            id="user-email"
                            data-testid="user-email-input"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-password">Password</Label>
                          <Input
                            id="user-password"
                            data-testid="user-password-input"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-fullname">Full Name</Label>
                          <Input
                            id="user-fullname"
                            data-testid="user-fullname-input"
                            value={userForm.full_name}
                            onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-idnumber">ID Number</Label>
                          <Input
                            id="user-idnumber"
                            data-testid="user-idnumber-input"
                            value={userForm.id_number}
                            onChange={(e) => setUserForm({ ...userForm, id_number: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-role">Role</Label>
                          <Select
                            value={userForm.role}
                            onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                          >
                            <SelectTrigger data-testid="user-role-select">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="participant">Participant</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {userForm.role === "participant" && (
                          <>
                            <div>
                              <Label htmlFor="user-company">Company</Label>
                              <Select
                                value={userForm.company_id}
                                onValueChange={(value) => setUserForm({ ...userForm, company_id: value })}
                              >
                                <SelectTrigger data-testid="user-company-select">
                                  <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                  {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="user-location">Location</Label>
                              <Input
                                id="user-location"
                                data-testid="user-location-input"
                                value={userForm.location}
                                onChange={(e) => setUserForm({ ...userForm, location: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                        <Button data-testid="submit-user-button" type="submit" className="w-full">
                          Create User
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No users yet</p>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.id}
                        data-testid={`user-item-${u.id}`}
                        className="p-4 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{u.full_name}</h3>
                          <p className="text-sm text-gray-600">{u.email}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {u.role}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              ID: {u.id_number}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Course Feedback</CardTitle>
                <CardDescription>View feedback by company and session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">Feedback compilation coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
