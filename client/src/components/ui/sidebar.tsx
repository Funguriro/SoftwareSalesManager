import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, Users, Receipt, Key, FileText, Headset, Settings, 
  LogOut, UserCog, CreditCard, ScrollText, ChevronDown, ChevronUp,
  Menu
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const navItems = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Dashboard", icon: <Home size={20} /> }
      ]
    },
    {
      title: "Accounts",
      id: "accounts",
      items: [
        { href: "/clients", label: "Clients", icon: <Users size={20} /> },
        { href: "/invoices", label: "Invoices", icon: <Receipt size={20} /> }
      ]
    },
    {
      title: "Licensing",
      id: "licensing",
      items: [
        { href: "/licenses", label: "Licenses", icon: <Key size={20} /> },
        { href: "/subscriptions", label: "Subscriptions", icon: <CreditCard size={20} /> }
      ]
    },
    {
      title: "Support",
      id: "support",
      items: [
        { href: "/tickets", label: "Support Tickets", icon: <Headset size={20} /> },
        { href: "/staff", label: "Support Staff", icon: <ScrollText size={20} /> }
      ]
    }
  ];

  // Only show settings and users for admins
  const adminItems = [
    {
      title: "Settings",
      id: "settings",
      items: [
        { href: "/settings", label: "General Settings", icon: <Settings size={20} /> },
        { href: "/users", label: "User Management", icon: <UserCog size={20} /> }
      ]
    }
  ];

  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-primary shadow-lg"
        >
          <Menu size={24} />
        </Button>
      </div>

      <aside 
        className={cn(
          "w-full md:w-64 bg-neutral-800 text-white flex flex-col h-screen md:fixed",
          isMobileMenuOpen ? "fixed inset-0 z-40" : "hidden md:flex",
          className
        )}
      >
        <div className="p-4 border-b border-neutral-700 flex items-center justify-center md:justify-start">
          <Key className="mr-2" />
          <h1 className="text-xl font-semibold">SoftSales Pro</h1>

          {/* Close button for mobile */}
          <Button 
            variant="ghost" 
            className="ml-auto md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <LogOut size={20} />
          </Button>
        </div>
        
        <nav className="flex-grow overflow-y-auto">
          {navItems.map((section) => (
            <div key={section.title}>
              <div 
                className={cn(
                  "px-4 py-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider",
                  section.title !== "Main" && "mt-4",
                  section.id && "flex items-center justify-between cursor-pointer"
                )}
                onClick={section.id ? () => toggleSection(section.id) : undefined}
              >
                {section.title}
                {section.id && (
                  expandedSection === section.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
              </div>
              
              {(!section.id || expandedSection === section.id) && section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center px-4 py-3",
                      location === item.href 
                        ? "bg-primary-600 text-white" 
                        : "text-neutral-300 hover:bg-neutral-700",
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          ))}
          
          {isAdmin && adminItems.map((section) => (
            <div key={section.title}>
              <div 
                className={cn(
                  "px-4 py-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider mt-4",
                  section.id && "flex items-center justify-between cursor-pointer"
                )}
                onClick={section.id ? () => toggleSection(section.id) : undefined}
              >
                {section.title}
                {section.id && (
                  expandedSection === section.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
              </div>
              
              {(!section.id || expandedSection === section.id) && section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center px-4 py-3",
                      location === item.href 
                        ? "bg-primary-600 text-white" 
                        : "text-neutral-300 hover:bg-neutral-700",
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        
        <div className="p-4 border-t border-neutral-700">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`} />
              <AvatarFallback>{user?.fullName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <p className="text-sm font-medium text-white">{user?.fullName || 'User'}</p>
              <p className="text-xs text-neutral-400 capitalize">{user?.role || 'User'}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-neutral-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
