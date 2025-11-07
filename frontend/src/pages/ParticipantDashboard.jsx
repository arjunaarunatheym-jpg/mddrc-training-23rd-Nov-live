import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, FileText, ClipboardCheck, MessageSquare, Award, Play, Users, Clock, Download, Eye } from "lucide-react";

const ParticipantDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [participantAccess, setParticipantAccess] = useState({});
  const [vehicleDetails, setVehicleDetails] = useState({});
  const [attendanceToday, setAttendanceToday] = useState({});
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_model: "",
    registration_number: "",
    roadtax_expiry: ""
  });
  
  // Tab restrictions removed - all tabs accessible

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsRes, certsRes, resultsRes, checklistsRes] = await Promise.all([
        axiosInstance.get("/sessions"),
        axiosInstance.get(`/certificates/participant/${user.id}`),
        axiosInstance.get(`/tests/results/participant/${user.id}`),
        axiosInstance.get(`/checklists/participant/${user.id}`),
      ]);
      setSessions(sessionsRes.data);
      setCertificates(certsRes.data);
      setTestResults(resultsRes.data);
      setChecklists(checklistsRes.data);
      
      // Load available tests and access for each session
      loadAvailableTests(sessionsRes.data);
      loadParticipantAccess(sessionsRes.data);
      
      // Load vehicle details and attendance for each session
      if (sessionsRes.data.length > 0) {
        const firstSession = sessionsRes.data[0];
        await loadVehicleDetails(firstSession.id);
        await loadAttendanceToday(firstSession.id);
        
        sessionsRes.data.forEach(session => {
          if (session.id !== firstSession.id) {
            loadVehicleDetails(session.id);
            loadAttendanceToday(session.id);
          }
        });
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    }
  };

  const loadParticipantAccess = async (sessionsList) => {
    try {
      const accessPromises = sessionsList.map(session =>
        axiosInstance.get(`/participant-access/${session.id}`)
          .then(res => ({ [session.id]: res.data }))
          .catch(() => ({ [session.id]: {} }))
      );
      const accessArrays = await Promise.all(accessPromises);
      const allAccess = accessArrays.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setParticipantAccess(allAccess);
    } catch (error) {
      console.error("Failed to load participant access");
    }
  };

  const loadAvailableTests = async (sessionsList) => {
    try {
      const testsPromises = sessionsList.map(session =>
        axiosInstance.get(`/sessions/${session.id}/tests/available`)
          .then(res => res.data.map(test => ({ ...test, session_id: session.id, session_name: session.name })))
          .catch(() => [])
      );
      const testsArrays = await Promise.all(testsPromises);
      const allTests = testsArrays.flat();
      setAvailableTests(allTests);
    } catch (error) {
      console.error("Failed to load available tests");
    }
  };

  const handleTakeTest = (testId, sessionId) => {
    navigate(`/take-test/${testId}/${sessionId}`);
  };

  const handleViewResult = (resultId) => {
    navigate(`/test-results/${resultId}`);
  };

  const handleFeedback = (sessionId) => {
    navigate(`/feedback/${sessionId}`);
  };

  const handleDownloadCertificate = async (sessionId) => {
    try {
      const response = await axiosInstance.post(`/certificates/generate/${sessionId}/${user.id}`);
      const certificateUrl = response.data.certificate_url;
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = `${process.env.REACT_APP_BACKEND_URL}${certificateUrl}`;
      link.download = `certificate_${sessionId}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Certificate downloading...");
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.detail || "Failed to download certificate");
    }
  };

  const handleDownloadExistingCertificate = async (cert) => {
    try {
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = `${process.env.REACT_APP_BACKEND_URL}${cert.certificate_url}`;
      link.download = `certificate_${cert.session_id}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Certificate downloading...");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download certificate");
    }
  };

  const handlePreviewCertificate = async (sessionId) => {
    try {
      // First generate/get the certificate
      const response = await axiosInstance.post(`/certificates/generate/${sessionId}/${user.id}`);
      const certificateUrl = response.data.certificate_url;
      
      // Open PDF in new tab - simple and reliable
      window.open(`${process.env.REACT_APP_BACKEND_URL}${certificateUrl}`, '_blank');
      
      toast.success("Opening certificate...");
    } catch (error) {
      console.error('Preview error:', error);
      toast.error(error.response?.data?.detail || "Failed to preview certificate");
    }
  };

  const handlePreviewExistingCertificate = async (cert) => {
    try {
      // Open PDF in new tab - simple and reliable
      window.open(`${process.env.REACT_APP_BACKEND_URL}${cert.certificate_url}`, '_blank');
      
      toast.success("Opening certificate...");
    } catch (error) {
      console.error('Preview error:', error);
      toast.error("Failed to preview certificate");
    }
  };

  const handleVehicleSubmit = async (sessionId) => {
    if (!vehicleForm.vehicle_model || !vehicleForm.registration_number || !vehicleForm.roadtax_expiry) {
      toast.error("Please fill in all vehicle details");
      return;
    }

    try {
      await axiosInstance.post("/vehicle-details/submit", {
        session_id: sessionId,
        ...vehicleForm
      });
      toast.success("Vehicle details saved!");
      loadVehicleDetails(sessionId);
      setVehicleForm({ vehicle_model: "", registration_number: "", roadtax_expiry: "" });
    } catch (error) {
      toast.error("Failed to save vehicle details");
    }
  };

  const loadVehicleDetails = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/vehicle-details/${sessionId}/${user.id}`);
      if (response.data) {
        setVehicleDetails(prev => ({ ...prev, [sessionId]: response.data }));
      }
    } catch (error) {
      console.error("Failed to load vehicle details");
    }
  };

  const loadAttendanceToday = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/attendance/${sessionId}/${user.id}`);
      if (response.data && response.data.length > 0) {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = response.data.find(a => a.date === today);
        
        if (todayAttendance) {
          setAttendanceToday(prev => ({
            ...prev,
            [sessionId]: {
              clock_in: !!todayAttendance.clock_in_time,
              clock_out: !!todayAttendance.clock_out_time
            }
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load attendance");
    }
  };

  const handleClockIn = async (sessionId) => {
    try {
      await axiosInstance.post("/attendance/clock-in", { session_id: sessionId });
      toast.success("Clocked in successfully!");
      setAttendanceToday(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], clock_in: true } }));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to clock in");
    }
  };

  const handleClockOut = async (sessionId) => {
    try {
      await axiosInstance.post("/attendance/clock-out", { session_id: sessionId });
      toast.success("Clocked out successfully!");
      setAttendanceToday(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], clock_out: true } }));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to clock out");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participant Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button
            data-testid="participant-logout-button"
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
        {!canAccessAllTabs && (
          <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg">
            <p className="font-semibold text-yellow-800">⚠️ Complete Your Profile</p>
            <p className="text-sm text-yellow-700 mt-1">
              {!hasVehicleDetails && "Please fill in your vehicle details. "}
              {!hasClockedIn && "Please clock in to access all features."}
            </p>
          </div>
        )}
        
        <Tabs defaultValue={canAccessAllTabs ? "overview" : "details"} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview" data-testid="overview-tab" disabled={!canAccessAllTabs}>
              <FileText className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" data-testid="details-tab">
              <Users className="w-4 h-4 mr-2" />
              My Details
            </TabsTrigger>
            <TabsTrigger value="certificates" data-testid="certificates-tab" disabled={!canAccessAllTabs}>
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tests-tab" disabled={!canAccessAllTabs}>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="checklists" data-testid="checklists-tab" disabled={!canAccessAllTabs}>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Checklists
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">My Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-900">{sessions.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-900">{certificates.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Tests Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-900">{testResults.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>My Training Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sessions assigned yet</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const access = participantAccess[session.id] || {};
                      const feedbackSubmitted = access.feedback_submitted || false;
                      const canAccessFeedback = access.can_access_feedback || false;
                      
                      return (
                        <div
                          key={session.id}
                          data-testid={`participant-session-${session.id}`}
                          className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{session.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">Location: {session.location}</p>
                              <p className="text-sm text-gray-600">
                                {session.start_date} to {session.end_date}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {canAccessFeedback && !feedbackSubmitted && (
                                <Button
                                  size="sm"
                                  onClick={() => handleFeedback(session.id)}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                  data-testid={`feedback-button-${session.id}`}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Submit Feedback
                                </Button>
                              )}
                              {feedbackSubmitted && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handlePreviewCertificate(session.id)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    data-testid={`preview-certificate-button-${session.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownloadCertificate(session.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                    data-testid={`certificate-button-${session.id}`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              )}
                              {feedbackSubmitted && (
                                <span className="text-xs text-green-700 font-semibold">✓ Feedback Submitted</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates */}
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>My Certificates</CardTitle>
                <CardDescription>View and download your training certificates</CardDescription>
              </CardHeader>
              <CardContent>
                {certificates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No certificates issued yet</p>
                ) : (
                  <div className="space-y-3">
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        data-testid={`certificate-${cert.id}`}
                        className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className="w-8 h-8 text-yellow-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">Training Certificate</h3>
                              <p className="text-sm text-gray-600">
                                Issued: {new Date(cert.issue_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                Program: {cert.program_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handlePreviewExistingCertificate(cert)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              data-testid={`preview-cert-${cert.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              onClick={() => handleDownloadExistingCertificate(cert)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              data-testid={`download-cert-${cert.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Details */}
          <TabsContent value="details">
            {sessions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>My Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">No sessions assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sessions.map((session) => {
                  const vehicleInfo = vehicleDetails[session.id];
                  const attendance = attendanceToday[session.id] || {};

                  return (
                    <Card key={session.id}>
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle>{session.name}</CardTitle>
                        <CardDescription>
                          {session.start_date} to {session.end_date} • {session.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* Attendance */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Attendance</h3>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleClockIn(session.id)}
                              disabled={attendance.clock_in}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`clock-in-${session.id}`}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {attendance.clock_in ? "Clocked In ✓" : "Clock In"}
                            </Button>
                            <Button
                              onClick={() => handleClockOut(session.id)}
                              disabled={!attendance.clock_in || attendance.clock_out}
                              variant="outline"
                              data-testid={`clock-out-${session.id}`}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {attendance.clock_out ? "Clocked Out ✓" : "Clock Out"}
                            </Button>
                          </div>
                        </div>

                        {/* Vehicle Details */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Vehicle Details</h3>
                          {vehicleInfo ? (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Vehicle Model</p>
                                  <p className="font-medium">{vehicleInfo.vehicle_model}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Registration No.</p>
                                  <p className="font-medium">{vehicleInfo.registration_number}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Roadtax Expiry</p>
                                  <p className="font-medium">{vehicleInfo.roadtax_expiry}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-sm text-yellow-800 mb-3">Please provide your vehicle details</p>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="vehicle_model">Vehicle Model</Label>
                                  <Input
                                    id="vehicle_model"
                                    value={vehicleForm.vehicle_model}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_model: e.target.value })}
                                    placeholder="e.g., Honda City"
                                    data-testid={`vehicle-model-${session.id}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="registration_number">Registration Number</Label>
                                  <Input
                                    id="registration_number"
                                    value={vehicleForm.registration_number}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })}
                                    placeholder="e.g., ABC 1234"
                                    data-testid={`registration-${session.id}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="roadtax_expiry">Roadtax Expiry</Label>
                                  <Input
                                    id="roadtax_expiry"
                                    type="date"
                                    value={vehicleForm.roadtax_expiry}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, roadtax_expiry: e.target.value })}
                                    data-testid={`roadtax-${session.id}`}
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={() => handleVehicleSubmit(session.id)}
                                className="w-full"
                                data-testid={`submit-vehicle-${session.id}`}
                              >
                                Save Vehicle Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tests */}
          <TabsContent value="tests">
            {/* Available Tests */}
            {availableTests.length > 0 && (
              <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardHeader>
                  <CardTitle>Available Tests</CardTitle>
                  <CardDescription>Tests you need to complete</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableTests.map((test) => (
                      <div
                        key={`${test.id}-${test.session_id}`}
                        data-testid={`available-test-${test.id}`}
                        className="p-4 bg-white rounded-lg border-2 border-emerald-300"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {test.test_type === "pre" ? "Pre-Test" : "Post-Test"}
                            </h3>
                            <p className="text-sm text-gray-600">{test.session_name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {test.questions.length} questions
                            </p>
                          </div>
                          <Button
                            onClick={() => handleTakeTest(test.id, test.session_id)}
                            data-testid={`take-test-${test.id}`}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Test
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>View your completed test scores</CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No test results yet</p>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        data-testid={`test-result-${result.id}`}
                        className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                          result.passed
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                        }`}
                        onClick={() => handleViewResult(result.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {result.test_type === "pre" ? "Pre-Test" : "Post-Test"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(result.submitted_at).toLocaleDateString()}
                            </p>
                            <p className={`text-xs font-semibold mt-1 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {result.passed ? "PASSED" : "FAILED"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {result.score.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {result.correct_answers} / {result.total_questions} correct
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklists */}
          <TabsContent value="checklists">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Checklists</CardTitle>
                <CardDescription>Submit and track your vehicle inspection checklists</CardDescription>
              </CardHeader>
              <CardContent>
                {checklists.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No checklists submitted yet</p>
                ) : (
                  <div className="space-y-3">
                    {checklists.map((checklist) => (
                      <div
                        key={checklist.id}
                        data-testid={`checklist-${checklist.id}`}
                        className="p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {checklist.interval.replace("_", " ").toUpperCase()} Checklist
                            </h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(checklist.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              checklist.verification_status === "approved"
                                ? "bg-green-100 text-green-800"
                                : checklist.verification_status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {checklist.verification_status}
                          </span>
                        </div>
                      </div>
                    ))}
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

export default ParticipantDashboard;
