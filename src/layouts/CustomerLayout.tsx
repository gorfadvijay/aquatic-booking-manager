import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const CustomerLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userEmail = localStorage.getItem("userEmail");
    const storedUserName = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId");
    
    setIsLoggedIn(!!(userEmail || storedUserName || userId));
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const handleLogout = () => {
    // Clear ALL user-related data from localStorage
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userDob");
    localStorage.removeItem("userData");
    
    // For complete cleanup, consider clearing any other potential user data
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    
    // Set logged out state
    setIsLoggedIn(false);
    setUserName("");
    
    // Redirect to home page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <div className="bg-primary text-white p-1 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12h20" />
                <path d="M5 12a9 3 0 1 0 18 0 9 3 0 1 0-18 0" />
                <path d="M5 16c0 1.7 4 3 9 3s9-1.3 9-3" />
              </svg>
            </div>
            <span className="font-bold text-xl">Swimple</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {!isLoggedIn && (
              <Link
                to="/customer/register"
                className={cn(
                  "text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
                  window.location.pathname === "/customer/register" &&
                    "text-primary"
                )}
              >
                Register
              </Link>
            )}
            <Link
              to="/customer/book"
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
                window.location.pathname === "/customer/book" && "text-primary"
              )}
            >
              Book Analysis
            </Link>
            <Link
              to="/customer/booking-details"
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
                window.location.pathname === "/customer/booking-details" && "text-primary"
              )}
            >
              My Bookings
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-muted-foreground mr-2 border-r border-muted-foreground/30 pr-3">
                  Welcome, {userName || "Customer"}
                </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Logout
              </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Swimple. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
