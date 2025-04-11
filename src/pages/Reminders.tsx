import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Bell, Plus, Clock, Calendar, AlarmClock, CheckCircle, X, Trash2, PillIcon, PhoneOutgoing } from "lucide-react";
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
import { format, parse, isAfter, isBefore, addMinutes, compareAsc } from "date-fns";
import { reminderApi } from "@/lib/api"; // Import the API service

// Type definitions
interface Reminder {
  id: number;
  medicationName: string;
  time: string;
  days: string[];
  enabled: boolean;
  whatsappEnabled?: boolean;
  phoneNumber?: string;
  _id?: string; // Backend ID
}

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

// Map weekday abbreviations to full names for date-fns
const weekdayMap: Record<string, number> = {
  "Mon": 1,
  "Tue": 2,
  "Wed": 3,
  "Thu": 4,
  "Fri": 5,
  "Sat": 6,
  "Sun": 0,
};

// Notification component that appears when it's time to take medicine
const MedicationAlert = ({ 
  reminder, 
  onTake, 
  onSnooze, 
  onDismiss 
}: { 
  reminder: any, 
  onTake: () => void, 
  onSnooze: () => void, 
  onDismiss: () => void 
}) => {
  // Play sound when alert appears
  useEffect(() => {
    // Create audio element
    const audio = new Audio("/notification-sound.mp3");
    audio.volume = 0.7;
    
    // Try to play - browsers might block this without user interaction
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Auto-play was prevented:", error);
      });
    }
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <MediCard className="w-full max-w-md p-6 shadow-xl animate-in slide-in-from-bottom-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-medical-teal/20 flex items-center justify-center mb-4">
            <PillIcon className="w-10 h-10 text-medical-teal" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Medication Reminder</h2>
          <p className="text-xl font-semibold text-medical-teal mb-1">{reminder.medicationName}</p>
          <p className="text-lg text-muted-foreground">It's time to take your medication</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <MediButton 
            className="w-full h-14 text-lg bg-medical-teal hover:bg-medical-teal/90"
            onClick={onTake}
          >
            <CheckCircle className="w-6 h-6 mr-2" />
            Take Now
          </MediButton>
          
          <Button 
            variant="outline"
            className="w-full h-12 text-base"
            onClick={onSnooze}
          >
            Remind Me in 15 Minutes
          </Button>
          
          <Button 
            variant="ghost"
            className="w-full h-12 text-base"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </MediCard>
    </div>
  );
};

