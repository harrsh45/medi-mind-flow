
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Bell, Plus, Clock, Calendar, AlarmClock, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import GsapReveal from "@/components/GsapReveal";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const reminders = [
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
  const [activeTab, setActiveTab] = useState("all");
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newMedicine, setNewMedicine] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);

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
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredReminders.map((reminder, index) => (
              <GsapReveal key={reminder.id} animation="slide" delay={0.1 * index}>
                <MediCard neumorphic>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-medical-teal/10 flex items-center justify-center mr-3">
                        <AlarmClock className="w-5 h-5 text-medical-teal" />
                      </div>
                      <div>
                        <h3 className="font-medium">{reminder.medicationName}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{reminder.time}</span>
                          <span className="mx-1">•</span>
                          <span>{reminder.days.length === 7 ? "Daily" : reminder.days.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <Switch checked={reminder.enabled} />
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
                    onClick={() => setShowAddReminder(false)}
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
    </div>
  );
};

export default Reminders;
