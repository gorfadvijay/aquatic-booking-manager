import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { registerUser, verifyOTP, resendOTP } from "@/lib/db";

const formSchemaStep1 = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  dob: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select your gender",
  }),
  swimmingExperience: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select your swimming experience",
  }),
});

const Registration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string>("");

  // Use the appropriate schema based on the current step
  const form = useForm<z.infer<typeof formSchemaStep1>>({
    resolver: zodResolver(formSchemaStep1),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      dob: new Date(),
      gender: "male",
      swimmingExperience: "beginner",
    },
  });

  // Update form resolver when step changes
  React.useEffect(() => {
    form.clearErrors();
    // Reset with the proper resolver without trying to set it directly
    form.reset(undefined, {
      keepValues: true
    });
  }, [form]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const sendVerificationCode = async () => {
    setIsVerifying(true);
    
    try {
      const formValues = form.getValues();
      setUserEmail(formValues.email);
      
      // Register the user and get OTP
      await registerUser({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        phone: formValues.phone,
        dob: formValues.dob.toISOString(),
        gender: formValues.gender,
        swimming_experience: formValues.swimmingExperience,
      });
      
      setIsOtpSent(true);
      toast({
        title: "Verification code sent",
        description: "A verification code has been sent to your email and phone number.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      console.error("Registration error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyUserOtp = async () => {
    const otpValue = otp.join("");
    
    // In a real app, this would verify the OTP with the backend
    try {
      const user = await verifyOTP(userEmail, otpValue);
      
      if (user) {
        // Store user information in localStorage
        const formValues = form.getValues();
        localStorage.setItem('userId', user.id || `user-${Math.random().toString(36).substring(2, 9)}`);
        localStorage.setItem('userEmail', formValues.email);
        localStorage.setItem('userName', formValues.name);
        localStorage.setItem('userPhone', formValues.phone);
        localStorage.setItem('userGender', formValues.gender);
        localStorage.setItem('userDob', formValues.dob.toISOString());
        localStorage.setItem('userSwimmingExperience', formValues.swimmingExperience);
        
        // Store complete user object as JSON string for convenience
        localStorage.setItem('userData', JSON.stringify({
          id: user.id || `user-${Math.random().toString(36).substring(2, 9)}`,
          email: formValues.email,
          name: formValues.name,
          phone: formValues.phone,
          gender: formValues.gender,
          dob: formValues.dob.toISOString(),
          swimming_experience: formValues.swimmingExperience,
        }));
        
        toast({
          title: "Verification successful",
          description: "Your email and phone have been verified.",
        });
        navigate("/customer/book");
      } else {
        toast({
          title: "Invalid verification code",
          description: "Please enter the correct code or request a new one.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("OTP verification error:", error);
    }
  };
  
  const handleResendOTP = async () => {
    setIsVerifying(true);
    
    try {
      await resendOTP(userEmail);
      
      toast({
        title: "New verification code sent",
        description: "A new verification code has been sent to your email and phone.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send new verification code.",
        variant: "destructive",
      });
      console.error("Resend OTP error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  function onSubmit(values: z.infer<typeof formSchemaStep1>) {
    console.log(values);
    sendVerificationCode();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Swimmer Registration</h1>
          <p className="text-muted-foreground">
            Join Swimple and book your swimming analysis sessions
          </p>
        </div>

        {!isOtpSent ? (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Please provide your basic details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-6 grid-cols-1 ">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
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
                            <Input
                              placeholder="john.doe@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            We'll send a verification code to this email
                          </FormDescription>
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
                            <Input
                              placeholder="********"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 123-4567"
                              type="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            We'll send a verification code to this number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "MMMM do, yyyy")
                                  ) : (
                                    <span>Pick your date of birth</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3 space-y-3">
                                {/* Month and Year Selectors */}
                                <div className="flex gap-2">
                                  <Select
                                    value={field.value ? format(field.value, 'MMMM') : format(new Date(new Date().getFullYear() - 20, 0), 'MMMM')}
                                    onValueChange={(month) => {
                                      const currentDate = field.value || new Date(new Date().getFullYear() - 20, 0, 1);
                                      const monthIndex = [
                                        "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                      ].indexOf(month);
                                      const newDate = new Date(currentDate.getFullYear(), monthIndex, currentDate.getDate());
                                      field.onChange(newDate);
                                    }}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="January">January</SelectItem>
                                      <SelectItem value="February">February</SelectItem>
                                      <SelectItem value="March">March</SelectItem>
                                      <SelectItem value="April">April</SelectItem>
                                      <SelectItem value="May">May</SelectItem>
                                      <SelectItem value="June">June</SelectItem>
                                      <SelectItem value="July">July</SelectItem>
                                      <SelectItem value="August">August</SelectItem>
                                      <SelectItem value="September">September</SelectItem>
                                      <SelectItem value="October">October</SelectItem>
                                      <SelectItem value="November">November</SelectItem>
                                      <SelectItem value="December">December</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select
                                    value={field.value ? format(field.value, 'yyyy') : (new Date().getFullYear() - 20).toString()}
                                    onValueChange={(year) => {
                                      const currentDate = field.value || new Date(new Date().getFullYear() - 20, 0, 1);
                                      const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                                      field.onChange(newDate);
                                    }}
                                  >
                                    <SelectTrigger className="w-[100px]">
                                      <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="h-[200px]">
                                      {Array.from({ length: 80 }, (_, i) => {
                                        const year = new Date().getFullYear() - i;
                                        return (
                                          <SelectItem key={year} value={year.toString()}>
                                            {year}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Calendar */}
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => date && field.onChange(date)}
                                  disabled={(date) =>
                                    date > new Date() || 
                                    date < new Date("1900-01-01")
                                  }
                                  month={field.value || new Date(new Date().getFullYear() - 20, 0)}
                                  onMonthChange={(month) => {
                                    const currentDate = field.value || new Date(new Date().getFullYear() - 20, 0, 1);
                                    const newDate = new Date(month.getFullYear(), month.getMonth(), currentDate.getDate());
                                    field.onChange(newDate);
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Use the dropdowns to quickly select month and year
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="male" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Male
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="female" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Female
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="other" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Other
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="swimmingExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Swimming Experience</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your experience level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">
                                Beginner
                              </SelectItem>
                              <SelectItem value="intermediate">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="advanced">
                                Advanced
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps us understand your swimming background
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="submit" className="w-full">
                     Register
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Verify Your Contact</CardTitle>
              <CardDescription>
                Enter the verification code sent to your email and phone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-6">
                  We've sent a 4-digit code to{" "}
                  <span className="font-medium text-foreground">
                    {form.getValues("email")}
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-foreground">
                    {form.getValues("phone")}
                  </span>
                </p>

                <p className="text-sm text-muted-foreground mb-4">
                  <strong>For testing:</strong> Use code <span className="font-bold">8452</span>
                </p>

                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      className="w-12 h-12 text-center text-xl"
                      value={digit}
                      maxLength={1}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <Button
                  onClick={verifyUserOtp}
                  className="w-full"
                  disabled={otp.join("").length !== 4}
                >
                  Verify
                </Button>

                <div className="mt-6 text-sm">
                  <p className="text-muted-foreground">
                    Didn't receive a code?{" "}
                    <Button
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={isVerifying}
                      className="p-0 h-auto font-normal"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Resend Code"
                      )}
                    </Button>
                  </p>
                  {process.env.NODE_ENV !== 'production' && (
                    <p className="text-muted-foreground mt-2">
                      <span className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded">
                        Dev mode: Use test OTP code "8452"
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs ml-2"
                        onClick={() => {
                          setOtp(['8', '4', '5', '2']);
                        }}
                      >
                        Fill Test OTP
                      </Button>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Registration;