const Reminders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newMedicine, setNewMedicine] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null);
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [snoozedReminders, setSnoozedReminders] = useState<any[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Reference to store timeout IDs so they can be cleared
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  
  // Load reminders from backend
  useEffect(() => {
    const loadReminders = async () => {
      try {
        setIsLoading(true);
        const backendReminders = await reminderApi.getAllReminders();
        
        if (backendReminders && backendReminders.length > 0) {
          // Transform backend reminders to frontend format
          const transformedReminders = backendReminders.map((item: any, index: number) => ({
            id: index + 1,
            _id: item._id,
            medicationName: item.name,
            time: item.time[0], // Assuming time is array in backend but string in frontend
            days: item.days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            enabled: item.enabled || true,
            whatsappEnabled: item.whatsappEnabled || false,
            phoneNumber: item.phoneNumber || "",
          }));
          
          setReminders(transformedReminders);
        }
      } catch (error) {
        console.error("Failed to load reminders:", error);
        toast({
          title: "Error",
          description: "Failed to load your reminders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReminders();
  }, [toast]);
  
  // Schedule all active reminders
  useEffect(() => {
    // Clear previous timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current = [];
    
    // Schedule enabled reminders
    const enabledReminders = reminders.filter(r => r.enabled);
    
    enabledReminders.forEach(reminder => {
      const today = new Date();
      const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];
      
      // Check if reminder is scheduled for today
      if (reminder.days.includes(dayOfWeek)) {
        // Parse reminder time
        const [timeString, period] = reminder.time.split(' ');
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num));
        
        // Convert to 24-hour format
        let hour24 = hours;
        if (period === 'PM' && hours < 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        
        // Create reminder date for today
        const reminderTime = new Date();
        reminderTime.setHours(hour24, minutes, 0, 0);
        
        // If reminder time is in the future for today, schedule it
        if (isAfter(reminderTime, today)) {
          const timeoutId = setTimeout(() => {
            // Show notification
            setActiveAlert(reminder);
            
            // Vibrate device if supported
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          }, reminderTime.getTime() - today.getTime());
          
          timeoutRefs.current.push(timeoutId);
        }
      }
    });
    
    // Also check snoozed reminders
    snoozedReminders.forEach(snoozed => {
      if (isAfter(snoozed.time, new Date())) {
        const timeoutId = setTimeout(() => {
          setActiveAlert(snoozed.reminder);
          
          // Remove from snoozed list
          setSnoozedReminders(prev => 
            prev.filter(s => s.reminder.id !== snoozed.reminder.id)
          );
          
          // Vibrate device if supported
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }, snoozed.time.getTime() - new Date().getTime());
        
        timeoutRefs.current.push(timeoutId);
      }
    });
  }, [reminders, snoozedReminders]);
  
  const handleTakeMedication = async () => {
    if (!activeAlert) return;
    
    toast({
      title: "Medication Taken",
      description: `You've marked ${activeAlert.medicationName} as taken.`,
      className: "bg-medical-teal text-white",
    });
    
    setActiveAlert(null);
  };
  
  const handleSnoozeMedication = () => {
    if (!activeAlert) return;
    
    // Create a time 15 minutes from now
    const snoozeTime = addMinutes(new Date(), 15);
    
    // Add to snoozed reminders
    setSnoozedReminders(prev => [
      ...prev, 
      { reminder: activeAlert, time: snoozeTime }
    ]);
    
    toast({
      description: `Reminder for ${activeAlert.medicationName} snoozed for 15 minutes.`,
      className: "bg-slate-700 text-white",
    });
    
    setActiveAlert(null);
  };
  
  const handleDismissMedication = () => {
    if (!activeAlert) return;
    
    toast({
      description: `Reminder dismissed for ${activeAlert.medicationName}.`,
      className: "bg-slate-700 text-white",
    });
    
    setActiveAlert(null);
  };

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
  
  const handleSaveReminder = async () => {
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

    try {
      setIsLoading(true);
      
      // Prepare data for backend
      const reminderData = {
        name: newMedicine,
        dosage: "1 pill", // Default value, modify as needed
        time: [formatTime(newTime)], // Backend expects array
        days: selectedDays,
        frequency: "daily",
        startDate: new Date(),
        notes: "",
        whatsappEnabled: whatsappEnabled,
        phoneNumber: phoneNumber || "",
      };
      
      // Save to backend
      const savedReminder = await reminderApi.createReminder(reminderData);
      
      // Add to local state
      const newReminder = {
        id: reminders.length + 1,
        _id: savedReminder._id,
        medicationName: newMedicine,
        time: formatTime(newTime),
        days: selectedDays,
        enabled: true,
        whatsappEnabled: whatsappEnabled,
        phoneNumber: phoneNumber,
      };

      setReminders(prev => [...prev, newReminder]);
      
      // Reset form
      setNewMedicine("");
      setNewTime("08:00");
      setSelectedDays(["Mon", "Wed", "Fri"]);
      setPhoneNumber("");
      setWhatsappEnabled(false);
      setShowAddReminder(false);

      toast({
        title: "Success",
        description: "Reminder added successfully" + (whatsappEnabled ? " with WhatsApp notifications" : ""),
        className: "bg-medical-teal text-white",
      });
      
      // For demo/testing purposes, schedule an immediate alert after 5 seconds
      const testTimeout = setTimeout(() => {
        setActiveAlert(newReminder);
        // Vibrate device if supported
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }, 5000);
      
      timeoutRefs.current.push(testTimeout);
    } catch (error) {
      console.error("Failed to save reminder:", error);
      toast({
        title: "Error",
        description: "Failed to save your reminder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to handle toggle reminder enabled status
  const toggleReminderStatus = async (id: number) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;
      
      // Update in backend
      if (reminder._id) {
        await reminderApi.toggleReminderStatus(reminder._id, !reminder.enabled);
      }
      
      // Update in local state
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
        )
      );
      
      // Get the reminder that was toggled
      const status = reminder.enabled ? 'disabled' : 'enabled';
      
      toast({
        description: `Reminder for ${reminder.medicationName} ${status}`,
        className: status === 'enabled' ? "bg-medical-teal text-white" : "bg-slate-700 text-white",
      });
    } catch (error) {
      console.error("Failed to toggle reminder status:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder status",
        variant: "destructive",
      });
    }
  };
  
  // Add function to handle reminder deletion
  const handleDeleteReminder = async () => {
    if (reminderToDelete === null) return;
    
    try {
      const reminderToRemove = reminders.find(r => r.id === reminderToDelete);
      if (!reminderToRemove) return;
      
      // Delete from backend
      if (reminderToRemove._id) {
        await reminderApi.deleteReminder(reminderToRemove._id);
      }
      
      // Remove from local state
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderToDelete));
      setReminderToDelete(null);
      
      toast({
        description: `Reminder for ${reminderToRemove.medicationName} deleted`,
        className: "bg-destructive text-destructive-foreground",
      });
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    }
  };

  // Toggle WhatsApp notifications
  const toggleWhatsApp = async (id: number, enabled: boolean) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;
      
      // Don't allow enabling WhatsApp without a phone number
      if (enabled && !reminder.phoneNumber) {
        toast({
          title: "Error",
          description: "Please add a phone number first",
          variant: "destructive",
        });
        return;
      }
      
      // Update in backend
      if (reminder._id) {
        await reminderApi.enableWhatsApp(
          reminder._id, 
          reminder.phoneNumber || "", 
          enabled
        );
      }
      
      // Update in local state
      setReminders(prev => 
        prev.map(r => 
          r.id === id ? { ...r, whatsappEnabled: enabled } : r
        )
      );
      
      toast({
        description: `WhatsApp notifications ${enabled ? 'enabled' : 'disabled'} for ${reminder.medicationName}`,
        className: enabled ? "bg-medical-teal text-white" : "bg-slate-700 text-white",
      });
    } catch (error) {
      console.error("Failed to toggle WhatsApp status:", error);
      toast({
        title: "Error",
        description: "Failed to update WhatsApp notification settings",
        variant: "destructive",
      });
    }
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
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-medical-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your reminders...</p>
              </div>
            ) : (
              <>
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
                          
                          {/* WhatsApp toggle button */}
                          <div className="flex items-center">
                            <span className="mr-2 text-sm font-medium text-muted-foreground flex items-center">
                              <PhoneOutgoing className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </span>
                            <Switch 
                              checked={reminder.whatsappEnabled || false} 
                              onCheckedChange={(checked) => toggleWhatsApp(reminder.id, checked)}
                              className="scale-125 data-[state=checked]:bg-green-500"
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
              </>
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
                        <PhoneOutgoing className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>WhatsApp Alert</span>
                      </div>
                      <Switch 
                        checked={whatsappEnabled}
                        onCheckedChange={setWhatsappEnabled}
                      />
                    </div>
                    
                    {/* Show phone number input if WhatsApp is enabled */}
                    {whatsappEnabled && (
                      <div className="pt-2">
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <Input 
                          placeholder="Enter phone number (e.g., 7400135663)" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          type="tel"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter your number without country code (App will add +91)
                        </p>
                      </div>
                    )}
                    
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
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <MediButton 
                    className="flex-1 bg-medical-teal hover:bg-medical-teal/90"
                    onClick={handleSaveReminder}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
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
      
      {/* Medication Alert */}
      {activeAlert && (
        <MedicationAlert 
          reminder={activeAlert}
          onTake={handleTakeMedication}
          onSnooze={handleSnoozeMedication}
          onDismiss={handleDismissMedication}
        />
      )}
    </div>
  );
};

export default Reminders;
