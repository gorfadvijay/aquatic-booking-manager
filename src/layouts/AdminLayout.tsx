
import React from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  FileText,
  Settings,
  User,
  Users,
  BookOpen,
  Tent,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = React.useState(false);

  interface MenuItem {
    title: string;
    icon: React.ReactNode;
    path: string;
    submenu?: { title: string; path: string; }[];
  }

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <BookOpen className="h-5 w-5" />,
      path: "/admin",
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      path: "/admin/users",
    },
    {
      title: "Bookings",
      icon: <Calendar className="h-5 w-5" />,
      path: "/admin/bookings",
    },
    {
      title: "Slot Management",
      icon: <Settings className="h-5 w-5" />,
      path: "/admin/slots",
    },
    {
      title: "Camp Registration",
      icon: <Tent className="h-5 w-5" />,
      path: "/admin/camp-registration",
    },
    {
      title: "Reports",
      icon: <FileText className="h-5 w-5" />,
      path: "/admin/reports",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-r border-border transition-all duration-300 flex flex-col",
          collapsed ? "w-[70px]" : "w-[250px]"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div
            className={cn(
              "font-bold text-primary flex items-center gap-2",
              collapsed && "hidden"
            )}
          >
            <div className="bg-primary text-white p-1 rounded">
              <Users size={20} />
            </div>
            <span>Swimple Admin</span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="bg-sidebar-accent rounded p-1 hover:bg-sidebar-accent/80"
          >
            {collapsed ? (
              <div className="h-5 w-5 flex justify-center items-center">→</div>
            ) : (
              <div className="h-5 w-5 flex justify-center items-center">←</div>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent group",
                    window.location.pathname === item.path &&
                      "bg-sidebar-accent font-medium text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "text-sidebar-foreground",
                      window.location.pathname === item.path && "text-primary"
                    )}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={cn(
                      collapsed && "hidden",
                      "text-sidebar-foreground group-hover:text-primary",
                      window.location.pathname === item.path && "text-primary"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
                {item.submenu && !collapsed && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.submenu.map((subitem, subindex) => (
                      <Link
                        key={subindex}
                        to={subitem.path}
                        className={cn(
                          "block px-3 py-1.5 rounded-md text-sm hover:bg-sidebar-accent hover:text-primary",
                          window.location.pathname === subitem.path &&
                            "bg-sidebar-accent font-medium text-primary"
                        )}
                      >
                        {subitem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div
          className={cn(
            "p-4 border-t border-border flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white">
            <User size={18} />
          </div>
          {!collapsed && (
            <div>
              <div className="font-medium text-sm">Admin User</div>
              <button
                onClick={() => {
                  // Clear localStorage on logout
                  localStorage.clear();
                  
                  toast({
                    title: "Logged out",
                    description: "You have been logged out successfully",
                  });
                  navigate("/login");
                }}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
