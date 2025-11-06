import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Calendar, ClipboardCheck, Users, FileText, ChevronDown, ChevronRight } from "lucide-react";

const TrainerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionParticipants, setSessionParticipants] = useState({});

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/sessions");
      // Filter sessions where user is assigned as trainer
      const mySessions = response.data.filter(session => 
        session.trainer_assignments && session.trainer_assignments.some(t => t.trainer_id === user.id)
      );
      setSessions(mySessions);
      
      // Load participants for each session
      for (const session of mySessions) {
        loadSessionParticipants(session.id);
      }
    } catch (error) {
      toast.error("Failed to load sessions");
    }
  };

  const loadSessionParticipants = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/sessions/${sessionId}`);
      const session = response.data;
      
      // Get participant details
      if (session.participant_ids && session.participant_ids.length > 0) {
        const participantsPromises = session.participant_ids.map(pid =>
          axiosInstance.get(`/users/${pid}`).catch(() => null)
        );
        const participantsResponses = await Promise.all(participantsPromises);
        const participants = participantsResponses
          .filter(r => r !== null)
          .map(r => r.data);
        
        setSessionParticipants(prev => ({
          ...prev,
          [sessionId]: participants
        }));
      }
    } catch (error) {
      console.error("Failed to load participants for session", sessionId);
    }
  };

  const getMyRole = (session) => {
    if (!session.trainer_assignments) return "Trainer";
    const assignment = session.trainer_assignments.find(t => t.trainer_id === user.id);
    return assignment ? (assignment.role === "chief" ? "Chief Trainer" : "Regular Trainer") : "Trainer";
  };

  const isChiefTrainer = (session) => {
    if (!session.trainer_assignments) return false;
    const assignment = session.trainer_assignments.find(t => t.trainer_id === user.id);
    return assignment && assignment.role === "chief";
  };

  const handleViewResults = (sessionId) => {
    navigate(`/results-summary/${sessionId}`);
  };

  const toggleSessionExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trainer Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button
            data-testid="trainer-logout-button"
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
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="sessions" data-testid="sessions-tab">
              <Calendar className="w-4 h-4 mr-2" />
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="checklists" data-testid="checklists-tab">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Checklists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Training Sessions</CardTitle>
                <CardDescription>Sessions you are assigned to as trainer</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No sessions assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      const isExpanded = expandedSession === session.id;
                      const participants = sessionParticipants[session.id] || [];
                      const isChief = isChiefTrainer(session);

                      return (
                        <Card key={session.id} className="border-2">
                          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleSessionExpand(session.id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-5 h-5 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-600" />
                                    )}
                                  </button>
                                  <div>
                                    <CardTitle className="text-xl">{session.name}</CardTitle>
                                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                                      <p>Location: {session.location}</p>
                                      <p>Duration: {session.start_date} to {session.end_date}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isChief 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {getMyRole(session)}
                                </span>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span>{participants.length} Participants</span>
                                </div>
                                {isChief && (
                                  <Button
                                    onClick={() => handleViewResults(session.id)}
                                    size="sm"
                                    variant="outline"
                                    data-testid={`view-results-${session.id}`}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Results
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          {isExpanded && participants.length > 0 && (
                            <CardContent className="pt-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Participants</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {participants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="p-3 bg-gray-50 rounded-lg border"
                                  >
                                    <p className="font-medium text-gray-900">{participant.full_name}</p>
                                    <p className="text-sm text-gray-600">{participant.email}</p>
                                    {participant.id_number && (
                                      <p className="text-xs text-gray-500 mt-1">ID: {participant.id_number}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklists">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Checklists</CardTitle>
                <CardDescription>
                  Complete vehicle inspection checklists for your assigned participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No sessions assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      const participants = sessionParticipants[session.id] || [];
                      const isChief = isChiefTrainer(session);
                      
                      return (
                        <Card key={session.id} className="border-l-4 border-l-orange-500">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{session.name}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">{session.location}</p>
                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                                  isChief ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {getMyRole(session)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <Users className="w-4 h-4 inline mr-1" />
                                {participants.length} Participants
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {participants.length === 0 ? (
                              <p className="text-gray-500 text-center py-4">No participants assigned</p>
                            ) : (
                              <div className="space-y-2">
                                {participants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 flex justify-between items-center"
                                  >
                                    <div>
                                      <p className="font-semibold text-gray-900">{participant.full_name}</p>
                                      <p className="text-sm text-gray-600">{participant.email}</p>
                                    </div>
                                    <Button
                                      onClick={() => navigate(`/trainer-checklist/${session.id}/${participant.id}`)}
                                      size="sm"
                                      className="bg-orange-600 hover:bg-orange-700"
                                    >
                                      <ClipboardCheck className="w-4 h-4 mr-2" />
                                      Complete Checklist
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TrainerDashboard;
