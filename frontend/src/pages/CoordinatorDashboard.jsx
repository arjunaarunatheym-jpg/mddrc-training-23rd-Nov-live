import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut, Calendar, Users, FileText, BarChart3, Camera, Upload, Sparkles, Save, Send, Edit, Trash2, Clock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const CoordinatorDashboard = ({ user, onLogout }) => {
  const { primaryColor } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Training Report states
  const [trainingReport, setTrainingReport] = useState({
    group_photo: "",
    theory_photo_1: "",
    theory_photo_2: "",
    practical_photo_1: "",
    practical_photo_2: "",
    practical_photo_3: "",
    additional_notes: "",
    status: "draft"
  });
  const [aiGeneratedReport, setAiGeneratedReport] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [editSessionDialogOpen, setEditSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [checklistIssues, setChecklistIssues] = useState([]);
  const [sessionAccess, setSessionAccess] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
    phone_number: ""
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/sessions');
      // Filter sessions where user is coordinator
      const coordinatorSessions = response.data.filter(s => s.coordinator_id === user.id);
      setSessions(coordinatorSessions);
      
      // Load stats for all sessions
      await loadAllSessionStats(coordinatorSessions);
      
      if (coordinatorSessions.length > 0) {
        selectSession(coordinatorSessions[0]);
      }
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load sessions");
      setLoading(false);
    }
  };

  const loadAllSessionStats = async (sessionsList) => {
    const stats = {};
    
    for (const session of sessionsList) {
      try {
        const [testResultsRes, feedbackRes] = await Promise.all([
          axiosInstance.get(`/tests/results/session/${session.id}`).catch(() => ({ data: [] })),
          axiosInstance.get(`/feedback/session/${session.id}`).catch(() => ({ data: [] }))
        ]);
        
        const testResults = testResultsRes.data || [];
        const feedbackResults = feedbackRes.data || [];
        
        const preTestResults = testResults.filter(r => r.test_type === 'pre');
        const postTestResults = testResults.filter(r => r.test_type === 'post');
        
        stats[session.id] = {
          participantCount: session.participant_ids?.length || 0,
          preTestCompleted: preTestResults.length,
          postTestCompleted: postTestResults.length,
          feedbackCompleted: feedbackResults.length
        };
      } catch (error) {
        console.error(`Failed to load stats for session ${session.id}`);
        stats[session.id] = {
          participantCount: session.participant_ids?.length || 0,
          preTestCompleted: 0,
          postTestCompleted: 0,
          feedbackCompleted: 0
        };
      }
    }
    
    setSessionStats(stats);
  };

  const selectSession = async (session) => {
    try {
      setSelectedSession(session);
      // Wait for data to load before proceeding
      await Promise.all([
        loadSessionData(session.id),
        loadTrainingReport(session.id)
      ]);
    } catch (error) {
      console.error("Error selecting session:", error);
      toast.error("Failed to load session data");
    }
  };

  const loadSessionData = async (sessionId) => {
    try {
      const session = sessions.find(s => s.id === sessionId) || selectedSession;
      
      if (!session) {
        console.error("Session not found");
        return;
      }
      
      const [usersRes, attendanceRes, testResultsRes] = await Promise.all([
        axiosInstance.get(`/users`).catch(err => ({ data: [] })),
        axiosInstance.get(`/attendance/session/${sessionId}`).catch(err => ({ data: [] })),
        axiosInstance.get(`/tests/results/session/${sessionId}`).catch(err => ({ data: [] }))
      ]);
      
      // Filter participants for THIS specific session
      const sessionParticipants = usersRes.data.filter(u => 
        session?.participant_ids && session.participant_ids.includes(u.id)
      );
      
      setParticipants(sessionParticipants);
      setAttendance(attendanceRes.data || []);
      setTestResults(testResultsRes.data || []);
      
      // Load session access controls
      await loadSessionAccess(sessionId);
      
      // Load checklist issues
      if (sessionParticipants.length > 0) {
        await loadChecklistIssues(sessionId, sessionParticipants);
      }
    } catch (error) {
      console.error("Failed to load session data", error);
      // Don't show error toast here, data might be empty initially
    }
  };

  const loadSessionAccess = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/participant-access/session/${sessionId}`);
      setSessionAccess(response.data);
    } catch (error) {
      console.error("Failed to load session access", error);
      setSessionAccess([]);
    }
  };

  const handleToggleAccess = async (accessType, enabled) => {
    if (!selectedSession) return;
    
    try {
      await axiosInstance.post(`/participant-access/session/${selectedSession.id}/toggle`, {
        access_type: accessType,
        enabled: enabled
      });
      
      toast.success(`${accessType} ${enabled ? 'enabled' : 'disabled'} for all participants`);
      await loadSessionAccess(selectedSession.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to update ${accessType} access`);
    }
  };

  const loadChecklistIssues = async (sessionId, participantsList) => {
    try {
      const issues = [];
      
      // Get checklists for all participants in this session
      for (const participant of participantsList) {
        try {
          const response = await axiosInstance.get(`/vehicle-checklists/${sessionId}/${participant.id}`);
          const checklist = response.data;
          
          if (checklist && checklist.checklist_items) {
            const needsRepair = checklist.checklist_items.filter(item => 
              (item.status || '').toLowerCase() === 'needs_repair'
            );
            
            if (needsRepair.length > 0) {
              issues.push({
                participant_name: participant.full_name,
                participant_id: participant.id,
                items: needsRepair
              });
            }
          }
        } catch (err) {
          // Checklist doesn't exist for this participant, skip
          continue;
        }
      }
      
      setChecklistIssues(issues);
    } catch (error) {
      console.error("Failed to load checklist issues", error);
    }
  };

  const loadTrainingReport = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/training-reports/${sessionId}`);
      if (response.data && response.data.id) {
        setTrainingReport(response.data);
        setAiGeneratedReport(response.data.additional_notes || "");
      }
    } catch (error) {
      // Report doesn't exist yet, that's ok
      console.log("No existing report");
    }
  };

  const handlePhotoUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTrainingReport(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
      toast.success("Photo uploaded");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReport = async (status = "draft") => {
    if (!selectedSession) {
      toast.error("Please select a session first");
      return;
    }

    try {
      const reportData = {
        ...trainingReport,
        session_id: selectedSession.id,
        additional_notes: aiGeneratedReport,
        status: status
      };

      await axiosInstance.post('/training-reports', reportData);
      toast.success(status === "draft" ? "Report saved as draft" : "Report submitted successfully!");
      
      if (status === "submitted") {
        setTrainingReport(prev => ({ ...prev, status: "submitted" }));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save report");
    }
  };

  const handleGenerateAIReport = async () => {
    if (!selectedSession) {
      toast.error("Please select a session first");
      return;
    }

    setGeneratingReport(true);
    try {
      const response = await axiosInstance.post(`/training-reports/${selectedSession.id}/generate-ai-report`);
      
      // Add checklist issues section to the AI report
      let fullReport = response.data.generated_report;
      
      if (checklistIssues.length > 0) {
        fullReport += "\n\n## VEHICLE INSPECTION ISSUES\n\n";
        fullReport += "The following vehicle issues requiring attention were identified during trainer inspections:\n\n";
        
        checklistIssues.forEach((issue, idx) => {
          fullReport += `**${idx + 1}. ${issue.participant_name}**\n`;
          issue.items.forEach(item => {
            fullReport += `   - ${item.item_name || item.name}: ${item.comments || 'Needs repair'}\n`;
          });
          fullReport += "\n";
        });
        
        fullReport += "**Recommendation:** These issues should be addressed before participants use their vehicles on public roads.\n";
      } else {
        fullReport += "\n\n## VEHICLE INSPECTION\n\n";
        fullReport += "All participant vehicles were inspected and found to be in good working condition. No issues requiring immediate attention were identified.\n";
      }
      
      setAiGeneratedReport(fullReport);
      toast.success("AI report generated successfully with checklist data!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate AI report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleUpdateSession = async () => {
    try {
      await axiosInstance.put(`/sessions/${editingSession.id}`, editingSession);
      toast.success("Session updated successfully");
      setEditSessionDialogOpen(false);
      loadSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update session");
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.email || !newParticipant.password || !newParticipant.full_name || !newParticipant.id_number) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!selectedSession) {
      toast.error("Please select a session first");
      return;
    }

    try {
      // Create new user
      const userResponse = await axiosInstance.post("/auth/register", {
        ...newParticipant,
        role: "participant",
        company_id: selectedSession.company_id
      });

      const newUserId = userResponse.data.id;

      // Add to session
      const updatedParticipantIds = [...(selectedSession.participant_ids || []), newUserId];
      await axiosInstance.put(`/sessions/${selectedSession.id}`, {
        ...selectedSession,
        participant_ids: updatedParticipantIds
      });
      
      toast.success(`Participant ${newParticipant.full_name} added successfully`);
      setAddParticipantDialogOpen(false);
      setNewParticipant({ email: "", password: "", full_name: "", id_number: "", phone_number: "" });
      
      // Reload data
      await loadSessions();
      if (selectedSession) {
        await loadSessionData(selectedSession.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add participant");
    }
  };

  // Calculate statistics
  const uniqueParticipantsWithAttendance = attendance.filter((v, i, a) => 
    a.findIndex(t => t.participant_id === v.participant_id) === i
  ).length;
  
  const stats = {
    totalParticipants: participants.length,
    attendanceRate: participants.length > 0 
      ? ((uniqueParticipantsWithAttendance / participants.length) * 100).toFixed(0)
      : 0,
    testPassRate: testResults.length > 0
      ? ((testResults.filter(r => r.passed).length / testResults.length) * 100).toFixed(0)
      : 0,
    totalTestsTaken: testResults.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button onClick={onLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No sessions assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="sessions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sessions">
                <Calendar className="w-4 h-4 mr-2" />
                My Sessions
              </TabsTrigger>
              <TabsTrigger value="management">
                <Users className="w-4 h-4 mr-2" />
                Session Management
              </TabsTrigger>
              <TabsTrigger value="report">
                <FileText className="w-4 h-4 mr-2" />
                Training Report
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: My Sessions */}
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>My Assigned Sessions</CardTitle>
                  <CardDescription>Training sessions you are coordinating</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => {
                      const stats = sessionStats[session.id] || {};
                      const participantTotal = stats.participantCount || 0;
                      
                      return (
                        <button
                          key={session.id}
                          onClick={() => selectSession(session)}
                          className={`p-5 rounded-lg border-2 text-left transition-all ${
                            selectedSession?.id === session.id
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-indigo-300 bg-white'
                          }`}
                        >
                          <h3 className="font-bold text-gray-900 text-lg">{session.name}</h3>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">{session.location}</p>
                            
                            {/* Stats Summary */}
                            <div className="mt-3 pt-3 border-t space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Participants:</span>
                                <span className="text-xs font-semibold text-gray-900">{participantTotal}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-blue-600">Pre-Test:</span>
                                <span className="text-xs font-semibold text-blue-700">
                                  {stats.preTestCompleted || 0}/{participantTotal}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-green-600">Post-Test:</span>
                                <span className="text-xs font-semibold text-green-700">
                                  {stats.postTestCompleted || 0}/{participantTotal}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-purple-600">Feedback:</span>
                                <span className="text-xs font-semibold text-purple-700">
                                  {stats.feedbackCompleted || 0}/{participantTotal}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Session Management */}
            <TabsContent value="management">
              {selectedSession ? (
                <div className="space-y-6">
                  {/* Session Details Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedSession.name}</CardTitle>
                          <CardDescription>{selectedSession.location}</CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setEditingSession({ ...selectedSession });
                            setEditSessionDialogOpen(true);
                          }}
                          variant="outline"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Session
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="font-semibold">{new Date(selectedSession.start_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">End Date</p>
                          <p className="font-semibold">{new Date(selectedSession.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Release Controls */}
                  <Card className="border-indigo-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Release Controls
                      </CardTitle>
                      <CardDescription>Control when participants can access tests and feedback</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Pre-Test */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-900">Pre-Test</p>
                            <p className="text-sm text-gray-600">Initial assessment before training</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={sessionAccess.some(a => a.can_take_pre_test)}
                              onChange={(e) => handleToggleAccess('pre_test', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {/* Post-Test */}
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-900">Post-Test</p>
                            <p className="text-sm text-gray-600">Final assessment after training</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={sessionAccess.some(a => a.can_take_post_test)}
                              onChange={(e) => handleToggleAccess('post_test', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        {/* Feedback */}
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-900">Feedback Form</p>
                            <p className="text-sm text-gray-600">Training feedback and evaluation</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={sessionAccess.some(a => a.can_submit_feedback)}
                              onChange={(e) => handleToggleAccess('feedback', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Session Summary Statistics */}
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardHeader>
                      <CardTitle>Session Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-2xl font-bold text-indigo-600">{participants.length}</p>
                          <p className="text-sm text-gray-600 mt-1">Total Participants</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-2xl font-bold text-blue-600">
                            {testResults.filter(r => r.test_type === 'pre').length}/{participants.length}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Pre-Test Completed</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-2xl font-bold text-green-600">
                            {testResults.filter(r => r.test_type === 'post').length}/{participants.length}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Post-Test Completed</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-2xl font-bold text-purple-600">
                            {attendance.filter((v, i, a) => a.findIndex(t => t.participant_id === v.participant_id) === i).length}/{participants.length}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Attendance Records</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Participants */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Participants ({participants.length})</CardTitle>
                      <CardDescription>All participants enrolled in this session</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {participants.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">No participants assigned yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {participants.map((p) => (
                            <div key={p.id} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-medium">{p.full_name}</p>
                                <p className="text-sm text-gray-600">{p.email}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {p.id_number || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attendance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attendance.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No attendance records yet</p>
                      ) : (
                        <div className="space-y-2">
                          {attendance.slice(0, 10).map((record, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                              <div>
                                <p className="font-medium">{record.participant_name}</p>
                                <p className="text-xs text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-sm">
                                <span className="text-green-600 font-medium">In: {record.clock_in || '-'}</span>
                                <span className="mx-2">|</span>
                                <span className="text-red-600 font-medium">Out: {record.clock_out || '-'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vehicle Checklist Issues */}
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <span className="text-2xl">⚠️</span>
                        Vehicle Issues - Needs Repair
                      </CardTitle>
                      <CardDescription>Items flagged by trainers requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {checklistIssues.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-green-600 font-medium">✓ No vehicle issues reported</p>
                          <p className="text-sm text-gray-500 mt-1">All vehicles inspected are in good condition</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {checklistIssues.map((issue, idx) => (
                            <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h4 className="font-semibold text-red-900 mb-2">{issue.participant_name}</h4>
                              <div className="space-y-2">
                                {issue.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="p-2 bg-white rounded border border-red-200">
                                    <p className="font-medium text-sm text-red-800">{item.item_name || item.name || 'Item'}</p>
                                    {item.comments && (
                                      <p className="text-xs text-gray-700 mt-1">{item.comments}</p>
                                    )}
                                    {item.photo && (
                                      <img 
                                        src={item.photo} 
                                        alt={item.item_name} 
                                        className="mt-2 w-24 h-24 object-cover rounded border"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Please select a session first</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab 3: Training Report */}
            <TabsContent value="report">
              {selectedSession ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Training Completion Report - {selectedSession.name}</CardTitle>
                    <CardDescription>
                      Upload training photos and generate a comprehensive report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Photo Upload Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Training Photos</h3>
                      <p className="text-sm text-gray-600">Upload photos from the training session (max 5MB each)</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Group Photo */}
                        <div className="space-y-2">
                          <Label>1. Group Photo *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                            {trainingReport.group_photo ? (
                              <div className="relative">
                                <img src={trainingReport.group_photo} alt="Group" className="w-full h-40 object-cover rounded" />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                  onClick={() => setTrainingReport(prev => ({ ...prev, group_photo: "" }))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, 'group_photo')}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Theory Photo 1 */}
                        <div className="space-y-2">
                          <Label>2. Theory Session Photo 1 *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                            {trainingReport.theory_photo_1 ? (
                              <div className="relative">
                                <img src={trainingReport.theory_photo_1} alt="Theory 1" className="w-full h-40 object-cover rounded" />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                  onClick={() => setTrainingReport(prev => ({ ...prev, theory_photo_1: "" }))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, 'theory_photo_1')}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Theory Photo 2 */}
                        <div className="space-y-2">
                          <Label>3. Theory Session Photo 2 *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                            {trainingReport.theory_photo_2 ? (
                              <div className="relative">
                                <img src={trainingReport.theory_photo_2} alt="Theory 2" className="w-full h-40 object-cover rounded" />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                  onClick={() => setTrainingReport(prev => ({ ...prev, theory_photo_2: "" }))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, 'theory_photo_2')}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Practical Photo 1 */}
                        <div className="space-y-2">
                          <Label>4. Practical Session Photo 1 *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                            {trainingReport.practical_photo_1 ? (
                              <div className="relative">
                                <img src={trainingReport.practical_photo_1} alt="Practical 1" className="w-full h-40 object-cover rounded" />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                  onClick={() => setTrainingReport(prev => ({ ...prev, practical_photo_1: "" }))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, 'practical_photo_1')}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Practical Photo 2 */}
                        <div className="space-y-2">
                          <Label>5. Practical Session Photo 2 *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                            {trainingReport.practical_photo_2 ? (
                              <div className="relative">
                                <img src={trainingReport.practical_photo_2} alt="Practical 2" className="w-full h-40 object-cover rounded" />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                  onClick={() => setTrainingReport(prev => ({ ...prev, practical_photo_2: "" }))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, 'practical_photo_2')}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Practical Photo 3 */}
                        <div className="space-y-2">
                          <Label>6. Practical Session Photo 3 *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                            {trainingReport.practical_photo_3 ? (
                              <div className="relative">
                                <img src={trainingReport.practical_photo_3} alt="Practical 3" className="w-full h-40 object-cover rounded" />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                  onClick={() => setTrainingReport(prev => ({ ...prev, practical_photo_3: "" }))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, 'practical_photo_3')}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Report Generation */}
                    <div className="space-y-4 border-t pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">Training Report</h3>
                          <p className="text-sm text-gray-600">Generate AI-powered report or write your own</p>
                        </div>
                        <Button
                          onClick={handleGenerateAIReport}
                          disabled={generatingReport}
                          style={{ backgroundColor: primaryColor }}
                        >
                          {generatingReport ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate AI Report
                            </>
                          )}
                        </Button>
                      </div>

                      <Textarea
                        value={aiGeneratedReport}
                        onChange={(e) => setAiGeneratedReport(e.target.value)}
                        placeholder="Click 'Generate AI Report' to create a comprehensive training report, or write your own..."
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 border-t pt-6">
                      <Button
                        onClick={() => handleSaveReport("draft")}
                        variant="outline"
                        className="flex-1"
                        disabled={trainingReport.status === "submitted"}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save as Draft
                      </Button>
                      <Button
                        onClick={() => handleSaveReport("submitted")}
                        style={{ backgroundColor: primaryColor }}
                        className="flex-1"
                        disabled={trainingReport.status === "submitted"}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Final Report
                      </Button>
                    </div>

                    {trainingReport.status === "submitted" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-800 font-semibold">✓ Report Submitted Successfully</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Please select a session first</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab 4: Analytics */}
            <TabsContent value="analytics">
              {selectedSession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-600">Total Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-indigo-600">{stats.totalParticipants}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-600">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-600">Test Pass Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">{stats.testPassRate}%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-600">Tests Taken</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">{stats.totalTestsTaken}</p>
                    </CardContent>
                  </Card>

                  {/* Test Results Breakdown */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Test Results Overview</CardTitle>
                      <CardDescription>Recent test submissions and scores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {!testResults || testResults.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No test results yet</p>
                            <p className="text-sm text-gray-400 mt-1">Results will appear when participants complete tests</p>
                          </div>
                        ) : (
                          testResults.slice(0, 8).map((result, idx) => {
                            const participant = participants.find(p => p.id === result.participant_id);
                            const scorePercentage = result.total_questions > 0 
                              ? ((result.correct_answers / result.total_questions) * 100).toFixed(0)
                              : 0;
                            
                            return (
                              <div key={idx} className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">
                                    {participant?.full_name || 'Unknown Participant'}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-gray-600">
                                      {result.test_type === 'pre' ? '📝 Pre-Test' : '📋 Post-Test'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Score: {result.correct_answers}/{result.total_questions} ({scorePercentage}%)
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                                  result.passed 
                                    ? 'bg-green-100 text-green-800 border-green-300' 
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }`}>
                                  {result.passed ? '✓ PASSED' : '✗ FAILED'}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance Summary */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Recent Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {attendance.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No attendance records yet</p>
                        ) : (
                          attendance.slice(0, 5).map((record, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{record.participant_name}</p>
                                <p className="text-xs text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-xs">
                                <span className="text-green-600">In: {record.clock_in || '-'}</span>
                                <span className="mx-2">|</span>
                                <span className="text-red-600">Out: {record.clock_out || '-'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Please select a session first</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Edit Session Dialog */}
      <Dialog open={editSessionDialogOpen} onOpenChange={setEditSessionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update session details</DialogDescription>
          </DialogHeader>
          {editingSession && (
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
              <Button onClick={handleUpdateSession} className="w-full">
                Update Session
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoordinatorDashboard;
