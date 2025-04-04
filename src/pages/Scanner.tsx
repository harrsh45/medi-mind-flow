
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, ArrowUp, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import GsapReveal from "@/components/GsapReveal";
import { Progress } from "@/components/ui/progress";

const Scanner = () => {
  const navigate = useNavigate();
  const [scanStage, setScanStage] = useState<"initial" | "scanning" | "processing" | "results">("initial");
  const [scanProgress, setScanProgress] = useState(0);
  
  // Mock functions for handling the scanning process
  const handleCapture = () => {
    setScanStage("scanning");
    
    // Simulate scanning progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      
      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          setScanStage("processing");
          setTimeout(() => {
            setScanStage("results");
          }, 1500);
        }, 500);
      }
    }, 100);
  };
  
  const handleUpload = () => {
    setScanStage("processing");
    setTimeout(() => {
      setScanStage("results");
    }, 2000);
  };

  const goBack = () => navigate(-1);
  
  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 rotate-270 transform -rotate-90" />
          <span className="ml-2">Back</span>
        </Button>
        <h1 className="text-xl font-bold">Prescription Scanner</h1>
        <div className="w-10"></div> {/* For layout balance */}
      </header>
      
      <GsapReveal animation="fade">
        {scanStage === "initial" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard neumorphic className="w-full max-w-md mb-8 p-4">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-medical-teal/10 flex items-center justify-center mb-6">
                  <Camera className="w-12 h-12 text-medical-teal" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Scan Prescription</h2>
                <p className="text-muted-foreground mb-8">
                  Position your prescription in the frame and take a clear photo
                </p>
                <MediButton 
                  size="lg" 
                  pill 
                  className="bg-medical-teal hover:bg-medical-teal/90 mb-4 w-full"
                  onClick={handleCapture}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Capture Prescription
                </MediButton>
                <MediButton 
                  variant="outline" 
                  size="lg" 
                  pill 
                  className="w-full"
                  onClick={handleUpload}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Image
                </MediButton>
              </div>
            </MediCard>
            
            <div className="text-center text-muted-foreground text-sm">
              <p className="mb-2">Your prescription details will be securely processed</p>
              <p>We use AI to extract medication information accurately</p>
            </div>
          </div>
        )}
        
        {scanStage === "scanning" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard className="w-full max-w-md mb-8 border-2 border-dashed border-medical-teal p-0 overflow-hidden">
              <div className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center">
                <div className="absolute inset-0 z-10">
                  <div 
                    className="w-full bg-medical-teal/20 animate-pulse" 
                    style={{ 
                      height: "4px", 
                      position: "absolute",
                      top: `${scanProgress}%`,
                      transform: "translateY(-2px)"
                    }}
                  />
                </div>
                <div className="text-muted-foreground">Scanning...</div>
              </div>
            </MediCard>
            
            <div className="w-full max-w-md">
              <Progress value={scanProgress} className="h-2 mb-2" />
              <p className="text-center text-sm text-muted-foreground">Scanning prescription... {scanProgress}%</p>
            </div>
          </div>
        )}
        
        {scanStage === "processing" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard neumorphic className="w-full max-w-md mb-8 p-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <div className="w-8 h-8 border-4 border-medical-teal border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Processing Your Prescription</h2>
                <p className="text-muted-foreground">
                  Our AI is analyzing the prescription details...
                </p>
              </div>
            </MediCard>
          </div>
        )}
        
        {scanStage === "results" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard neumorphic className="w-full max-w-md mb-6">
              <div className="text-center pt-4 pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-4">Prescription Scanned Successfully</h2>
              </div>
              
              <div className="bg-background p-4 rounded-lg mb-4">
                <h3 className="font-medium text-lg mb-3">Detected Medications</h3>
                
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex justify-between">
                      <h4 className="font-semibold">Metoprolol Tartrate</h4>
                      <span className="text-medical-teal">97% match</span>
                    </div>
                    <div className="flex flex-wrap mt-1 gap-2">
                      <span className="bg-medical-teal/10 text-medical-teal text-xs px-2 py-1 rounded">25mg</span>
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Twice daily</span>
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">30 tabs</span>
                    </div>
                  </div>
                  
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex justify-between">
                      <h4 className="font-semibold">Atorvastatin</h4>
                      <span className="text-medical-teal">95% match</span>
                    </div>
                    <div className="flex flex-wrap mt-1 gap-2">
                      <span className="bg-medical-teal/10 text-medical-teal text-xs px-2 py-1 rounded">10mg</span>
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Once daily</span>
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">90 tabs</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-2">
                <MediButton variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Edit
                </MediButton>
                <MediButton className="flex-1 bg-medical-teal hover:bg-medical-teal/90">
                  <Check className="w-4 h-4 mr-2" />
                  Confirm
                </MediButton>
              </div>
            </MediCard>
            
            <p className="text-sm text-muted-foreground text-center">
              You can edit the details if needed before adding to your medications
            </p>
          </div>
        )}
      </GsapReveal>
    </div>
  );
};

export default Scanner;
