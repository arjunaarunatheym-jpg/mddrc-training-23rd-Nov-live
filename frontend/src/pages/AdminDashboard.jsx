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
import { LogOut, Building2, Users, Calendar, MessageSquare, BookOpen, Plus, Trash2, Edit, UserPlus, UserCog, ClipboardList, ClipboardCheck, Settings as SettingsIcon, FileText, Download, Search, Book, Award } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import TestManagement from "./TestManagement";
import FeedbackManagement from "./FeedbackManagement";
import ChecklistManagement from "./ChecklistManagement";
import Settings from "./Settings";
import { useTheme } from "../context/ThemeContext";

const AdminDashboard = ({ user, onLogout }) => {
  const { primaryColor, secondaryColor } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  // Checklist states
  const [checklistTemplates, setChecklistTemplates] = useState([]);
  const [checklistForm, setChecklistForm] = useState({ program_id: "", items: [""] });
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  
  // Supervisor states
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorForm, setSupervisorForm] = useState({
    email: "",
    password: "",
    full_name: "",
    company_id: ""
  });
  const [supervisorDialogOpen, setSupervisorDialogOpen] = useState(false);

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
    participants: [], // Participants to create/link
    supervisors: [], // Supervisors to create/link
    trainer_assignments: [],
    coordinator_id: "",
  });
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
    phone_number: "",
  });
  const [newSupervisor, setNewSupervisor] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
    phone_number: "",
  });
  const [participantMatchStatus, setParticipantMatchStatus] = useState(null);
  const [supervisorMatchStatus, setSupervisorMatchStatus] = useState(null);
  const [newTrainerAssignment, setNewTrainerAssignment] = useState({
    trainer_id: "",
    role: "regular",
  });
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  
  // Reports Archive states
  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsSearch, setReportsSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);


  // Certificates Repository states
  const [allCertificates, setAllCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [certificatesSearch, setCertificatesSearch] = useState("");
  const [filterCertSession, setFilterCertSession] = useState("all");
  const [filterCertProgram, setFilterCertProgram] = useState("all");

  
  // Password reset states
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPasswordForm, setNewPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
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

  const [assistantAdminForm, setAssistantAdminForm] = useState({
    email: "",
    password: "",
    full_name: "",
    id_number: "",
  });
  const [assistantAdminDialogOpen, setAssistantAdminDialogOpen] = useState(false);

  // Edit states
  const [editingProgram, setEditingProgram] = useState(null);
  const [editProgramDialogOpen, setEditProgramDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompanyDialogOpen, setEditCompanyDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffDialogOpen, setEditStaffDialogOpen] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({
    full_name: "",
    email: "",
    id_number: "",
  });
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadData();
    loadChecklistTemplates();
  }, []);

  // Check participant existence with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUserExists(
        newParticipant.full_name,
        newParticipant.email,
        newParticipant.id_number,
        setParticipantMatchStatus
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [newParticipant.full_name, newParticipant.email, newParticipant.id_number]);

  // Check supervisor existence with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUserExists(
        newSupervisor.full_name,
        newSupervisor.email,
        newSupervisor.id_number,
        setSupervisorMatchStatus
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [newSupervisor.full_name, newSupervisor.email, newSupervisor.id_number]);

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

  const loadChecklistTemplates = async () => {
    try {
      const response = await axiosInstance.get("/checklist-templates");
      setChecklistTemplates(response.data);
    } catch (error) {
      console.error("Failed to load checklist templates:", error);
    }
  };

  // Check if user exists for real-time feedback
  const checkUserExists = async (full_name, email, id_number, setMatchStatus) => {
    if (!full_name && !email && !id_number) {
      setMatchStatus(null);
      return;
    }

    try {
      const response = await axiosInstance.post("/users/check-exists", null, {
        params: { full_name, email, id_number }
      });
      
      if (response.data.exists) {
        setMatchStatus({
          exists: true,
          user: response.data.user
        });
      } else {
        setMatchStatus({ exists: false });
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
      setMatchStatus(null);
    }
  };

  // Supervisor functions removed - now created during session creation

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

  const handleCreateAssistantAdmin = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/register", {
        ...assistantAdminForm,
        role: "assistant_admin",
      });
      toast.success("Assistant Admin created successfully");
      setAssistantAdminForm({ email: "", password: "", full_name: "", id_number: "" });
      setAssistantAdminDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create assistant admin");
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipant.email || !newParticipant.password || !newParticipant.full_name || !newParticipant.id_number) {
      toast.error("Please fill all required fields (name, email, password, ID number)");
      return;
    }
    setSessionForm({
      ...sessionForm,
      participants: [...sessionForm.participants, { ...newParticipant }],
    });
    setNewParticipant({ email: "", password: "", full_name: "", id_number: "", phone_number: "" });
    setParticipantMatchStatus(null);
    
    if (participantMatchStatus?.exists) {
      toast.success(`✓ Existing participant "${newParticipant.full_name}" will be linked to this session`);
    } else {
      toast.success(`New participant "${newParticipant.full_name}" added to list`);
    }
  };

  const handleAddSupervisor = () => {
    if (!newSupervisor.email || !newSupervisor.password || !newSupervisor.full_name || !newSupervisor.id_number) {
      toast.error("Please fill all required fields (name, email, password, ID number)");
      return;
    }
    setSessionForm({
      ...sessionForm,
      supervisors: [...sessionForm.supervisors, { ...newSupervisor }],
    });
    setNewSupervisor({ email: "", password: "", full_name: "", id_number: "", phone_number: "" });
    setSupervisorMatchStatus(null);
    
    if (supervisorMatchStatus?.exists) {
      toast.success(`✓ Existing supervisor "${newSupervisor.full_name}" will be linked to this session`);
    } else {
      toast.success(`New supervisor "${newSupervisor.full_name}" added to list`);
    }
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

      const response = await axiosInstance.post("/sessions", {
        name: program.name,
        program_id: sessionForm.program_id,
        company_id: sessionForm.company_id,
        location: sessionForm.location,
        start_date: sessionForm.start_date,
        end_date: sessionForm.end_date,
        participant_ids: [],  // No pre-selected participants
        participants: sessionForm.participants,
        supervisor_ids: [],  // No pre-selected supervisors
        supervisors: sessionForm.supervisors,
        trainer_assignments: sessionForm.trainer_assignments,
        coordinator_id: sessionForm.coordinator_id || null,
      });

      // Show results of participant/supervisor matching
      let successMessage = `Session created successfully!`;
      if (response.data.participant_results && response.data.participant_results.length > 0) {
        const existingCount = response.data.participant_results.filter(p => p.is_existing).length;
        const newCount = response.data.participant_results.filter(p => !p.is_existing).length;
        if (existingCount > 0) {
          successMessage += ` Linked ${existingCount} existing participant(s).`;
        }
        if (newCount > 0) {
          successMessage += ` Created ${newCount} new participant(s).`;
        }
      }
      if (response.data.supervisor_results && response.data.supervisor_results.length > 0) {
        const existingCount = response.data.supervisor_results.filter(s => s.is_existing).length;
        const newCount = response.data.supervisor_results.filter(s => !s.is_existing).length;
        if (existingCount > 0) {
          successMessage += ` Linked ${existingCount} existing supervisor(s).`;
        }
        if (newCount > 0) {
          successMessage += ` Created ${newCount} new supervisor(s).`;
        }
      }

      toast.success(successMessage);
      setSessionForm({
        program_id: "",
        company_id: "",
        location: "",
        start_date: "",
        end_date: "",
        participants: [],
        supervisors: [],
        trainer_assignments: [],
        coordinator_id: "",
      });
      setSessionDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Session creation error:", error);
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
  const assistantAdmins = users.filter((u) => u.role === "assistant_admin");

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
      } else if (type === "session") {
        await axiosInstance.delete(`/sessions/${item.id}`);
        toast.success("Session deleted successfully");
      } else if (type === "trainer" || type === "coordinator" || type === "assistant_admin" || type === "user") {
        await axiosInstance.delete(`/users/${item.id}`);
        toast.success(`${type.replace('_', ' ')} deleted successfully`);
      }
      
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete item");
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus ? "deactivate" : "activate";
      await axiosInstance.put(`/users/${userId}/${endpoint}`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update user status");
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setEditStaffForm({
      full_name: staff.full_name,
      email: staff.email,
      id_number: staff.id_number,
    });
    setEditStaffDialogOpen(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/users/${editingStaff.id}`, editStaffForm);
      toast.success(`${editingStaff.role.replace('_', ' ')} updated successfully`);
      setEditStaffDialogOpen(false);
      setEditingStaff(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update staff member");
    }
  };



  // Reports Archive functions
  const loadAllReports = async () => {
    setLoadingReports(true);
    try {
      const params = {};
      
      if (reportsSearch) params.search = reportsSearch;
      if (filterCompany && filterCompany !== "all") params.company_id = filterCompany;
      if (filterProgram && filterProgram !== "all") params.program_id = filterProgram;
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;
      
      const response = await axiosInstance.get("/training-reports/admin/all", { params });
      setAllReports(response.data.reports || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error(error.response?.data?.detail || "Failed to load training reports");
    } finally {
      setLoadingReports(false);
    }
  };


  // Certificates Repository functions
  const loadAllCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const response = await axiosInstance.get("/certificates/repository");
      setAllCertificates(response.data || []);
    } catch (error) {
      console.error("Failed to load certificates:", error);
      toast.error(error.response?.data?.detail || "Failed to load certificates");
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleDownloadCertificate = async (certificateUrl, participantName) => {
    try {
      // Extract session_id and participant_id from URL if needed, or use direct URL
      const response = await axiosInstance.get(certificateUrl, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${participantName.replace(/\s+/g, '_')}_certificate.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Certificate downloaded!");
    } catch (error) {
      toast.error("Failed to download certificate");
    }
  };


  const handleDownloadReportPDF = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/training-reports/${sessionId}/download-pdf`, {
        responseType: 'blob'
      });
      
      // Create blob with proper MIME type
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Training_Report_${sessionId}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Report PDF downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.response?.data?.detail || "Failed to download report");
    }
  };

  const handleViewReportDetails = (report) => {
    setSelectedReport(report);
    setReportDetailsOpen(true);
  };

  // Load reports when Reports tab is selected
  useEffect(() => {
    if (activeTab === "reports" && allReports.length === 0) {
      loadAllReports();
    }
  }, [activeTab]);

  const handleCreateChecklistTemplate = async (e) => {
    e.preventDefault();
    if (!checklistForm.program_id || checklistForm.items.filter(i => i.trim()).length === 0) {
      toast.error("Please add a checklist item");
      return;
    }
    
    try {
      // Check if template exists for this program
      const existingTemplate = checklistTemplates.find(t => t.program_id === checklistForm.program_id);
      
      if (existingTemplate) {
        // Update existing template by adding new items
        const updatedItems = [...existingTemplate.items, ...checklistForm.items.filter(i => i.trim())];
        await axiosInstance.put(`/checklist-templates/${existingTemplate.id}`, {
          program_id: checklistForm.program_id,
          items: updatedItems
        });
        toast.success("Checklist item added successfully");
      } else {
        // Create new template
        await axiosInstance.post("/checklist-templates", {
          program_id: checklistForm.program_id,
          items: checklistForm.items.filter(i => i.trim())
        });
        toast.success("Checklist item added successfully");
      }
      
      setChecklistDialogOpen(false);
      setChecklistForm({ program_id: "", items: [""] });
      loadChecklistTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add checklist item");
    }
  };

  const handleAddChecklistItem = () => {
    setChecklistForm({ ...checklistForm, items: [...checklistForm.items, ""] });
  };

  const handleRemoveChecklistItem = (index) => {
    const newItems = checklistForm.items.filter((_, i) => i !== index);
    setChecklistForm({ ...checklistForm, items: newItems });
  };

  const handleChecklistItemChange = (index, value) => {
    const newItems = [...checklistForm.items];
    newItems[index] = value;
    setChecklistForm({ ...checklistForm, items: newItems });
  };

  const handleDeleteChecklistTemplate = async (templateId) => {
    try {
      await axiosInstance.delete(`/checklist-templates/${templateId}`);
      toast.success("Checklist template deleted");
      loadChecklistTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete template");
    }
  };

  const handleDeleteChecklistItem = async (templateId, itemIndex) => {
    try {
      const template = checklistTemplates.find(t => t.id === templateId);
      if (!template) {
        toast.error("Template not found");
        return;
      }
      
      // Remove the item at the specified index
      const updatedItems = template.items.filter((_, idx) => idx !== itemIndex);
      
      // If no items left, delete the template
      if (updatedItems.length === 0) {
        await axiosInstance.delete(`/checklist-templates/${templateId}`);
        toast.success("Last item removed. Template deleted.");
      } else {
        // Update template with remaining items
        await axiosInstance.put(`/checklist-templates/${templateId}`, {
          program_id: template.program_id,
          items: updatedItems
        });
        toast.success("Checklist item deleted");
      }
      
      loadChecklistTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete checklist item");
    }
  };

  const handleResetUserPassword = async (e) => {
    e.preventDefault();
    
    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPasswordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await axiosInstance.post("/auth/reset-password", {
        email: resetPasswordUser.email,
        new_password: newPasswordForm.newPassword
      });
      
      toast.success(`Password reset successfully for ${resetPasswordUser.full_name}`);
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setNewPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor}10, ${secondaryColor}10, ${primaryColor}05)`
      }}
    >
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
          <TabsList className="grid w-full grid-cols-9 mb-8">
            <TabsTrigger value="programs" data-testid="programs-tab">
              <BookOpen className="w-4 h-4 mr-2" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="companies" data-testid="companies-tab">
              <Building2 className="w-4 h-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="sessions-tab">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="reports-tab">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="staff" data-testid="staff-tab">
              <UserCog className="w-4 h-4 mr-2" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="certificates" data-testid="certificates-tab">
              <Award className="w-4 h-4 mr-2" />
              Certificates
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
                      <div key={program.id} className="mb-4">
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle>{program.name}</CardTitle>
                                {program.description && (
                                  <CardDescription>{program.description}</CardDescription>
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
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditProgram(program)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick("program", program)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedProgram(selectedProgram?.id === program.id ? null : program)}
                              >
                                <ClipboardList className="w-4 h-4 mr-2" />
                                Manage Tests & Checklists
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (selectedProgram?.id === program.id) {
                                    setSelectedProgram(null);
                                  } else {
                                    setSelectedProgram(program);
                                    // Auto switch to feedback tab if needed
                                    setTimeout(() => {
                                      const feedbackTab = document.querySelector(`[data-program-id="${program.id}"] [value="feedback-form"]`);
                                      if (feedbackTab) feedbackTab.click();
                                    }, 100);
                                  }
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Manage Feedback Form
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Expandable Management Section */}
                        {selectedProgram?.id === program.id && (
                          <Card className="mt-2 border-l-4 border-blue-500">
                            <CardContent className="pt-6">
                              <Tabs defaultValue="tests" className="w-full" data-program-id={program.id}>
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                  <TabsTrigger value="tests">
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    Tests
                                  </TabsTrigger>
                                  <TabsTrigger value="checklists">
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    Checklists
                                  </TabsTrigger>
                                  <TabsTrigger value="feedback-form">
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
                                <TabsContent value="feedback-form">
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
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

                        {/* Add Supervisor (Optional) */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold text-lg">Add Supervisor (Optional)</h3>
                          
                          {/* Match Status Indicator */}
                          {supervisorMatchStatus?.exists && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                              <p className="font-semibold text-blue-800">✓ Existing supervisor found</p>
                              <p className="text-blue-600 mt-1">
                                {supervisorMatchStatus.user.full_name} ({supervisorMatchStatus.user.email})
                                <br />
                                Will be linked to this session and data will be updated.
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="supervisor-name">Full Name</Label>
                              <Input
                                id="supervisor-name"
                                value={newSupervisor.full_name}
                                onChange={(e) => setNewSupervisor({ ...newSupervisor, full_name: e.target.value })}
                                placeholder="Supervisor Name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="supervisor-id">ID Number</Label>
                              <Input
                                id="supervisor-id"
                                value={newSupervisor.id_number}
                                onChange={(e) => setNewSupervisor({ ...newSupervisor, id_number: e.target.value })}
                                placeholder="ID123456"
                              />
                            </div>
                            <div>
                              <Label htmlFor="supervisor-email">Email</Label>
                              <Input
                                id="supervisor-email"
                                type="email"
                                value={newSupervisor.email}
                                onChange={(e) => setNewSupervisor({ ...newSupervisor, email: e.target.value })}
                                placeholder="supervisor@example.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="supervisor-phone">Phone Number</Label>
                              <Input
                                id="supervisor-phone"
                                type="tel"
                                value={newSupervisor.phone_number}
                                onChange={(e) => setNewSupervisor({ ...newSupervisor, phone_number: e.target.value })}
                                placeholder="+1234567890"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="supervisor-password">Password</Label>
                              <Input
                                id="supervisor-password"
                                type="password"
                                value={newSupervisor.password}
                                onChange={(e) => setNewSupervisor({ ...newSupervisor, password: e.target.value })}
                                placeholder="Password"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddSupervisor}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {supervisorMatchStatus?.exists ? "Link Existing Supervisor" : "Add New Supervisor"}
                          </Button>

                          {/* Show added supervisors */}
                          {sessionForm.supervisors.length > 0 && (
                            <div className="space-y-2 border-t pt-4 mt-4">
                              <h4 className="font-semibold text-sm text-gray-700">
                                Supervisors to Add ({sessionForm.supervisors.length})
                              </h4>
                              {sessionForm.supervisors.map((sup, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-3 bg-purple-50 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium text-sm">{sup.full_name}</p>
                                    <p className="text-xs text-gray-600">
                                      {sup.email} • ID: {sup.id_number}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = sessionForm.supervisors.filter((_, i) => i !== index);
                                      setSessionForm({ ...sessionForm, supervisors: updated });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Participants */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold text-lg">Add Participants</h3>
                          <p className="text-sm text-gray-600">
                            Type participant details below. System will automatically link existing users if name, email, or ID number matches.
                          </p>
                          
                          {/* Match Status Indicator */}
                          {participantMatchStatus?.exists && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                              <p className="font-semibold text-blue-800">✓ Existing participant found</p>
                              <p className="text-blue-600 mt-1">
                                {participantMatchStatus.user.full_name} ({participantMatchStatus.user.email})
                                <br />
                                Will be linked to this session and data will be updated.
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="participant-name">Full Name *</Label>
                              <Input
                                id="participant-name"
                                data-testid="participant-name-input"
                                value={newParticipant.full_name}
                                onChange={(e) => setNewParticipant({ ...newParticipant, full_name: e.target.value })}
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="participant-id">ID Number *</Label>
                              <Input
                                id="participant-id"
                                data-testid="participant-id-input"
                                value={newParticipant.id_number}
                                onChange={(e) => setNewParticipant({ ...newParticipant, id_number: e.target.value })}
                                placeholder="ID123456"
                              />
                            </div>
                            <div>
                              <Label htmlFor="participant-email">Email *</Label>
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
                              <Label htmlFor="participant-phone">Phone Number</Label>
                              <Input
                                id="participant-phone"
                                data-testid="participant-phone-input"
                                type="tel"
                                value={newParticipant.phone_number}
                                onChange={(e) => setNewParticipant({ ...newParticipant, phone_number: e.target.value })}
                                placeholder="+1234567890"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="participant-password">Password *</Label>
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
                            {participantMatchStatus?.exists ? "Link Existing Participant" : "Add New Participant"}
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
                                <div className="flex gap-2">
                                  <Button
                                    data-testid={`edit-session-${session.id}`}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSession(session)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    data-testid={`delete-session-${session.id}`}
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteClick("session", session)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
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


          {/* Reports Archive Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Training Reports Archive</CardTitle>
                <CardDescription>
                  Search and access all submitted training reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by session name, coordinator, company, program, location..."
                        value={reportsSearch}
                        onChange={(e) => setReportsSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button onClick={loadAllReports} variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select value={filterCompany} onValueChange={setFilterCompany}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />

                    <Input
                      type="date"
                      placeholder="End Date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>

                  {allReports.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Found {allReports.length} training report{allReports.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Reports Grid */}
                {loadingReports ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : allReports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No training reports found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Reports will appear here once coordinators submit them
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allReports.map((report) => (
                      <Card key={report.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{report.session_name}</CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              {report.company_name}
                            </div>
                            <div className="flex items-center text-xs">
                              <Book className="w-3 h-3 mr-1" />
                              {report.program_name}
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Coordinator:</span>
                              <span className="font-medium">{report.coordinator_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Location:</span>
                              <span className="font-medium">{report.session_location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dates:</span>
                              <span className="font-medium text-xs">
                                {report.session_start_date} to {report.session_end_date}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Participants:</span>
                              <span className="font-medium">{report.participant_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Submitted:</span>
                              <span className="font-medium text-xs">
                                {new Date(report.submitted_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t space-y-2">
                            <Button
                              onClick={() => handleDownloadReportPDF(report.session_id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                            <Button
                              onClick={() => handleViewReportDetails(report)}
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Details Dialog */}
            <Dialog open={reportDetailsOpen} onOpenChange={setReportDetailsOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Training Report Details</DialogTitle>
                  <DialogDescription>
                    {selectedReport?.session_name}
                  </DialogDescription>
                </DialogHeader>
                {selectedReport && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Company</p>
                        <p className="text-sm">{selectedReport.company_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Program</p>
                        <p className="text-sm">{selectedReport.program_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Location</p>
                        <p className="text-sm">{selectedReport.session_location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Coordinator</p>
                        <p className="text-sm">{selectedReport.coordinator_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Training Period</p>
                        <p className="text-sm">
                          {selectedReport.session_start_date} to {selectedReport.session_end_date}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Participants</p>
                        <p className="text-sm">{selectedReport.participant_count} participants</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Submitted Date</p>
                        <p className="text-sm">
                          {new Date(selectedReport.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Status</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {selectedReport.status}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Files</p>
                      <div className="space-y-2">
                        {selectedReport.pdf_filename && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-red-600 mr-2" />
                              <span className="text-sm font-medium">Final Report (PDF)</span>
                            </div>
                            <Button
                              onClick={() => handleDownloadReportPDF(selectedReport.session_id)}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                        {selectedReport.docx_filename && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="text-sm font-medium">Original Report (DOCX)</span>
                            </div>
                            <span className="text-xs text-gray-500">{selectedReport.docx_filename}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Staff Tab - Unified Staff Management */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Manage all staff members (Coordinators, Assistant Admins, Trainers)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  {/* Coordinators Section */}
                  <Card className="border-2 border-purple-200">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">Coordinators</CardTitle>
                          <CardDescription>Manage training coordinators ({coordinators.length} total)</CardDescription>
                        </div>
                        <Dialog open={coordinatorDialogOpen} onOpenChange={setCoordinatorDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="create-coordinator-button">
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
                    <CardContent className="pt-4">
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
                              <div className="flex gap-2">
                                <Button
                                  data-testid={`edit-coordinator-${coordinator.id}`}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditStaff(coordinator)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  data-testid={`delete-coordinator-${coordinator.id}`}
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick("coordinator", coordinator)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assistant Admins Section */}
                  <Card className="border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">Assistant Admins</CardTitle>
                          <CardDescription>Manage assistant administrators ({assistantAdmins.length} total)</CardDescription>
                        </div>
                        <Dialog open={assistantAdminDialogOpen} onOpenChange={setAssistantAdminDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="create-assistant-admin-button">
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Assistant Admin
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Assistant Admin</DialogTitle>
                              <DialogDescription>
                                Add an assistant admin account
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateAssistantAdmin} className="space-y-4">
                              <div>
                                <Label htmlFor="assistant-admin-name">Full Name *</Label>
                                <Input
                                  id="assistant-admin-name"
                                  data-testid="assistant-admin-name-input"
                                  value={assistantAdminForm.full_name}
                                  onChange={(e) => setAssistantAdminForm({ ...assistantAdminForm, full_name: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="assistant-admin-id">ID Number *</Label>
                                <Input
                                  id="assistant-admin-id"
                                  data-testid="assistant-admin-id-input"
                                  value={assistantAdminForm.id_number}
                                  onChange={(e) => setAssistantAdminForm({ ...assistantAdminForm, id_number: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="assistant-admin-email">Email *</Label>
                                <Input
                                  id="assistant-admin-email"
                                  data-testid="assistant-admin-email-input"
                                  type="email"
                                  value={assistantAdminForm.email}
                                  onChange={(e) => setAssistantAdminForm({ ...assistantAdminForm, email: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="assistant-admin-password">Password *</Label>
                                <Input
                                  id="assistant-admin-password"
                                  data-testid="assistant-admin-password-input"
                                  type="password"
                                  value={assistantAdminForm.password}
                                  onChange={(e) => setAssistantAdminForm({ ...assistantAdminForm, password: e.target.value })}
                                  required
                                />
                              </div>
                              <Button data-testid="submit-assistant-admin-button" type="submit" className="w-full">
                                Create Assistant Admin
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {assistantAdmins.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No assistant admins yet</p>
                        ) : (
                          assistantAdmins.map((assistantAdmin) => (
                            <div
                              key={assistantAdmin.id}
                              data-testid={`assistant-admin-item-${assistantAdmin.id}`}
                              className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:bg-blue-100 transition-colors flex justify-between items-start"
                            >
                              <div>
                                <h3 className="font-semibold text-gray-900">{assistantAdmin.full_name}</h3>
                                <p className="text-sm text-gray-600">{assistantAdmin.email}</p>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Assistant Admin
                                  </span>
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    ID: {assistantAdmin.id_number}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  data-testid={`edit-assistant-admin-${assistantAdmin.id}`}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditStaff(assistantAdmin)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  data-testid={`delete-assistant-admin-${assistantAdmin.id}`}
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick("assistant_admin", assistantAdmin)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trainers Section */}
                  <Card className="border-2 border-orange-200">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">Trainers</CardTitle>
                          <CardDescription>Create trainer accounts (roles assigned per session) ({trainers.length} total)</CardDescription>
                        </div>
                        <Dialog open={trainerDialogOpen} onOpenChange={setTrainerDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="create-trainer-button">
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
                    <CardContent className="pt-4">
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
                              <div className="flex gap-2">
                                <Button
                                  data-testid={`edit-trainer-${trainer.id}`}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditStaff(trainer)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  data-testid={`delete-trainer-${trainer.id}`}
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick("trainer", trainer)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trainers Tab */}
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
                                  <span className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setResetPasswordUser(u);
                                    setResetPasswordDialogOpen(true);
                                  }}
                                  data-testid={`reset-password-${u.id}`}
                                >
                                  <UserCog className="w-4 h-4 mr-1" />
                                  Reset Password
                                </Button>
                                <Button
                                  size="sm"
                                  variant={u.is_active ? "outline" : "default"}
                                  onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                                  data-testid={`toggle-status-${u.id}`}
                                >
                                  {u.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick("user", u)}
                                  data-testid={`delete-user-${u.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
                                    <span className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setResetPasswordUser(u);
                                      setResetPasswordDialogOpen(true);
                                    }}
                                    data-testid={`reset-password-${u.id}`}
                                  >
                                    <UserCog className="w-4 h-4 mr-1" />
                                    Reset Password
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={u.is_active ? "outline" : "default"}
                                    onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                                    data-testid={`toggle-status-${u.id}`}
                                  >
                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteClick("user", u)}
                                    data-testid={`delete-user-${u.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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

          {/* Feedback Tab */}
          {/* Checklist Templates Tab */}
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Settings />
          </TabsContent>


          {/* Certificates Repository Tab */}
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Certificates Repository</CardTitle>
                    <CardDescription>View all uploaded participant certificates</CardDescription>
                  </div>
                  <Button onClick={loadAllCertificates} disabled={loadingCertificates}>
                    {loadingCertificates ? "Loading..." : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by participant name, ID number, or email..."
                        value={certificatesSearch}
                        onChange={(e) => setCertificatesSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Select value={filterCertSession} onValueChange={setFilterCertSession}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by Session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterCertProgram} onValueChange={setFilterCertProgram}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.name}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {(certificatesSearch || filterCertSession !== "all" || filterCertProgram !== "all") && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setCertificatesSearch("");
                          setFilterCertSession("all");
                          setFilterCertProgram("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* Certificates Table */}
                {loadingCertificates ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading certificates...</p>
                  </div>
                ) : allCertificates.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No certificates uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-2">Certificates will appear here once coordinators upload them</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-semibold">Participant</th>
                          <th className="text-left p-3 font-semibold">ID Number</th>
                          <th className="text-left p-3 font-semibold">Session</th>
                          <th className="text-left p-3 font-semibold">Program</th>
                          <th className="text-left p-3 font-semibold">Company</th>
                          <th className="text-left p-3 font-semibold">Upload Date</th>
                          <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCertificates
                          .filter((cert) => {
                            // Search filter
                            const searchLower = certificatesSearch.toLowerCase();
                            const matchesSearch = !certificatesSearch || 
                              cert.participant_name?.toLowerCase().includes(searchLower) ||
                              cert.participant_id_number?.toLowerCase().includes(searchLower) ||
                              cert.participant_email?.toLowerCase().includes(searchLower);
                            
                            // Session filter
                            const matchesSession = filterCertSession === "all" || cert.session_id === filterCertSession;
                            
                            // Program filter
                            const matchesProgram = filterCertProgram === "all" || cert.program_name === filterCertProgram;
                            
                            return matchesSearch && matchesSession && matchesProgram;
                          })
                          .map((cert, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-gray-900">{cert.participant_name}</p>
                                  <p className="text-xs text-gray-500">{cert.participant_email}</p>
                                </div>
                              </td>
                              <td className="p-3 text-gray-700">{cert.participant_id_number}</td>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-gray-900">{cert.session_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {cert.session_start_date} to {cert.session_end_date}
                                  </p>
                                </div>
                              </td>
                              <td className="p-3 text-gray-700">{cert.program_name}</td>
                              <td className="p-3 text-gray-700">{cert.company_name}</td>
                              <td className="p-3 text-gray-700">
                                {cert.uploaded_at ? new Date(cert.uploaded_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownloadCertificate(cert.certificate_url, cert.participant_name)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}${cert.certificate_url}`, '_blank')}
                                  >
                                    View
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    
                    {/* Summary */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Total Certificates:</span> {allCertificates.length}
                        {certificatesSearch || filterCertSession !== "all" || filterCertProgram !== "all" ? (
                          <span className="ml-2">
                            | <span className="font-semibold">Filtered:</span> {
                              allCertificates.filter((cert) => {
                                const searchLower = certificatesSearch.toLowerCase();
                                const matchesSearch = !certificatesSearch || 
                                  cert.participant_name?.toLowerCase().includes(searchLower) ||
                                  cert.participant_id_number?.toLowerCase().includes(searchLower) ||
                                  cert.participant_email?.toLowerCase().includes(searchLower);
                                const matchesSession = filterCertSession === "all" || cert.session_id === filterCertSession;
                                const matchesProgram = filterCertProgram === "all" || cert.program_name === filterCertProgram;
                                return matchesSearch && matchesSession && matchesProgram;
                              }).length
                            }
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Edit Program Dialog */}
      {editingProgram && (
        <Dialog open={editProgramDialogOpen} onOpenChange={setEditProgramDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Program</DialogTitle>
              <DialogDescription>Update program details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Program Name</Label>
                <Input
                  value={editingProgram.name}
                  onChange={(e) => setEditingProgram({ ...editingProgram, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingProgram.description || ""}
                  onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Pass Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingProgram.pass_percentage}
                  onChange={(e) => setEditingProgram({ ...editingProgram, pass_percentage: parseFloat(e.target.value) })}
                />
              </div>
              <Button onClick={handleUpdateProgram} className="w-full">
                Update Program
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Company Dialog */}
      {editingCompany && (
        <Dialog open={editCompanyDialogOpen} onOpenChange={setEditCompanyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>Update company name</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateCompany} className="w-full">
                Update Company
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Are you sure you want to delete this {deleteTarget.type}?
                  <br />
                  <strong>{deleteTarget.item.name || deleteTarget.item.full_name}</strong>
                  <br />
                  <span className="text-red-600">This action cannot be undone.</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <h3 className="font-semibold mb-3">Current Participants ({editingSession.participant_ids.length})</h3>
                {editingSession.participant_ids.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {editingSession.participant_ids.map((pid) => {
                      const participant = users.find(u => u.id === pid);
                      if (!participant) return null;
                      return (
                        <div key={pid} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{participant.full_name}</p>
                            <p className="text-xs text-gray-600">
                              {participant.email} • ID: {participant.id_number}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Remove participant from session
                              const updated = editingSession.participant_ids.filter(id => id !== pid);
                              setEditingSession({ ...editingSession, participant_ids: updated });
                              toast.success(`${participant.full_name} will be removed from this session`);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No participants yet. Add some above.</p>
                )}
              </div>

              <Button onClick={handleUpdateSession} className="w-full">
                Update Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.full_name} ({resetPasswordUser?.email})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetUserPassword} className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPasswordForm.newPassword}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, newPassword: e.target.value })}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={newPasswordForm.confirmPassword}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setResetPasswordUser(null);
                  setNewPasswordForm({ newPassword: "", confirmPassword: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
              >
                Reset Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
