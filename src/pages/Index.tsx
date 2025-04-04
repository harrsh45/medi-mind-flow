
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, CheckCircle, Bell, FileText, MessageCircle } from "lucide-react";
import GsapReveal from "@/components/GsapReveal";
import MediCard from "@/components/MediCard";
import MediButton from "@/components/MediButton";
import NavBar from "@/components/NavBar";
import { Progress } from "@/components/ui/progress";

// Mock data
const medications = [
  {
    id: 1,
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    time: "8:00 AM",
    taken: true,
  },
  {
    id: 2,
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    time: "1:00 PM",
    taken: false,
  },
  {
    id: 3,
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily",
    time: "9:00 PM",
    taken: false,
  }
];

// Helper function to get current time
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const Index = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(33);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [greeting, setGreeting] = useState("Good morning");

  // Update greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Navigation functions
  const goToScanner = () => navigate("/scanner");
  const goToSupport = () => navigate("/support");
  const goToReminders = () => navigate("/reminders");

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <GsapReveal animation="fade" duration={0.8}>
        <header className="px-6 pt-8 pb-4">
          <h1 className="text-3xl font-bold text-foreground">
            {greeting}, <span className="text-medical-teal">James</span>
          </h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Monday, April 4</span>
            <span className="mx-2">•</span>
            <Clock className="w-4 h-4 mr-2" />
            <span>{currentTime}</span>
          </div>
        </header>
      </GsapReveal>

      {/* Today's Progress */}
      <GsapReveal animation="slide" delay={0.2} duration={0.8} className="px-6 py-4">
        <MediCard gradient className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Today's Progress</h2>
          <Progress value={progress} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress}% complete</span>
            <span>3 medications today</span>
          </div>
        </MediCard>
      </GsapReveal>

      {/* Upcoming Medications */}
      <section className="px-6 py-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-xl">Upcoming Medications</h2>
          <button className="text-medical-teal text-sm font-medium">View All</button>
        </div>
        
        {medications.map((med, index) => (
          <GsapReveal key={med.id} animation="scale" delay={0.3 + (index * 0.1)} duration={0.6}>
            <MediCard 
              neumorphic={!med.taken}
              important={!med.taken && med.time === "1:00 PM"}
              className={`mb-4 ${med.taken ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${med.taken ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {med.taken ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{med.name}</h3>
                      <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {med.time}
                    </div>
                  </div>
                </div>
              </div>
              
              {!med.taken && (
                <div className="mt-4 flex space-x-3">
                  <MediButton variant="outline" size="sm" className="flex-1">Skip</MediButton>
                  <MediButton variant="default" size="sm" className="flex-1 bg-medical-teal hover:bg-medical-teal/90">Take Now</MediButton>
                </div>
              )}
            </MediCard>
          </GsapReveal>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="px-6 py-4">
        <h2 className="font-semibold text-xl mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <GsapReveal animation="slide" delay={0.5} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToScanner}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-purple/10 text-medical-purple flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Scan Prescription</h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.6} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToReminders}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-teal/10 text-medical-teal flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Set Reminders</h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.7} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={goToSupport}
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-blue/10 text-medical-blue flex items-center justify-center mb-2">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Ask MediBot</h3>
              </div>
            </MediCard>
          </GsapReveal>
          
          <GsapReveal animation="slide" delay={0.8} duration={0.6}>
            <MediCard 
              neumorphic
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-medical-pink/10 text-medical-pink flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold">SOS</span>
                </div>
                <h3 className="font-medium">Emergency</h3>
              </div>
            </MediCard>
          </GsapReveal>
        </div>
      </section>

      {/* Navigation Bar */}
      <NavBar />
    </div>
  );
};

export default Index;
