
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import SlotManagement from "./pages/admin/slots/SlotManagement";
import CreateSlots from "./pages/admin/slots/CreateSlots";
import EditSlots from "./pages/admin/slots/EditSlots";
import ViewBookings from "./pages/admin/bookings/ViewBookings";
import Reports from "./pages/admin/reports/Reports";

// Customer Pages
import CustomerRegistration from "./pages/customer/Registration";
import BookAnalysisSlot from "./pages/customer/BookAnalysisSlot";
import Payment from "./pages/customer/Payment";
import Invoice from "./pages/customer/Invoice";

// Auth & Other Pages
import Login from "./pages/auth/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* Customer Routes */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route path="register" element={<CustomerRegistration />} />
            <Route path="book" element={<BookAnalysisSlot />} />
            <Route path="payment" element={<Payment />} />
            <Route path="invoice/:id" element={<Invoice />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="slots" element={<SlotManagement />} />
            <Route path="slots/create" element={<CreateSlots />} />
            <Route path="slots/edit/:id" element={<EditSlots />} />
            <Route path="bookings" element={<ViewBookings />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
