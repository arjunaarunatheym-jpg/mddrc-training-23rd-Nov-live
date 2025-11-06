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
import { LogOut, Building2, Users, Calendar, ClipboardList, MessageSquare, BookOpen, Settings, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const AdminDashboard = ({ user, onLogout }) => {
  const [companies, setCompanies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("programs");

  // Company form
  const [companyName, setCompanyName] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  // Program form
  const [programForm, setProgramForm] = useState({ name: "", description: "" });
  const [programDialogOpen, setProgramDialogOpen] = useState(false);

  // Session form with participants
  const [sessionForm, setSessionForm] = useState({
    program_id: "",
    company_id: "",
    location: "",
    start_date: "",
    end_date: "",
    supervisor_ids: [],
    participants: [],
  });
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
    location: "",
  });
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesRes, programsRes, sessionsRes, usersRes] = await Promise.all([
        axiosInstance.get("/companies"),
        axiosInstance.get("/programs"),
        axiosInstance.get("/sessions"),
        axiosInstance.get("/users"),
      ]);
      setCompanies(companiesRes.data);
      setPrograms(programsRes.data);
      setSessions(sessionsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/companies", { name: companyName });
      toast.success("Company created successfully");
      setCompanyName("");
      setCompanyDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create company");
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/programs", programForm);
      toast.success("Program created successfully");
      setProgramForm({ name: "", description: "" });
      setProgramDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create program");
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipant.email || !newParticipant.password || !newParticipant.full_name || !newParticipant.id_number) {
      toast.error("Please fill all participant fields");
      return;
    }
    setSessionForm({
      ...sessionForm,
      participants: [...sessionForm.participants, { ...newParticipant }],
    });
    setNewParticipant({ email: "", password: "", full_name: "", id_number: "", location: "" });
    toast.success("Participant added to list");
  };

  const handleRemoveParticipant = (index) => {
    const updated = sessionForm.participants.filter((_, i) => i !== index);
    setSessionForm({ ...sessionForm, participants: updated });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (sessionForm.participants.length === 0) {
      toast.error("Please add at least one participant");
      return;
    }

    try {
      // Get program name for session name
      const program = programs.find(p => p.id === sessionForm.program_id);
      if (!program) {
        toast.error("Please select a program");
        return;
      }

      // Create all participants first
      const participantIds = [];
      for (const participant of sessionForm.participants) {
        try {
          const response = await axiosInstance.post("/auth/register", {
            ...participant,
            role: "participant",
            company_id: sessionForm.company_id,
            location: participant.location || sessionForm.location,
          });
          participantIds.push(response.data.id);
        } catch (error) {
          toast.error(`Failed to create participant ${participant.full_name}: ${error.response?.data?.detail || 'Unknown error'}`);
          return;
        }
      }

      // Create session with program name
      await axiosInstance.post("/sessions", {
        name: program.name,
        program_id: sessionForm.program_id,
        company_id: sessionForm.company_id,
        location: sessionForm.location,
        start_date: sessionForm.start_date,
        end_date: sessionForm.end_date,
        supervisor_ids: sessionForm.supervisor_ids,
        participant_ids: participantIds,
      });

      toast.success(`Session created with ${participantIds.length} participants`);
      setSessionForm({
        program_id: "",
        company_id: "",
        location: "",
        start_date: "",
        end_date: "",
        supervisor_ids: [],
        participants: [],
      });
      setSessionDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create session");
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
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="programs" data-testid="programs-tab">
              <BookOpen className="w-4 h-4 mr-2" />
              Programs
            </TabsTrigger>
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

          {/* Programs Tab */}
          <TabsContent value="programs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Training Programs</CardTitle>
                    <CardDescription>Manage your training modules</CardDescription>
                  </div>
                  <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-program-button">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Add Program
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Program</DialogTitle>
                        <DialogDescription>
                          Add a new training program/module
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateProgram} className="space-y-4">
                        <div>
                          <Label htmlFor="program-name">Program Name *</Label>
                          <Input
                            id="program-name"
                            data-testid="program-name-input"
                            placeholder="e.g., Defensive Riding"
                            value={programForm.name}
                            onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="program-description">Description (Optional)</Label>
                          <Textarea
                            id="program-description"
                            data-testid="program-description-input"
                            placeholder="Brief description of the program"
                            value={programForm.description}
                            onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                          />
                        </div>
                        <Button data-testid="submit-program-button" type="submit" className="w-full">
                          Create Program
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {programs.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No programs yet. Create your first training program!</p>
                    </div>
                  ) : (
                    programs.map((program) => (
                      <div
                        key={program.id}
                        data-testid={`program-item-${program.id}`}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{program.name}</h3>
                          {program.description && (
                            <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Created: {new Date(program.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                    <CardDescription>Create sessions with participants</CardDescription>
                  </div>
                  <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-session-button" disabled={programs.length === 0 || companies.length === 0}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Add Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Session</DialogTitle>
                        <DialogDescription>
                          Select program and add participants
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateSession} className="space-y-6">
                        {/* Session Details */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Session Details</h3>
                          <div>
                            <Label htmlFor="session-program">Program/Module *</Label>
                            <Select
                              value={sessionForm.program_id}
                              onValueChange={(value) => setSessionForm({ ...sessionForm, program_id: value })}
                              required
                            >
                              <SelectTrigger data-testid="session-program-select">
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                              <SelectContent>
                                {programs.map((program) => (
                                  <SelectItem key={program.id} value={program.id}>
                                    {program.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="session-company">Company *</Label>
                            <Select
                              value={sessionForm.company_id}
                              onValueChange={(value) => setSessionForm({ ...sessionForm, company_id: value })}
                              required
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
                            <Label htmlFor="session-location">Location *</Label>
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
                              <Label htmlFor="start-date">Start Date *</Label>
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
                              <Label htmlFor="end-date">End Date *</Label>
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
                        </div>

                        {/* Add Participants */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold text-lg">Add Participants</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="participant-name">Full Name</Label>
                              <Input
                                id="participant-name"
                                data-testid="participant-name-input"
                                value={newParticipant.full_name}
                                onChange={(e) => setNewParticipant({ ...newParticipant, full_name: e.target.value })}
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="participant-id">ID Number</Label>
                              <Input
                                id="participant-id"
                                data-testid="participant-id-input"
                                value={newParticipant.id_number}
                                onChange={(e) => setNewParticipant({ ...newParticipant, id_number: e.target.value })}
                                placeholder="ID123456"
                              />
                            </div>
                            <div>
                              <Label htmlFor="participant-email">Email</Label>
                              <Input
                                id="participant-email"
                                data-testid="participant-email-input"
                                type="email"
                                value={newParticipant.email}
                                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                                placeholder="john@example.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="participant-password">Password</Label>
                              <Input
                                id="participant-password"
                                data-testid="participant-password-input"
                                type="password"
                                value={newParticipant.password}
                                onChange={(e) => setNewParticipant({ ...newParticipant, password: e.target.value })}
                                placeholder="Password"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            data-testid="add-participant-button"
                            onClick={handleAddParticipant}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Participant to List
                          </Button>
                        </div>

                        {/* Participants List */}
                        {sessionForm.participants.length > 0 && (
                          <div className="space-y-2 border-t pt-4">
                            <h3 className="font-semibold text-sm text-gray-700">
                              Participants ({sessionForm.participants.length})
                            </h3>
                            {sessionForm.participants.map((participant, index) => (
                              <div
                                key={index}
                                data-testid={`participant-list-item-${index}`}
                                className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-sm">{participant.full_name}</p>
                                  <p className="text-xs text-gray-600">
                                    {participant.email} • ID: {participant.id_number}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  data-testid={`remove-participant-${index}`}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveParticipant(index)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          data-testid="submit-session-button"
                          type="submit"
                          className="w-full"
                          disabled={sessionForm.participants.length === 0}
                        >
                          Create Session with {sessionForm.participants.length} Participant(s)
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {programs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Please create at least one program first</p>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Please create at least one company first</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No sessions yet</p>
                    ) : (
                      sessions.map((session) => {
                        const company = companies.find((c) => c.id === session.company_id);
                        const program = programs.find((p) => p.id === session.program_id);
                        return (
                          <div
                            key={session.id}
                            data-testid={`session-item-${session.id}`}
                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">{session.name}</h3>
                                <div className="mt-2 text-sm text-gray-600 space-y-1">
                                  <p>Program: {program?.name || "N/A"}</p>
                                  <p>Company: {company?.name || "N/A"}</p>
                                  <p>Location: {session.location}</p>
                                  <p>
                                    Duration: {session.start_date} to {session.end_date}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {session.participant_ids.length} Participants
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View all system users</CardDescription>
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
