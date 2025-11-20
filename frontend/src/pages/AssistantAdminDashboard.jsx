import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { Plus, Users, LogOut, Calendar, BookOpen, ClipboardList, ClipboardCheck, MessageSquare } from "lucide-react";
import TestManagement from "./TestManagement";
import ChecklistManagement from "./ChecklistManagement";
import FeedbackManagement from "./FeedbackManagement";

const AssistantAdminDashboard = ({ user, onLogout }) => {
  const { primaryColor, secondaryColor, companyName, logoUrl } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [participantForm, setParticipantForm] = useState({
    full_name: "",
    id_number: "",
    company_id: ""
  });

  useEffect(() => {
    loadSessions();
    loadCompanies();
    loadPrograms();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/sessions");
      setSessions(response.data);
    } catch (error) {
      toast.error("Failed to load sessions");
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await axiosInstance.get("/companies");
      setCompanies(response.data);
    } catch (error) {
      toast.error("Failed to load companies");
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await axiosInstance.get("/programs");
      setPrograms(response.data);
    } catch (error) {
      toast.error("Failed to load programs");
    }
  };

  const loadParticipants = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/sessions/${sessionId}/participants`);
      setParticipants(response.data);
    } catch (error) {
      toast.error("Failed to load participants");
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    loadParticipants(session.id);
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();

    if (!participantForm.full_name || !participantForm.id_number || !participantForm.company_id) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // Register participant with default credentials (email optional - auto-generated)
      await axiosInstance.post("/auth/register", {
        full_name: participantForm.full_name,
        id_number: participantForm.id_number,
        // email: not required - will be auto-generated as IC@mddrc.com
        // password: not required - defaults to mddrc1
        role: "participant",
        company_id: participantForm.company_id,
        location: ""
      });

      // Add to session
      await axiosInstance.post(`/sessions/${selectedSession.id}/participants`, {
        participant_ids: [participantForm.id_number] // Using IC as identifier
      });

      toast.success("Participant added successfully! Login: IC number, Password: mddrc1");
      
      setParticipantForm({ full_name: "", id_number: "", company_id: "" });
      setAddDialogOpen(false);
      loadParticipants(selectedSession.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add participant");
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor}10, ${secondaryColor}10, ${primaryColor}05)`
      }}
    >
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={companyName}
                  className="h-10 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assistant Admin Portal</h1>
                <p className="text-sm text-gray-600">Add participants to training sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.full_name}</span>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sessions List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Training Sessions
              </CardTitle>
              <CardDescription>Select a session to add participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No sessions available</p>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSession?.id === session.id
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="font-medium text-sm">{session.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.start_date} - {session.end_date}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Participants
                  </CardTitle>
                  <CardDescription>
                    {selectedSession ? `Session: ${selectedSession.name}` : "Select a session to view participants"}
                  </CardDescription>
                </div>
                {selectedSession && (
                  <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Participant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Participant</DialogTitle>
                        <DialogDescription>
                          Enter participant details. Login will be auto-created with IC as username and 'mddrc1' as password.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddParticipant} className="space-y-4">
                        <div>
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={participantForm.full_name}
                            onChange={(e) => setParticipantForm({ ...participantForm, full_name: e.target.value })}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="id_number">IC Number *</Label>
                          <Input
                            id="id_number"
                            value={participantForm.id_number}
                            onChange={(e) => setParticipantForm({ ...participantForm, id_number: e.target.value })}
                            placeholder="990101-01-1234"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">This will be used as login username</p>
                        </div>
                        <div>
                          <Label htmlFor="company_id">Company *</Label>
                          <Select
                            value={participantForm.company_id}
                            onValueChange={(value) => setParticipantForm({ ...participantForm, company_id: value })}
                          >
                            <SelectTrigger>
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
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Default Login Credentials:</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Username: <span className="font-mono">{participantForm.id_number || "[IC Number]"}</span>
                          </p>
                          <p className="text-sm text-blue-700">
                            Password: <span className="font-mono">mddrc1</span>
                          </p>
                        </div>
                        <Button type="submit" className="w-full">Add Participant</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedSession ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Select a session to manage participants</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No participants added yet</p>
                  <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Participant
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant, idx) => (
                    <div
                      key={participant.id}
                      className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700 bg-white px-3 py-1 rounded">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{participant.full_name}</p>
                          <p className="text-sm text-gray-600">IC: {participant.id_number}</p>
                          <p className="text-xs text-gray-500">Login: {participant.id_number} / mddrc1</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Program Content Management Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Program Content Management
              </CardTitle>
              <CardDescription>
                Manage tests, checklists, and feedback forms for training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No programs available. Ask an admin to create training programs first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {programs.map((program) => (
                    <div key={program.id}>
                      <Card className="border-2 border-blue-200">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{program.name}</CardTitle>
                              {program.description && (
                                <CardDescription>{program.description}</CardDescription>
                              )}
                              <div className="flex gap-3 mt-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Pass Mark: {program.pass_percentage}%
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProgram(selectedProgram?.id === program.id ? null : program)}
                            >
                              <ClipboardList className="w-4 h-4 mr-2" />
                              {selectedProgram?.id === program.id ? 'Hide' : 'Manage Content'}
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Expandable Content Management Section */}
                      {selectedProgram?.id === program.id && (
                        <Card className="mt-2 border-l-4 border-blue-500">
                          <CardContent className="pt-6">
                            <Tabs defaultValue="tests" className="w-full">
                              <TabsList className="flex flex-wrap w-full grid-cols-3 mb-4 h-auto justify-start gap-2 bg-gray-100 p-2 rounded-lg sm:grid sm:grid-cols-3">
                                <TabsTrigger value="tests" className="flex-1 min-w-[100px] sm:min-w-0">
                                  <ClipboardList className="w-4 h-4 mr-2" />
                                  Tests
                                </TabsTrigger>
                                <TabsTrigger value="checklists" className="flex-1 min-w-[100px] sm:min-w-0">
                                  <ClipboardCheck className="w-4 h-4 mr-2" />
                                  Checklists
                                </TabsTrigger>
                                <TabsTrigger value="feedback" className="flex-1 min-w-[100px] sm:min-w-0">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Feedback
                                </TabsTrigger>
                              </TabsList>

                              {/* Tests Tab */}
                              <TabsContent value="tests">
                                <div className="mb-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedProgram(null)}
                                  >
                                    ← Back to Programs
                                  </Button>
                                </div>
                                <TestManagement program={program} />
                              </TabsContent>

                              {/* Checklists Tab */}
                              <TabsContent value="checklists">
                                <div className="mb-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedProgram(null)}
                                  >
                                    ← Back to Programs
                                  </Button>
                                </div>
                                <ChecklistManagement program={program} />
                              </TabsContent>

                              {/* Feedback Tab */}
                              <TabsContent value="feedback">
                                <div className="mb-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedProgram(null)}
                                  >
                                    ← Back to Programs
                                  </Button>
                                </div>
                                <FeedbackManagement program={program} />
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssistantAdminDashboard;
