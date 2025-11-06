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
import { LogOut, Building2, Users, Calendar, MessageSquare, BookOpen, Plus, Trash2, Edit, UserPlus, UserCog, ClipboardList } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const AdminDashboard = ({ user, onLogout }) => {
  const [companies, setCompanies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const [programForm, setProgramForm] = useState({ name: "", description: "", pass_percentage: 70 });
  const [programDialogOpen, setProgramDialogOpen] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    program_id: "",
    company_id: "",
    location: "",
    start_date: "",
    end_date: "",
    participants: [],
    trainer_assignments: [],
    coordinator_id: "",
  });
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
  });
  const [newTrainerAssignment, setNewTrainerAssignment] = useState({
    trainer_id: "",
    role: "regular",
  });
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionDialogOpen, setEditSessionDialogOpen] = useState(false);

  const [trainerForm, setTrainerForm] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
  });
  const [trainerDialogOpen, setTrainerDialogOpen] = useState(false);

  const [coordinatorForm, setCoordinatorForm] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
  });
  const [coordinatorDialogOpen, setCoordinatorDialogOpen] = useState(false);

  // Edit states
  const [editingProgram, setEditingProgram] = useState(null);
  const [editProgramDialogOpen, setEditProgramDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompanyDialogOpen, setEditCompanyDialogOpen] = useState(false);
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      setProgramForm({ name: "", description: "", pass_percentage: 70 });
      setProgramDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create program");
    }
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/register", {
        ...trainerForm,
        role: "trainer",
      });
      toast.success("Trainer created successfully");
      setTrainerForm({ email: "", password: "", full_name: "", id_number: "" });
      setTrainerDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create trainer");
    }
  };

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/register", {
        ...coordinatorForm,
        role: "coordinator",
      });
      toast.success("Coordinator created successfully");
      setCoordinatorForm({ email: "", password: "", full_name: "", id_number: "" });
      setCoordinatorDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create coordinator");
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
    setNewParticipant({ email: "", password: "", full_name: "", id_number: "" });
    toast.success("Participant added to list");
  };

  const handleRemoveParticipant = (index) => {
    const updated = sessionForm.participants.filter((_, i) => i !== index);
    setSessionForm({ ...sessionForm, participants: updated });
  };

  const handleAddTrainerAssignment = () => {
    if (!newTrainerAssignment.trainer_id) {
      toast.error("Please select a trainer");
      return;
    }
    // Check if trainer already assigned
    if (sessionForm.trainer_assignments.some(t => t.trainer_id === newTrainerAssignment.trainer_id)) {
      toast.error("Trainer already assigned to this session");
      return;
    }
    setSessionForm({
      ...sessionForm,
      trainer_assignments: [...sessionForm.trainer_assignments, { ...newTrainerAssignment }],
    });
    setNewTrainerAssignment({ trainer_id: "", role: "regular" });
    toast.success("Trainer assigned");
  };

  const handleRemoveTrainerAssignment = (index) => {
    const updated = sessionForm.trainer_assignments.filter((_, i) => i !== index);
    setSessionForm({ ...sessionForm, trainer_assignments: updated });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (sessionForm.participants.length === 0) {
      toast.error("Please add at least one participant");
      return;
    }

    try {
      const program = programs.find(p => p.id === sessionForm.program_id);
      if (!program) {
        toast.error("Please select a program");
        return;
      }

      const participantIds = [];
      for (const participant of sessionForm.participants) {
        try {
          const response = await axiosInstance.post("/auth/register", {
            ...participant,
            role: "participant",
            company_id: sessionForm.company_id,
            location: sessionForm.location,
          });
          participantIds.push(response.data.id);
        } catch (error) {
          toast.error(`Failed to create participant ${participant.full_name}: ${error.response?.data?.detail || 'Unknown error'}`);
          return;
        }
      }

      await axiosInstance.post("/sessions", {
        name: program.name,
        program_id: sessionForm.program_id,
        company_id: sessionForm.company_id,
        location: sessionForm.location,
        start_date: sessionForm.start_date,
        end_date: sessionForm.end_date,
        participant_ids: participantIds,
        trainer_assignments: sessionForm.trainer_assignments,
        coordinator_id: sessionForm.coordinator_id || null,
      });

      toast.success(`Session created with ${participantIds.length} participants`);
      setSessionForm({
        program_id: "",
        company_id: "",
        location: "",
        start_date: "",
        end_date: "",
        participants: [],
        trainer_assignments: [],
        coordinator_id: "",
      });
      setSessionDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create session");
    }
  };

  const handleEditSession = (session) => {
    setEditingSession({
      ...session,
      newParticipants: [],
    });
    setEditSessionDialogOpen(true);
  };

  const handleAddParticipantToEdit = () => {
    if (!newParticipant.email || !newParticipant.password || !newParticipant.full_name || !newParticipant.id_number) {
      toast.error("Please fill all participant fields");
      return;
    }
    setEditingSession({
      ...editingSession,
      newParticipants: [...(editingSession.newParticipants || []), { ...newParticipant }],
    });
    setNewParticipant({ email: "", password: "", full_name: "", id_number: "" });
  };

  const handleRemoveNewParticipant = (index) => {
    const updated = editingSession.newParticipants.filter((_, i) => i !== index);
    setEditingSession({ ...editingSession, newParticipants: updated });
  };

  const handleUpdateSession = async () => {
    try {
      // Create new participants if any
      const newParticipantIds = [];
      if (editingSession.newParticipants && editingSession.newParticipants.length > 0) {
        for (const participant of editingSession.newParticipants) {
          const response = await axiosInstance.post("/auth/register", {
            ...participant,
            role: "participant",
            company_id: editingSession.company_id,
            location: editingSession.location,
          });
          newParticipantIds.push(response.data.id);
        }
      }

      // Update session
      await axiosInstance.put(`/sessions/${editingSession.id}`, {
        location: editingSession.location,
        start_date: editingSession.start_date,
        end_date: editingSession.end_date,
        participant_ids: [...editingSession.participant_ids, ...newParticipantIds],
        trainer_assignments: editingSession.trainer_assignments || [],
        coordinator_id: editingSession.coordinator_id || null,
      });

      toast.success("Session updated successfully");
      setEditSessionDialogOpen(false);
      setEditingSession(null);
      setNewParticipant({ email: "", password: "", full_name: "", id_number: "" });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update session");
    }
  };

  const trainers = users.filter((u) => u.role === "trainer");
  const coordinators = users.filter((u) => u.role === "coordinator");

  const getTrainerName = (trainerId) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? trainer.full_name : "Unknown";
  };

  const getCoordinatorName = (coordinatorId) => {
    const coordinator = coordinators.find(c => c.id === coordinatorId);
    return coordinator ? coordinator.full_name : "Unknown";
  };

  // Edit/Delete handlers
  const handleEditProgram = (program) => {
    setEditingProgram({ ...program });
    setEditProgramDialogOpen(true);
  };

  const handleUpdateProgram = async () => {
    try {
      await axiosInstance.put(`/programs/${editingProgram.id}`, {
        name: editingProgram.name,
        description: editingProgram.description,
        pass_percentage: editingProgram.pass_percentage,
      });
      toast.success("Program updated successfully");
      setEditProgramDialogOpen(false);
      setEditingProgram(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update program");
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany({ ...company });
    setEditCompanyDialogOpen(true);
  };

  const handleUpdateCompany = async () => {
    try {
      await axiosInstance.put(`/companies/${editingCompany.id}`, {
        name: editingCompany.name,
      });
      toast.success("Company updated successfully");
      setEditCompanyDialogOpen(false);
      setEditingCompany(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update company");
    }
  };

  const handleDeleteClick = (type, item) => {
    setDeleteTarget({ type, item });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      const { type, item } = deleteTarget;
      
      if (type === "program") {
        await axiosInstance.delete(`/programs/${item.id}`);
        toast.success("Program deleted successfully");
      } else if (type === "company") {
        await axiosInstance.delete(`/companies/${item.id}`);
        toast.success("Company deleted successfully");
      } else if (type === "trainer" || type === "coordinator" || type === "user") {
        await axiosInstance.delete(`/users/${item.id}`);
        toast.success(`${type} deleted successfully`);
      }
      
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete item");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="programs" data-testid="programs-tab">
              <BookOpen className="w-4 h-4 mr-2" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tests-tab">
              <ClipboardList className="w-4 h-4 mr-2" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="companies" data-testid="companies-tab">
              <Building2 className="w-4 h-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="sessions-tab">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="trainers" data-testid="trainers-tab">
              <UserPlus className="w-4 h-4 mr-2" />
              Trainers
            </TabsTrigger>
            <TabsTrigger value="coordinators" data-testid="coordinators-tab">
              <UserCog className="w-4 h-4 mr-2" />
              Coordinators
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              All Users
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
                        <div>
                          <Label htmlFor="pass-percentage">Pass Percentage (%)</Label>
                          <Input
                            id="pass-percentage"
                            data-testid="pass-percentage-input"
                            type="number"
                            min="0"
                            max="100"
                            value={programForm.pass_percentage}
                            onChange={(e) => setProgramForm({ ...programForm, pass_percentage: parseFloat(e.target.value) })}
                            required
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
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{program.name}</h3>
                            {program.description && (
                              <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                            )}
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Pass Mark: {program.pass_percentage}%
                              </span>
                              <span className="text-xs text-gray-500">
                                Created: {new Date(program.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              data-testid={`edit-program-${program.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProgram(program)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              data-testid={`delete-program-${program.id}`}
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick("program", program)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                            <Button
                              data-testid={`manage-tests-${program.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveTab("tests");
                                setSelectedProgram(program);
                              }}
                            >
                              <ClipboardList className="w-4 h-4 mr-1" />
                              Tests
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Test Management</CardTitle>
                    <CardDescription>
                      {selectedProgram 
                        ? `Manage pre and post tests for "${selectedProgram.name}"` 
                        : "Select a program to manage its tests"}
                    </CardDescription>
                  </div>
                  {selectedProgram && (
                    <Button
                      onClick={() => {
                        setActiveTab("programs");
                        setSelectedProgram(null);
                      }}
                      variant="outline"
                    >
                      Back to Programs
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedProgram ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Please select a program from the Programs tab to manage its tests.</p>
                    <Button
                      className="mt-4"
                      onClick={() => setActiveTab("programs")}
                      variant="outline"
                    >
                      Go to Programs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900">Selected Program: {selectedProgram.name}</h3>
                      {selectedProgram.description && (
                        <p className="text-blue-700 text-sm mt-1">{selectedProgram.description}</p>
                      )}
                      <p className="text-blue-600 text-sm mt-1">Pass Mark: {selectedProgram.pass_percentage}%</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pre-Test Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Pre-Test Questions</CardTitle>
                          <CardDescription>Questions given before training starts</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center py-8 text-gray-500">
                              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>No pre-test questions yet</p>
                              <Button className="mt-3" size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Pre-Test Question
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Post-Test Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Post-Test Questions</CardTitle>
                          <CardDescription>Questions given after training completion</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center py-8 text-gray-500">
                              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>No post-test questions yet</p>
                              <Button className="mt-3" size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Post-Test Question
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Coming Soon</h4>
                      <p className="text-yellow-700 text-sm">
                        Full test management functionality including question creation, editing, 
                        multiple choice options, and test scheduling will be available in the next update.
                      </p>
                    </div>
                  </div>
                )}
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
                        <div className="flex gap-2">
                          <Button
                            data-testid={`edit-company-${company.id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCompany(company)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            data-testid={`delete-company-${company.id}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick("company", company)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
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
                    <CardDescription>Create and manage sessions</CardDescription>
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
                          Configure session details, participants, and trainers
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

                        {/* Assign Trainers */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold text-lg">Assign Trainers</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Select Trainer</Label>
                              <Select
                                value={newTrainerAssignment.trainer_id}
                                onValueChange={(value) => setNewTrainerAssignment({ ...newTrainerAssignment, trainer_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select trainer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {trainers.map((trainer) => (
                                    <SelectItem key={trainer.id} value={trainer.id}>
                                      {trainer.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Role for This Session</Label>
                              <Select
                                value={newTrainerAssignment.role}
                                onValueChange={(value) => setNewTrainerAssignment({ ...newTrainerAssignment, role: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="regular">Regular Trainer</SelectItem>
                                  <SelectItem value="chief">Chief Trainer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddTrainerAssignment}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Assign Trainer
                          </Button>
                          {sessionForm.trainer_assignments.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-700">Assigned Trainers</Label>
                              {sessionForm.trainer_assignments.map((assignment, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                  <span className="text-sm">
                                    {getTrainerName(assignment.trainer_id)} - <strong>{assignment.role === "chief" ? "Chief Trainer" : "Regular Trainer"}</strong>
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTrainerAssignment(idx)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assign Coordinator */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold text-lg">Assign Coordinator (Optional)</h3>
                          <Select
                            value={sessionForm.coordinator_id}
                            onValueChange={(value) => setSessionForm({ ...sessionForm, coordinator_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select coordinator" />
                            </SelectTrigger>
                            <SelectContent>
                              {coordinators.map((coordinator) => (
                                <SelectItem key={coordinator.id} value={coordinator.id}>
                                  {coordinator.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                  <p>Duration: {session.start_date} to {session.end_date}</p>
                                  {session.trainer_assignments && session.trainer_assignments.length > 0 && (
                                    <p>Trainers: {session.trainer_assignments.map(t => `${getTrainerName(t.trainer_id)} (${t.role})`).join(", ")}</p>
                                  )}
                                  {session.coordinator_id && (
                                    <p>Coordinator: {getCoordinatorName(session.coordinator_id)}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {session.participant_ids.length} Participants
                                </span>
                                <Button
                                  data-testid={`edit-session-${session.id}`}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSession(session)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
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

          {/* Trainers Tab */}
          <TabsContent value="trainers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Trainers</CardTitle>
                    <CardDescription>Create trainer accounts (roles assigned per session)</CardDescription>
                  </div>
                  <Dialog open={trainerDialogOpen} onOpenChange={setTrainerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-trainer-button">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Trainer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Trainer</DialogTitle>
                        <DialogDescription>
                          Add a trainer account
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateTrainer} className="space-y-4">
                        <div>
                          <Label htmlFor="trainer-name">Full Name *</Label>
                          <Input
                            id="trainer-name"
                            data-testid="trainer-name-input"
                            value={trainerForm.full_name}
                            onChange={(e) => setTrainerForm({ ...trainerForm, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="trainer-id">ID Number *</Label>
                          <Input
                            id="trainer-id"
                            data-testid="trainer-id-input"
                            value={trainerForm.id_number}
                            onChange={(e) => setTrainerForm({ ...trainerForm, id_number: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="trainer-email">Email *</Label>
                          <Input
                            id="trainer-email"
                            data-testid="trainer-email-input"
                            type="email"
                            value={trainerForm.email}
                            onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="trainer-password">Password *</Label>
                          <Input
                            id="trainer-password"
                            data-testid="trainer-password-input"
                            type="password"
                            value={trainerForm.password}
                            onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                            required
                          />
                        </div>
                        <Button data-testid="submit-trainer-button" type="submit" className="w-full">
                          Create Trainer
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trainers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No trainers yet</p>
                  ) : (
                    trainers.map((trainer) => (
                      <div
                        key={trainer.id}
                        data-testid={`trainer-item-${trainer.id}`}
                        className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:bg-orange-100 transition-colors flex justify-between items-start"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{trainer.full_name}</h3>
                          <p className="text-sm text-gray-600">{trainer.email}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              Trainer
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              ID: {trainer.id_number}
                            </span>
                          </div>
                        </div>
                        <Button
                          data-testid={`delete-trainer-${trainer.id}`}
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick("trainer", trainer)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coordinators Tab */}
          <TabsContent value="coordinators">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Coordinators</CardTitle>
                    <CardDescription>Manage training coordinators</CardDescription>
                  </div>
                  <Dialog open={coordinatorDialogOpen} onOpenChange={setCoordinatorDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-coordinator-button">
                        <UserCog className="w-4 h-4 mr-2" />
                        Add Coordinator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Coordinator</DialogTitle>
                        <DialogDescription>
                          Add a coordinator account
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCoordinator} className="space-y-4">
                        <div>
                          <Label htmlFor="coordinator-name">Full Name *</Label>
                          <Input
                            id="coordinator-name"
                            data-testid="coordinator-name-input"
                            value={coordinatorForm.full_name}
                            onChange={(e) => setCoordinatorForm({ ...coordinatorForm, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="coordinator-id">ID Number *</Label>
                          <Input
                            id="coordinator-id"
                            data-testid="coordinator-id-input"
                            value={coordinatorForm.id_number}
                            onChange={(e) => setCoordinatorForm({ ...coordinatorForm, id_number: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="coordinator-email">Email *</Label>
                          <Input
                            id="coordinator-email"
                            data-testid="coordinator-email-input"
                            type="email"
                            value={coordinatorForm.email}
                            onChange={(e) => setCoordinatorForm({ ...coordinatorForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="coordinator-password">Password *</Label>
                          <Input
                            id="coordinator-password"
                            data-testid="coordinator-password-input"
                            type="password"
                            value={coordinatorForm.password}
                            onChange={(e) => setCoordinatorForm({ ...coordinatorForm, password: e.target.value })}
                            required
                          />
                        </div>
                        <Button data-testid="submit-coordinator-button" type="submit" className="w-full">
                          Create Coordinator
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coordinators.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No coordinators yet</p>
                  ) : (
                    coordinators.map((coordinator) => (
                      <div
                        key={coordinator.id}
                        data-testid={`coordinator-item-${coordinator.id}`}
                        className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:bg-purple-100 transition-colors flex justify-between items-start"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{coordinator.full_name}</h3>
                          <p className="text-sm text-gray-600">{coordinator.email}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Coordinator
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              ID: {coordinator.id_number}
                            </span>
                          </div>
                        </div>
                        <Button
                          data-testid={`delete-coordinator-${coordinator.id}`}
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick("coordinator", coordinator)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View all system users grouped by company</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users yet</p>
                ) : (
                  <div className="space-y-6">
                    {/* Admin, Trainers, Coordinators (No Company) */}
                    {users.filter(u => !u.company_id).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">System Users (No Company)</h3>
                        <div className="space-y-2">
                          {users.filter(u => !u.company_id).map((u) => (
                            <div
                              key={u.id}
                              data-testid={`user-item-${u.id}`}
                              className="p-4 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors"
                            >
                              <div>
                                <h3 className="font-semibold text-gray-900">{u.full_name}</h3>
                                <p className="text-sm text-gray-600">{u.email}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                                    {u.role.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    ID: {u.id_number}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users Grouped by Company */}
                    {companies.map((company) => {
                      const companyUsers = users.filter(u => u.company_id === company.id);
                      if (companyUsers.length === 0) return null;
                      
                      return (
                        <div key={company.id}>
                          <h3 className="text-lg font-semibold mb-3 text-gray-700">{company.name} ({companyUsers.length} users)</h3>
                          <div className="space-y-2">
                            {companyUsers.map((u) => (
                              <div
                                key={u.id}
                                data-testid={`user-item-${u.id}`}
                                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow"
                              >
                                <div>
                                  <h3 className="font-semibold text-gray-900">{u.full_name}</h3>
                                  <p className="text-sm text-gray-600">{u.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                                      {u.role.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                      ID: {u.id_number}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Session Dialog */}
      {editingSession && (
        <Dialog open={editSessionDialogOpen} onOpenChange={setEditSessionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update session details and add participants
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={editingSession.location}
                  onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editingSession.start_date}
                    onChange={(e) => setEditingSession({ ...editingSession, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={editingSession.end_date}
                    onChange={(e) => setEditingSession({ ...editingSession, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Add More Participants</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-participant-name">Full Name</Label>
                    <Input
                      id="edit-participant-name"
                      value={newParticipant.full_name}
                      onChange={(e) => setNewParticipant({ ...newParticipant, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-participant-id">ID Number</Label>
                    <Input
                      id="edit-participant-id"
                      value={newParticipant.id_number}
                      onChange={(e) => setNewParticipant({ ...newParticipant, id_number: e.target.value })}
                      placeholder="ID123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-participant-email">Email</Label>
                    <Input
                      id="edit-participant-email"
                      type="email"
                      value={newParticipant.email}
                      onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-participant-password">Password</Label>
                    <Input
                      id="edit-participant-password"
                      type="password"
                      value={newParticipant.password}
                      onChange={(e) => setNewParticipant({ ...newParticipant, password: e.target.value })}
                      placeholder="Password"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddParticipantToEdit}
                  variant="outline"
                  className="w-full mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Participant
                </Button>

                {editingSession.newParticipants && editingSession.newParticipants.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm">New Participants to Add ({editingSession.newParticipants.length})</Label>
                    {editingSession.newParticipants.map((participant, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{participant.full_name}</p>
                          <p className="text-xs text-gray-600">{participant.email} • ID: {participant.id_number}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewParticipant(idx)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Current Participants: {editingSession.participant_ids.length}
                </p>
              </div>

              <Button onClick={handleUpdateSession} className="w-full">
                Update Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDashboard;
