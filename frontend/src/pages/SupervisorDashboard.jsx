import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, ClipboardCheck, Users, CheckCircle, XCircle, FileText, Download } from "lucide-react";

const SupervisorDashboard = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [pendingChecklists, setPendingChecklists] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    loadData();
    loadReports();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsRes, checklistsRes] = await Promise.all([
        axiosInstance.get("/sessions"),
        axiosInstance.get("/checklists/pending"),
      ]);
      setSessions(sessionsRes.data);
      setPendingChecklists(checklistsRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    }
  };

  const loadAttendance = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/attendance/session/${sessionId}`);
      setAttendance(response.data);
    } catch (error) {
      console.error("Failed to load attendance", error);


  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const response = await axiosInstance.get("/training-reports/supervisor/sessions");
      setReports(response.data || []);
    } catch (error) {
      console.error("Failed to load reports", error);
      toast.error("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const downloadReport = async (report) => {
    try {
      const response = await axiosInstance.get(report.pdf_url, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Training_Report_${report.session_name?.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (error) {
      toast.error("Failed to download report");
    }
  };

      toast.error("Failed to load attendance");
    }
  };

  const handleVerifyChecklist = async (checklistId, status) => {
    try {
      await axiosInstance.post("/checklists/verify", {
        checklist_id: checklistId,
        status: status,
      });
      toast.success(`Checklist ${status} successfully`);
      loadData();
    } catch (error) {
      toast.error("Failed to verify checklist");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button
            data-testid="supervisor-logout-button"
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
        <Tabs defaultValue="checklists" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="sessions" data-testid="sessions-tab">
              <Users className="w-4 h-4 mr-2" />
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="attendance-tab">
              <CheckCircle className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="checklists" data-testid="checklists-tab">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Checklists
            </TabsTrigger>
          </TabsList>

          {/* Checklists Tab */}
          <TabsContent value="checklists">
            <Card>
              <CardHeader>
                <CardTitle>Pending Vehicle Checklists</CardTitle>
                <CardDescription>Review and verify participant checklists</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingChecklists.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending checklists</p>
                ) : (
                  <div className="space-y-4">
                    {pendingChecklists.map((checklist) => (
                      <div
                        key={checklist.id}
                        data-testid={`pending-checklist-${checklist.id}`}
                        className="p-4 bg-white rounded-lg border-2 border-orange-200 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {checklist.interval.replace("_", " ").toUpperCase()} Checklist
                            </h3>
                            <p className="text-sm text-gray-600">
                              Participant ID: {checklist.participant_id}
                            </p>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(checklist.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              data-testid={`approve-checklist-${checklist.id}`}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleVerifyChecklist(checklist.id, "approved")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              data-testid={`reject-checklist-${checklist.id}`}
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVerifyChecklist(checklist.id, "rejected")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-semibold mb-2">Checklist Items:</h4>
                          <div className="space-y-1">
                            {checklist.checklist_items.map((item, idx) => (
                              <div key={idx} className="text-sm flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.status ? "bg-green-500" : "bg-red-500"
                                  }`}
                                ></span>
                                <span className="flex-1">{item.item}</span>
                                {item.comments && (
                                  <span className="text-gray-500 text-xs">({item.comments})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>My Training Sessions</CardTitle>
                <CardDescription>Sessions you are supervising</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sessions assigned yet</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        data-testid={`supervisor-session-${session.id}`}
                        className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg"
                      >
                        <h3 className="font-semibold text-gray-900">{session.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Location: {session.location}</p>
                        <p className="text-sm text-gray-600">
                          {session.start_date} to {session.end_date}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Participants: {session.participant_ids.length}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Session Attendance</CardTitle>
                <CardDescription>Select a session to view attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Session Selector */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Session:</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={selectedSession?.id || ''}
                      onChange={(e) => {
                        const session = sessions.find(s => s.id === e.target.value);
                        setSelectedSession(session);
                        if (session) loadAttendance(session.id);
                      }}
                    >
                      <option value="">Choose a session...</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name} - {session.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Attendance List */}
                  {selectedSession && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg mb-4">Attendance Records</h3>
                      {attendance.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No attendance records yet</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left p-3 font-semibold">Participant</th>
                                <th className="text-left p-3 font-semibold">Vehicle Details</th>
                                <th className="text-center p-3 font-semibold">Clock In</th>
                                <th className="text-center p-3 font-semibold">Clock Out</th>
                                <th className="text-center p-3 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendance.map((record) => (
                                <tr key={record.id} className="border-b hover:bg-gray-50">
                                  <td className="p-3">
                                    <p className="font-medium">{record.participant_name}</p>
                                    <p className="text-xs text-gray-500">{record.participant_email}</p>
                                  </td>
                                  <td className="p-3">
                                    <p className="text-xs">{record.vehicle_type || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{record.plate_number || 'N/A'}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="text-green-700 font-medium">
                                      {record.clock_in || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={record.clock_out ? 'text-blue-700 font-medium' : 'text-gray-400'}>
                                      {record.clock_out || 'Not clocked out'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    {record.clock_out ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                        Complete
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                        In Progress
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default SupervisorDashboard;
