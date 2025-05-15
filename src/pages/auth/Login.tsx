import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/lib/db";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  userType: z.enum(["admin", "customer"]),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      userType: "customer",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      // For admin, use static credentials check
      if (values.userType === "admin") {
        if (values.email === "admin@swimmple.com" && values.password === "password8452") {
          // Static admin user
          const adminUser = {
            id: "58e48818-18c2-48ea-b11a-ac239712ca02",
            name: "Admin User",
            email: "admin@swimmple.com",
            phone: "+91 9876543210",
            dob: "1990-01-01",
            is_admin: true,
            is_verified: true,
            created_at: new Date().toISOString()
          };
          
          // Store admin information in localStorage
          localStorage.setItem('userId', adminUser.id);
          localStorage.setItem('userEmail', adminUser.email);
          localStorage.setItem('userName', adminUser.name);
          localStorage.setItem('userPhone', adminUser.phone);
          localStorage.setItem('userDob', adminUser.dob);
          localStorage.setItem('isAdmin', 'true');
          
          // Store complete user object as JSON string for convenience
          localStorage.setItem('userData', JSON.stringify(adminUser));
          
          toast({
            title: "Login successful",
            description: `Welcome back, ${adminUser.name}`,
          });
          
          navigate("/admin");
          return;
        } else {
          toast({
            title: "Login failed",
            description: "Invalid admin credentials",
            variant: "destructive",
          });
          return;
        }
      }
      
      // For regular users, use the API
      const user = await loginUser(
        values.email, 
        values.password, 
        values.userType as 'admin' | 'customer'
      );
      
      if (user) {
        // Store user information in localStorage
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userPhone', user.phone || '');
        localStorage.setItem('userDob', user.dob ? (typeof user.dob === 'string' ? user.dob : user.dob.toISOString()) : '');
        
        // Store complete user object as JSON string for convenience
        localStorage.setItem('userData', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          dob: user.dob,
          // Add any other available properties from the user object
        }));
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}`,
        });
        
        navigate("/customer/book");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast({
        title: "Login error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-primary text-white p-2 rounded-lg">
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
            </div>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex rounded-md overflow-hidden border">
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 rounded-none ${
                              field.value === "customer"
                                ? "bg-primary text-white"
                                : ""
                            }`}
                            onClick={() => field.onChange("customer")}
                          >
                            Customer
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 rounded-none ${
                              field.value === "admin"
                                ? "bg-primary text-white"
                                : ""
                            }`}
                            onClick={() => field.onChange("admin")}
                          >
                            Admin
                          </Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="mail@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <a
                href="/customer/register"
                className="text-primary hover:underline"
              >
                Register
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
