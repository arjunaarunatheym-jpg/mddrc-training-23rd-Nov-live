import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, FileText, ClipboardCheck, MessageSquare, Award } from "lucide-react";

const ParticipantDashboard = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [checklists, setChecklists] = useState([]);

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
    } catch (error) {
      toast.error("Failed to load dashboard data");
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <FileText className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="certificates" data-testid="certificates-tab">
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tests-tab">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="checklists" data-testid="checklists-tab">
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
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        data-testid={`participant-session-${session.id}`}
                        className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg"
                      >
                        <h3 className="font-semibold text-gray-900">{session.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Location: {session.location}</p>
                        <p className="text-sm text-gray-600">
                          {session.start_date} to {session.end_date}
                        </p>
                      </div>
                    ))}
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
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-yellow-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Training Certificate</h3>
                            <p className="text-sm text-gray-600">
                              Issued: {new Date(cert.issue_date).toLocaleDateString()}
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

          {/* Tests */}
          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>View your pre and post test scores</CardDescription>
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
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">Test Result</h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(result.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600">{result.score.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600">
                              {result.total_questions} questions
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
