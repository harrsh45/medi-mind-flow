import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowUp, User, FileText, Camera, Mic, MicOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import { Input } from "@/components/ui/input";
import GsapReveal from "@/components/GsapReveal";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type Message = {
  id: number;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  attachment?: {
    type: "document" | "image";
    url: string;
    name?: string;
  };
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "bot",
    content: "Hello! I'm MediBot, your AI medication assistant. How can I help you today? You can type or use the microphone button to speak your question.",
    timestamp: new Date(),
  },
];

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setIsProcessing(false);
        toast({
          title: "Voice Input Error",
          description: `Could not record voice: ${event.error}`,
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          setIsProcessing(true);
          setTimeout(() => {
            setIsListening(false);
            setIsProcessing(false);
            if (input.trim()) {
              handleSendMessage();
            }
          }, 1000);
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        stopListening();
      }
      
      // Cleanup camera when component unmounts
      if (isCameraOpen) {
        stopCamera();
      }
    };
  }, []);
  
  // Handle camera
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOpen]);
  
  const startCamera = async () => {
    try {
      if (!videoRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      toast({
        description: "Camera opened. Position your document or medication and take a photo.",
        className: "bg-medical-teal text-white",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCameraOpen(false);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check your device permissions.",
        variant: "destructive"
      });
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame on canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      
      // Set captured image
      setCapturedImage(imageDataUrl);
      
      toast({
        description: "Photo captured! Click 'Send Photo' to add it to the chat.",
        className: "bg-medical-teal text-white",
      });
    }
  };
  
  const sendCapturedPhoto = () => {
    if (!capturedImage) return;
    
    const photoMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input.trim() || "Here's a photo of my medication",
      timestamp: new Date(),
      attachment: {
        type: "image",
        url: capturedImage
      }
    };
    
    setMessages([...messages, photoMessage]);
    setInput("");
    setCapturedImage(null);
    setIsCameraOpen(false);
    
    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        role: "bot",
        content: "I've received your medication photo. This appears to be a common medication. Would you like me to provide more information about this medication or help with something specific?",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1500);
  };
  
  const cancelPhoto = () => {
    setCapturedImage(null);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Process the file
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Create a message with document attachment
        const docMessage: Message = {
          id: messages.length + 1,
          role: "user",
          content: input.trim() || "I've uploaded a document for review",
          timestamp: new Date(),
          attachment: {
            type: "document",
            url: event.target.result as string,
            name: file.name
          }
        };
        
        setMessages([...messages, docMessage]);
        setInput("");
        
        // Reset file input to allow uploading the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Simulate bot response
        setTimeout(() => {
          const botMessage: Message = {
            id: messages.length + 2,
            role: "bot",
            content: `I've received your document "${file.name}". Would you like me to extract information about your medications from this document or do you have specific questions about it?`,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, botMessage]);
        }, 1500);
      }
    };
    
    // Read the file as data URL
    reader.readAsDataURL(file);
    
    toast({
      description: `Uploading document: ${file.name}`,
      className: "bg-medical-teal text-white",
    });
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input. Please type your question instead.",
        variant: "destructive"
      });
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const startListening = () => {
    try {
      setIsListening(true);
      recognitionRef.current?.start();
      toast({
        description: "Listening... Speak your question clearly.",
        className: "bg-medical-teal text-white",
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  };
  
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setInput("");
    
    // Simulate bot response after delay
    setTimeout(() => {
      let botResponse = "";
      
      if (input.toLowerCase().includes("side effect") || input.toLowerCase().includes("side effects")) {
        botResponse = "Common side effects of this medication may include headache, dizziness, and nausea. If you experience severe side effects, please contact your healthcare provider immediately.";
      } else if (input.toLowerCase().includes("interaction") || input.toLowerCase().includes("interactions")) {
        botResponse = "This medication may interact with alcohol, certain antidepressants, and blood thinners. Always consult your doctor about potential interactions with other medications you're taking.";
      } else if (input.toLowerCase().includes("miss") || input.toLowerCase().includes("forgot") || input.toLowerCase().includes("forgotten")) {
        botResponse = "If you missed a dose, take it as soon as you remember. However, if it's almost time for your next dose, skip the missed dose and continue with your regular schedule. Don't take a double dose to make up for a missed one.";
      } else {
        botResponse = "I understand you have a question about your medication. For specific advice about your prescribed medications, please consult your healthcare provider. Is there anything else I can help you with?";
      }
      
      const botMessage: Message = {
        id: messages.length + 2,
        role: "bot",
        content: botResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const goBack = () => navigate(-1);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex justify-between items-center p-4 border-b flex-shrink-0">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <span className="ml-2">Back</span>
        </Button>
        <h1 className="text-xl font-bold">MediBot Support</h1>
        <div className="w-10"></div> {/* For layout balance */}
      </header>
      
      {/* Camera overlay when camera is open */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black/80">
            <h2 className="text-white text-xl font-bold">Take Medication Photo</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => setIsCameraOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex-1 relative flex flex-col items-center justify-center bg-black">
            {!capturedImage ? (
              <>
                <div className="absolute top-0 left-0 right-0 p-4 bg-black/50 text-center">
                  <span className="text-white text-lg">Position your medication in the frame</span>
                </div>
                
                <video 
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center bg-black/40">
                  <Button 
                    onClick={capturePhoto}
                    className="h-20 w-20 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center mb-4"
                  >
                    <div className="h-16 w-16 rounded-full border-4 border-gray-800" />
                  </Button>
                  <span className="text-white text-base font-medium">TAP BUTTON TO TAKE PHOTO</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute top-0 left-0 right-0 p-4 bg-black/50 text-center">
                  <span className="text-white text-lg">Review your photo</span>
                </div>
                
                <img 
                  src={capturedImage} 
                  alt="Captured photo"
                  className="w-full h-full object-contain"
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-4 bg-black/60">
                  <div className="flex justify-center gap-6">
                    <Button 
                      onClick={cancelPhoto}
                      className="flex-1 max-w-xs h-14 bg-red-500 hover:bg-red-600 text-white text-lg"
                    >
                      Retake Photo
                    </Button>
                    <Button 
                      onClick={sendCapturedPhoto}
                      className="flex-1 max-w-xs h-14 bg-medical-teal hover:bg-medical-teal/90 text-white text-lg"
                    >
                      Use This Photo
                    </Button>
                  </div>
                  <p className="text-white text-center text-sm">
                    Choose "Use This Photo" to send it to MediBot for assistance
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      <div className="flex flex-col flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Only this div should be scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((message, index) => (
            <GsapReveal 
              key={message.id} 
              animation="slide" 
              delay={index === 0 ? 0 : 0.2} 
              className={cn(
                "mb-6",
                message.role === "user" ? "ml-auto" : "mr-auto",
                "max-w-[85%] md:max-w-[75%]"
              )}
            >
              <MediCard
                neumorphic={message.role === "user"}
                gradient={message.role === "bot"}
                className={cn(
                  "p-4",
                  message.role === "user" 
                    ? "bg-medical-teal text-white" 
                    : "bg-white"
                )}
              >
                <div className="flex items-start gap-4">
                  {message.role === "bot" && (
                    <div className="w-10 h-10 rounded-full bg-medical-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-medical-purple font-bold text-sm">AI</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={cn(
                      "text-base leading-relaxed",
                      message.role === "user" ? "text-white" : ""
                    )}>
                      {message.content}
                    </div>
                    
                    {/* Render attachments */}
                    {message.attachment && (
                      <div className="mt-3">
                        {message.attachment.type === "image" && (
                          <div className="rounded-lg overflow-hidden border-2 border-white/20">
                            <img 
                              src={message.attachment.url} 
                              alt="Shared photo" 
                              className="w-full max-h-60 object-contain"
                            />
                          </div>
                        )}
                        
                        {message.attachment.type === "document" && (
                          <div className="rounded-lg bg-white/10 p-3 flex items-center gap-3">
                            <FileText className="w-10 h-10 text-white" />
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate text-white">
                                {message.attachment.name || "Document"}
                              </div>
                              <div className="text-xs text-white/70">
                                Document attached
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </MediCard>
            </GsapReveal>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Voice recording indicator */}
        {isListening && (
          <div className="flex items-center justify-center py-3 px-4 bg-medical-teal/10 border-t border-b border-medical-teal/20 flex-shrink-0">
            <div className="flex items-center gap-3 text-medical-teal animate-pulse">
              <div className="w-4 h-4 rounded-full bg-medical-teal"></div>
              <span className="font-medium text-base">Listening... Speak clearly</span>
            </div>
          </div>
        )}
        
        <div className="p-4 md:p-5 border-t bg-background flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <MediButton 
              variant="outline" 
              size="sm" 
              className="flex-1 h-11 text-base"
              onClick={handleUploadClick}
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload Document
            </MediButton>
            <MediButton 
              variant="outline" 
              size="sm" 
              className="flex-1 h-11 text-base"
              onClick={() => setIsCameraOpen(true)}
            >
              <Camera className="w-5 h-5 mr-2" />
              Take Photo
            </MediButton>
            
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
            />
          </div>
          
          <div className="flex gap-3">
            <Input
              className="flex-1 text-base h-14 px-4"
              placeholder={isListening ? "Listening..." : "Type or speak your question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isListening}
            />
            <Button 
              onClick={toggleListening} 
              className={cn(
                "h-14 w-14",
                isListening 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-medical-purple hover:bg-medical-purple/90"
              )}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            <Button 
              onClick={handleSendMessage} 
              className="bg-medical-teal hover:bg-medical-teal/90 h-14 w-14"
              disabled={!input.trim() || isListening}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4 text-center">
            {isListening ? 
              "Click the microphone button again when you're done speaking" : 
              "For medical emergencies, please call your doctor or emergency services"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
