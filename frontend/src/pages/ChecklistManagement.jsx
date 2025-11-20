import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardList } from "lucide-react";

const ChecklistManagement = ({ program }) => {
  const [checklistTemplates, setChecklistTemplates] = useState([]);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    if (program) {
      loadChecklistTemplates();
    }
  }, [program]);

  const loadChecklistTemplates = async () => {
    try {
      const response = await axiosInstance.get("/checklist-templates");
      setChecklistTemplates(response.data);
    } catch (error) {
      console.error("Failed to load checklist templates:", error);
    }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    
    if (!newChecklistItem.trim()) {
      toast.error("Please enter a checklist item");
      return;
    }

    try {
      await axiosInstance.post("/checklist-templates", {
        program_id: program.id,
        items: [newChecklistItem.trim()]
      });
      
      toast.success("Checklist item added successfully");
      setNewChecklistItem("");
      setChecklistDialogOpen(false);
      loadChecklistTemplates();
    } catch (error) {
      toast.error("Failed to add checklist item");
      console.error(error);
    }
  };

  const handleDeleteChecklistItem = async (templateId, itemIndex) => {
    try {
      await axiosInstance.delete(`/checklist-templates/${templateId}/items/${itemIndex}`);
      toast.success("Checklist item deleted");
      loadChecklistTemplates();
    } catch (error) {
      toast.error("Failed to delete checklist item");
      console.error(error);
    }
  };

  const currentTemplate = checklistTemplates.find(t => t.program_id === program.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Vehicle Inspection Checklist Items</CardTitle>
            <CardDescription>
              Manage checklist items for {program.name}
            </CardDescription>
          </div>
          <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Checklist Item</DialogTitle>
                <DialogDescription>
                  Add a new item to the vehicle inspection checklist
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddChecklistItem} className="space-y-4">
                <div>
                  <Label htmlFor="checklist-item">Item Name</Label>
                  <Input
                    id="checklist-item"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="e.g., Brakes, Lights, Tires, Horn"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Item
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!currentTemplate || currentTemplate.items.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No checklist items yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Add inspection items using the button above
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentTemplate.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 bg-white px-3 py-1 rounded">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900">{item}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChecklistItem(currentTemplate.id, idx)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChecklistManagement;
