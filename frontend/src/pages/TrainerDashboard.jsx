import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Calendar, ClipboardCheck, Users, FileText, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";

const TrainerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionParticipants, setSessionParticipants] = useState({});

  const [feedbackTemplate, setFeedbackTemplate] = useState(null);
  const [selectedFeedbackSession, setSelectedFeedbackSession] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);


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
      
      // Filter out old sessions (only exclude sessions ended more than 30 days ago)
      // Trainers need to see recent past sessions to complete checklists
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const relevantSessions = mySessions.filter(session => {
        if (!session.end_date) return true; // Include if no end date
        const endDate = new Date(session.end_date);
        return endDate >= thirtyDaysAgo; // Include if ended within last 30 days
      });
      
      setSessions(relevantSessions);
      
      // Load participants for each session
      for (const session of relevantSessions) {
        loadSessionParticipants(session.id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions: " + (error.response?.data?.detail || error.message));
    }
  };

  const loadSessionParticipants = async (sessionId) => {
    try {
      // Get assigned participants for this trainer
      const response = await axiosInstance.get(`/trainer-checklist/${sessionId}/assigned-participants`);
      const participants = response.data;
      
      setSessionParticipants(prev => ({
        ...prev,
        [sessionId]: participants
      }));
    } catch (error) {
      console.error("Failed to load assigned participants for session", sessionId, error);
      // Set empty array if no participants assigned
      setSessionParticipants(prev => ({
        ...prev,
        [sessionId]: []
      }));
    }
  };

  const getMyRole = (session) => {
    if (!session.trainer_assignments) return "Trainer";
    const assignment = session.trainer_assignments.find(t => t.trainer_id === user.id);
    return assignment ? (assignment.role === "chief" ? "Chief Trainer" : "Regular Trainer") : "Trainer";
  };

  // Check if user is chief trainer for any current session
  const isChiefTrainerForAnySessions = () => {
    return sessions.some(session => {
      if (!session.trainer_assignments) return false;
      const assignment = session.trainer_assignments.find(t => t.trainer_id === user.id);
      return assignment && assignment.role === "chief";
    });
  };

  // Get only sessions where user is chief trainer
  const getChiefTrainerSessions = () => {
    return sessions.filter(session => {
      if (!session.trainer_assignments) return false;
      const assignment = session.trainer_assignments.find(t => t.trainer_id === user.id);
      return assignment && assignment.role === "chief";
    });
  };


  const loadFeedbackTemplate = async () => {
    try {
      const response = await axiosInstance.get("/chief-trainer-feedback-template");
      setFeedbackTemplate(response.data);
    } catch (error) {
      console.error("Failed to load feedback template");
    }
  };

  const loadFeedback = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/chief-trainer-feedback/${sessionId}`);
      if (response.data && response.data.responses) {
        setFeedback(response.data.responses);
        setFeedbackSubmitted(true);
      } else {
        setFeedback({});
        setFeedbackSubmitted(false);
      }
    } catch (error) {
      setFeedback({});
      setFeedbackSubmitted(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeedbackSession) return;

    setSubmittingFeedback(true);
    try {
      await axiosInstance.post(`/chief-trainer-feedback/${selectedFeedbackSession.id}`, feedback);
      toast.success("Feedback submitted successfully!");
      setFeedbackSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    loadFeedbackTemplate();
  }, []);


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
          <TabsList className="flex flex-wrap w-full mb-8 h-auto justify-start gap-2 bg-gray-100 p-2 rounded-lg md:grid md:grid-cols-3">
            <TabsTrigger value="sessions" data-testid="sessions-tab" className="flex-1 min-w-[140px] md:min-w-0">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">My Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" data-testid="checklists-tab" className="flex-1 min-w-[140px] md:min-w-0">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              <span className="text-sm">Checklists</span>
            </TabsTrigger>
            {isChiefTrainerForAnySessions() && (
              <TabsTrigger value="feedback" data-testid="feedback-tab" className="flex-1 min-w-[140px] md:min-w-0">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="text-sm">Chief Trainer Feedback</span>
              </TabsTrigger>
            )}
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
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleSessionExpand(session.id)}
                                    className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-5 h-5 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-600" />
                                    )}
                                  </button>
                                  <div>
                                    <CardTitle className="text-lg sm:text-xl">{session.name}</CardTitle>
                                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                                      <p>Location: {session.location}</p>
                                      <p>Duration: {session.start_date} to {session.end_date}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 sm:items-end items-start">
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
                                {participants.map((participant) => {
                                  const isCompleted = participant.checklist && participant.checklist.verification_status === 'completed';
                                  
                                  return (
                                    <div
                                      key={participant.id}
                                      className={`p-3 rounded-lg border flex justify-between items-center ${
                                        isCompleted 
                                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                                          : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-gray-900">{participant.full_name}</p>
                                          {isCompleted && (
                                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                              ✓ Completed
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">{participant.email}</p>
                                      </div>
                                      <Button
                                        onClick={() => navigate(`/trainer-checklist/${session.id}/${participant.id}`)}
                                        size="sm"
                                        className={isCompleted 
                                          ? 'bg-green-600 hover:bg-green-700' 
                                          : 'bg-orange-600 hover:bg-orange-700'
                                        }
                                      >
                                        <ClipboardCheck className="w-4 h-4 mr-2" />
                                        {isCompleted ? 'View Checklist' : 'Complete Checklist'}
                                      </Button>
                                    </div>
                                  );
                                })}
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


          {/* Chief Trainer Feedback Tab - Only shown for chief trainers */}
          {isChiefTrainerForAnySessions() && (
          <TabsContent value="feedback">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Session for Feedback</CardTitle>
                <CardDescription>Choose a session to provide chief trainer feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedFeedbackSession?.id || ""}
                  onChange={(e) => {
                    const session = getChiefTrainerSessions().find(s => s.id === e.target.value);
                    if (session) {
                      setSelectedFeedbackSession(session);
                      loadFeedback(session.id);
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a session...</option>
                  {getChiefTrainerSessions().map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name} - {session.start_date ? new Date(session.start_date).toLocaleDateString() : 'Date TBD'}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {selectedFeedbackSession && feedbackTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chief Trainer Feedback
                  </CardTitle>
                  <CardDescription>
                    Session: {selectedFeedbackSession.name} | Role: {getMyRole(selectedFeedbackSession)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {feedbackTemplate.questions?.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {question.question}
                          {question.type === 'rating' && (
                            <span className="text-gray-500 ml-1">(Rate 1-{question.scale})</span>
                          )}
                        </label>
                        {question.type === 'rating' ? (
                          <div className="flex gap-2">
                            {[...Array(question.scale)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setFeedback({...feedback, [question.id]: i + 1})}
                                className={`w-10 h-10 rounded-full font-bold ${
                                  feedback[question.id] === i + 1
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                disabled={feedbackSubmitted}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            value={feedback[question.id] || ''}
                            onChange={(e) => setFeedback({...feedback, [question.id]: e.target.value})}
                            className="w-full p-3 border rounded-md"
                            rows={4}
                            disabled={feedbackSubmitted}
                            placeholder="Enter your response..."
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-6 pt-6 border-t">
                      {feedbackSubmitted ? (
                        <div className="flex items-center gap-2">
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                            ✓ Feedback Submitted
                          </span>
                          <Button
                            onClick={() => setFeedbackSubmitted(false)}
                            variant="outline"
                            size="sm"
                          >
                            Edit Feedback
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleSubmitFeedback}
                          disabled={submittingFeedback}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedFeedbackSession && (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a session above to provide feedback</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          )}

        </Tabs>
      </main>
    </div>
  );
};

export default TrainerDashboard;
