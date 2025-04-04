
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowUp, User, FileText, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import { Input } from "@/components/ui/input";
import GsapReveal from "@/components/GsapReveal";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "bot",
    content: "Hello! I'm MediBot, your AI medication assistant. How can I help you today?",
    timestamp: new Date(),
  },
];

const Support = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
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
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <span className="ml-2">Back</span>
        </Button>
        <h1 className="text-xl font-bold">MediBot Support</h1>
        <div className="w-10"></div> {/* For layout balance */}
      </header>
      
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <GsapReveal 
              key={message.id} 
              animation="slide" 
              delay={index === 0 ? 0 : 0.2} 
              className={cn(
                "mb-4 max-w-[85%]",
                message.role === "user" ? "ml-auto" : "mr-auto"
              )}
            >
              <MediCard
                neumorphic={message.role === "user"}
                gradient={message.role === "bot"}
                className={cn(
                  message.role === "user" 
                    ? "bg-medical-teal text-white" 
                    : "bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  {message.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-medical-purple/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-medical-purple font-bold text-sm">AI</span>
                    </div>
                  )}
                  <div className={message.role === "user" ? "text-white" : ""}>
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </MediCard>
            </GsapReveal>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2 mb-3">
            <MediButton 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
            </MediButton>
            <MediButton 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </MediButton>
          </div>
          
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Type your question about medications..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button 
              onClick={handleSendMessage} 
              className="bg-medical-teal hover:bg-medical-teal/90"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            For medical emergencies, please call your doctor or emergency services
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
