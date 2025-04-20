
import React from "react";
import { Outlet, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const CustomerLayout = () => {
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
            <Link
              to="/customer/book"
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
                window.location.pathname === "/customer/book" && "text-primary"
              )}
            >
              Book Analysis
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Login
            </Link>
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
