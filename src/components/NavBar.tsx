
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ReactElement;
  text: string;
  to: string;
  isActive: boolean;
}

const NavItem = ({ icon, text, to, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex flex-col items-center justify-center px-4 py-2 text-sm transition-colors duration-200",
      isActive
        ? "text-medical-teal font-medium"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <div
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full mb-1 transition-all duration-200",
        isActive
          ? "bg-medical-teal/10 text-medical-teal"
          : "bg-transparent hover:bg-secondary/5"
      )}
    >
      {icon}
    </div>
    <span>{text}</span>
  </Link>
);

const NavBar = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center py-2 z-10">
      <NavItem
        icon={<Bell className="w-6 h-6" />}
        text="Reminders"
        to="/reminders"
        isActive={activeTab === "reminders"}
      />
      <NavItem
        icon={<Calendar className="w-6 h-6" />}
        text="Schedule"
        to="/schedule"
        isActive={activeTab === "schedule"}
      />
      <Button
        className="rounded-full bg-medical-teal text-white w-16 h-16 p-0 -mt-8 shadow-lg hover:bg-medical-teal/90"
        onClick={() => setActiveTab("home")}
      >
        <span className="text-3xl">+</span>
      </Button>
      <NavItem
        icon={<MessageCircle className="w-6 h-6" />}
        text="Support"
        to="/support"
        isActive={activeTab === "support"}
      />
      <NavItem
        icon={<User className="w-6 h-6" />}
        text="Profile"
        to="/profile"
        isActive={activeTab === "profile"}
      />
    </nav>
  );
};

export default NavBar;
