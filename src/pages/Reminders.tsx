import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Bell, Plus, Clock, Calendar, AlarmClock, CheckCircle, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import GsapReveal from "@/components/GsapReveal";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Move the mock data outside as initial data
const initialReminders = [
  {
    id: 1,
    medicationName: "Lisinopril",
    time: "8:00 AM",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enabled: true,
  },
  {
    id: 2,
    medicationName: "Metformin",
    time: "1:00 PM",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enabled: true,
  },
  {
    id: 3,
    medicationName: "Metformin",
    time: "7:00 PM",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enabled: true,
  },
  {
    id: 4,
    medicationName: "Atorvastatin",
    time: "9:00 PM",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enabled: true,
  },
];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Reminders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newMedicine, setNewMedicine] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [reminders, setReminders] = useState(initialReminders);
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  const goBack = () => navigate(-1);
  
  // Filter reminders based on active tab
  const filteredReminders = reminders.filter(reminder => {
    if (activeTab === "all") return true;
    if (activeTab === "morning") return reminder.time.includes("AM");
    if (activeTab === "afternoon") return reminder.time.includes("PM") && parseInt(reminder.time) < 6;
    if (activeTab === "evening") return reminder.time.includes("PM") && parseInt(reminder.time) >= 6;
    return true;
  });
  
  const handleSaveReminder = () => {
    if (!newMedicine.trim()) {
      toast({
        title: "Error",
        description: "Please enter a medication name",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    // Convert 24h time to 12h format
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    const newReminder = {
      id: reminders.length + 1,
      medicationName: newMedicine,
      time: formatTime(newTime),
      days: selectedDays,
      enabled: true,
    };

    setReminders(prev => [...prev, newReminder]);
    
    // Reset form
    setNewMedicine("");
    setNewTime("08:00");
    setSelectedDays(["Mon", "Wed", "Fri"]);
    setShowAddReminder(false);

    toast({
      title: "Success",
      description: "Reminder added successfully",
      className: "bg-medical-teal text-white",
    });
  };

  // Add function to handle toggle reminder enabled status
  const toggleReminderStatus = (id: number) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
      )
    );
    
    // Get the reminder that was toggled
    const reminder = reminders.find(r => r.id === id);
    const status = reminder?.enabled ? 'disabled' : 'enabled';
    
    toast({
      description: `Reminder for ${reminder?.medicationName} ${status}`,
      className: status === 'enabled' ? "bg-medical-teal text-white" : "bg-slate-700 text-white",
    });
  };
  
  // Add function to handle reminder deletion
  const handleDeleteReminder = () => {
    if (reminderToDelete === null) return;
    
    const reminderName = reminders.find(r => r.id === reminderToDelete)?.medicationName;
    
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderToDelete));
    setReminderToDelete(null);
    
    toast({
      description: `Reminder for ${reminderName} deleted`,
      className: "bg-destructive text-destructive-foreground",
    });
  };

  return (
    <div className="min-h-screen pb-6">
      <header className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <span className="ml-2">Back</span>
        </Button>
        <h1 className="text-xl font-bold">Medication Reminders</h1>
        <Button variant="ghost" onClick={() => setShowAddReminder(true)}>
          <Plus className="w-5 h-5" />
        </Button>
      </header>
      
      <div className="p-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="morning">Morning</TabsTrigger>
            <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
            <TabsTrigger value="evening">Evening</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-6">
            {filteredReminders.map((reminder, index) => (
              <GsapReveal key={reminder.id} animation="slide" delay={0.1 * index}>
                <MediCard neumorphic className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-full bg-medical-teal/20 flex items-center justify-center mr-4">
                        <AlarmClock className="w-7 h-7 text-medical-teal" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{reminder.medicationName}</h3>
                        <div className="flex flex-wrap items-center text-base text-muted-foreground">
                          <div className="flex items-center mr-3">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="font-medium">{reminder.time}</span>
                          </div>
                          <span className="mx-1 hidden md:inline">•</span>
                          <div className="mt-1 md:mt-0">
                            <span>{reminder.days.length === 7 ? "Every day" : reminder.days.join(", ")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-0">
                      <div className="flex items-center">
                        <span className="mr-2 text-sm font-medium text-muted-foreground">
                          {reminder.enabled ? "Active" : "Inactive"}
                        </span>
                        <Switch 
                          checked={reminder.enabled} 
                          onCheckedChange={() => toggleReminderStatus(reminder.id)}
                          className="scale-125 data-[state=checked]:bg-medical-teal"
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setReminderToDelete(reminder.id)}
                      >
                        <Trash2 className="h-5 w-5 mr-1" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </MediCard>
              </GsapReveal>
            ))}
            
            {filteredReminders.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">No reminders</h3>
                <p className="text-muted-foreground">
                  You don't have any reminders for this time period
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Reminder Modal */}
      {showAddReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GsapReveal animation="scale">
            <MediCard className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Reminder</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setShowAddReminder(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medication Name</label>
                  <Input 
                    placeholder="Enter medication name" 
                    value={newMedicine}
                    onChange={(e) => setNewMedicine(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
                    <Input 
                      type="time" 
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={selectedDays.includes(day) ? "default" : "outline"}
                        className={`w-10 h-10 p-0 ${
                          selectedDays.includes(day) 
                            ? "bg-medical-teal hover:bg-medical-teal/90" 
                            : ""
                        }`}
                        onClick={() => toggleDay(day)}
                      >
                        {day.substring(0, 1)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Alert Options</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>App Notification</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">📱</span>
                        <span>SMS Alert</span>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">👤</span>
                        <span>Caregiver Alert</span>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddReminder(false)}
                  >
                    Cancel
                  </Button>
                  <MediButton 
                    className="flex-1 bg-medical-teal hover:bg-medical-teal/90"
                    onClick={handleSaveReminder}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Reminder
                  </MediButton>
                </div>
              </div>
            </MediCard>
          </GsapReveal>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={reminderToDelete !== null} onOpenChange={() => setReminderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteReminder}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reminders;
