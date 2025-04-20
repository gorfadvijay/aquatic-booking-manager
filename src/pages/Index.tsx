
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-primary">
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
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80">
              Login
            </Link>
            <Link to="/customer/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 water-ripple bg-gradient-to-b from-aqua-100 to-aqua-50 -z-10"></div>
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                Simplified Pool Management & Booking System
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                An all-in-one solution for managing pool bookings, schedules, and customer analysis sessions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/customer/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Register as Customer
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Admin Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our simple three-step process makes pool booking and management easy for everyone.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="font-bold text-xl mb-2">Register</h3>
                <p className="text-muted-foreground">
                  Create an account with your personal details and verify your email.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="font-bold text-xl mb-2">Book Analysis</h3>
                <p className="text-muted-foreground">
                  Choose available slots for your swimming analysis sessions.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">3</span>
                </div>
                <h3 className="font-bold text-xl mb-2">Pay & Confirm</h3>
                <p className="text-muted-foreground">
                  Complete payment and receive booking confirmation via email.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Swimple. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
