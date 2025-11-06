import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Calendar, FileText, CheckCircle, Clock, Users, AlertCircle } from "lucide-react";

const CoordinatorDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sessionStatuses, setSessionStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/sessions");
      // Filter sessions where user is assigned as coordinator
      const mySessions = response.data.filter(session => session.coordinator_id === user.id);
      setSessions(mySessions);
      
      // Load status for each session
      for (const session of mySessions) {
        loadSessionStatus(session.id);
      }
      
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load sessions");
      setLoading(false);
    }
  };

  const loadSessionStatus = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/sessions/${sessionId}/status`);
      setSessionStatuses(prev => ({
        ...prev,
        [sessionId]: response.data
      }));
    } catch (error) {
      console.error(`Failed to load status for session ${sessionId}`);
    }
  };

  const handleReleasePreTest = async (sessionId) => {
    try {
      await axiosInstance.post(`/sessions/${sessionId}/release-pre-test`);
      toast.success("Pre-test released to all participants!");
      loadSessionStatus(sessionId);
    } catch (error) {
      toast.error("Failed to release pre-test");
    }
  };

  const handleReleasePostTest = async (sessionId) => {
    try {
      await axiosInstance.post(`/sessions/${sessionId}/release-post-test`);
      toast.success("Post-test released to all participants!");
      loadSessionStatus(sessionId);
    } catch (error) {
      toast.error("Failed to release post-test");
    }
  };

  const handleReleaseFeedback = async (sessionId) => {
    try {
      await axiosInstance.post(`/sessions/${sessionId}/release-feedback`);
      toast.success("Feedback form released to all participants!");
      loadSessionStatus(sessionId);
    } catch (error) {
      toast.error("Failed to release feedback form");
    }
  };

  const handleViewResults = (sessionId) => {
    navigate(`/results-summary/${sessionId}`);
  };

  const getStatusColor = (released, completed, total) => {
    if (!released) return "text-gray-400";
    if (completed === total) return "text-green-600";
    if (completed > 0) return "text-yellow-600";
    return "text-blue-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button
            data-testid="coordinator-logout-button"
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
        <Card>
          <CardHeader>
            <CardTitle>My Sessions</CardTitle>
            <CardDescription>Manage test and feedback releases for your sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No sessions assigned yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sessions.map((session) => {
                  const status = sessionStatuses[session.id];
                  if (!status) return null;

                  return (
                    <Card key={session.id} className="border-2">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{session.name}</CardTitle>
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              <p>Location: {session.location}</p>
                              <p>Duration: {session.start_date} to {session.end_date}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{status.total_participants} Participants</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleViewResults(session.id)}
                            variant="outline"
                            data-testid={`view-results-${session.id}`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Results
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Pre-Test Card */}
                          <Card className={status.pre_test.released ? "border-blue-200" : "border-gray-200"}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                {status.pre_test.released ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                Pre-Test
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {status.pre_test.released ? (
                                <div className="space-y-2">
                                  <div className={`text-2xl font-bold ${getStatusColor(true, status.pre_test.completed, status.total_participants)}`}>
                                    {status.pre_test.completed} / {status.total_participants}
                                  </div>
                                  <p className="text-xs text-gray-600">Completed</p>
                                  {status.pre_test.completed < status.total_participants && (
                                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Waiting for responses</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleReleasePreTest(session.id)}
                                  className="w-full"
                                  data-testid={`release-pre-test-${session.id}`}
                                >
                                  Release Pre-Test
                                </Button>
                              )}
                            </CardContent>
                          </Card>

                          {/* Post-Test Card */}
                          <Card className={status.post_test.released ? "border-blue-200" : "border-gray-200"}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                {status.post_test.released ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                Post-Test
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {status.post_test.released ? (
                                <div className="space-y-2">
                                  <div className={`text-2xl font-bold ${getStatusColor(true, status.post_test.completed, status.total_participants)}`}>
                                    {status.post_test.completed} / {status.total_participants}
                                  </div>
                                  <p className="text-xs text-gray-600">Completed</p>
                                  {status.post_test.completed < status.total_participants && (
                                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Waiting for responses</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleReleasePostTest(session.id)}
                                  className="w-full"
                                  data-testid={`release-post-test-${session.id}`}
                                >
                                  Release Post-Test
                                </Button>
                              )}
                            </CardContent>
                          </Card>

                          {/* Feedback Card */}
                          <Card className={status.feedback.released ? "border-blue-200" : "border-gray-200"}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                {status.feedback.released ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                Feedback Form
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {status.feedback.released ? (
                                <div className="space-y-2">
                                  <div className={`text-2xl font-bold ${getStatusColor(true, status.feedback.submitted, status.total_participants)}`}>
                                    {status.feedback.submitted} / {status.total_participants}
                                  </div>
                                  <p className="text-xs text-gray-600">Submitted</p>
                                  {status.feedback.submitted < status.total_participants && (
                                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Waiting for responses</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleReleaseFeedback(session.id)}
                                  className="w-full"
                                  data-testid={`release-feedback-${session.id}`}
                                >
                                  Release Feedback
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
