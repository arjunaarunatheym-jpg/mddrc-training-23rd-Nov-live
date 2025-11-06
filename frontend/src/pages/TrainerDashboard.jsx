import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Calendar, ClipboardCheck, Users } from "lucide-react";

const TrainerDashboard = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/sessions");
      setSessions(response.data);
    } catch (error) {
      toast.error("Failed to load sessions");
    }
  };

  const getRoleName = (role) => {
    if (role === "chief_trainer") return "Chief Trainer";
    if (role === "coordinator") return "Coordinator";
    return "Trainer";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trainer Portal</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user.full_name} ({getRoleName(user.role)})
            </p>
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
                <CardDescription>Sessions you are assigned to</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No sessions assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        data-testid={`session-${session.id}`}
                        className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold text-gray-900">{session.name}</h3>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>Location: {session.location}</p>
                          <p>
                            Duration: {session.start_date} to {session.end_date}
                          </p>
                          <p>Participants: {session.participant_ids.length}</p>
                        </div>
                      </div>
                    ))}
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
                  {user.role === "trainer"
                    ? "Review and comment on participant checklists"
                    : "Manage vehicle checklists and reports"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Checklist management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role-specific features */}
        {(user.role === "chief_trainer" || user.role === "coordinator") && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {user.role === "chief_trainer" ? "Training Summary" : "Coordinator Report"}
              </CardTitle>
              <CardDescription>
                {user.role === "chief_trainer"
                  ? "Write end-of-training summary"
                  : "Write coordinator summary and manage reports"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Report writing features coming soon...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TrainerDashboard;
