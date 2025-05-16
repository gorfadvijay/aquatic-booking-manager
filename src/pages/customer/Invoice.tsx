import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail, Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { InvoiceService } from "@/lib/services/invoice.service";
import { BookingService } from "@/lib/services/booking.service";
import { format } from "date-fns";

const Invoice = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Get user info from localStorage
  useEffect(() => {
    const userName = localStorage.getItem("userName") || "Customer";
    const userEmail = localStorage.getItem("userEmail") || "customer@example.com";
    setCustomerName(userName);
    setCustomerEmail(userEmail);
  }, []);

  // Fetch invoice data from Supabase
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Check if the ID is the demo ID ("123")
        if (id === "123") {
          // Use demo data from location.state if available
          if (location.state?.bookingDetails) {
            const stateData = location.state;
            setInvoiceData({
              invoiceNumber: "INV-2023-" + id,
              date: format(new Date(), "MMMM dd, yyyy"),
              paymentMethod: "Credit Card",
              paymentStatus: "Paid",
              subtotal: 149.99,
              tax: 0.0,
              total: 149.99,
              items: [
                {
                  description: "Swimming Analysis Session",
                  details: `Sessions on selected dates`,
                  price: 149.99,
                },
              ],
            });
            setBookingDetails(stateData.bookingDetails);
          } else {
            // Fallback demo data if nothing is in state
            setInvoiceData({
              invoiceNumber: "INV-2023-" + id,
              date: format(new Date(), "MMMM dd, yyyy"),
              paymentMethod: "Credit Card (VISA ****1234)",
              paymentStatus: "Paid",
              subtotal: 149.99,
              tax: 0.0,
              total: 149.99,
              items: [
                {
                  description: "3-Day Swimming Analysis Session",
                  details: `${format(new Date(), "MMMM dd, yyyy")} (9:00 AM - 10:00 AM)`,
                  price: 149.99,
                },
              ],
            });
          }
        } else {
          // Fetch real invoice data from Supabase
          const invoice = await InvoiceService.getById(id);
          
          if (!invoice) {
            toast({
              title: "Invoice not found",
              description: "Could not find the requested invoice",
              variant: "destructive",
            });
            return;
          }
          
          // Fetch the associated booking
          const booking = await BookingService.getById(invoice.booking_id);
          if (booking) {
            setBookingDetails(booking);
          }
          
          // Set up invoice data
          setInvoiceData({
            invoiceNumber: invoice.invoice_number,
            date: format(new Date(invoice.generated_at), "MMMM dd, yyyy"),
            paymentMethod: "Credit Card",
            paymentStatus: "Paid",
            subtotal: invoice.amount,
            tax: 0.0,
            total: invoice.amount,
            items: [
              {
                description: "Swimming Analysis Session",
                details: booking ? `${format(new Date(booking.booking_date), "MMMM dd, yyyy")} (${formatTime(booking.start_time)} - ${formatTime(booking.end_time)})` : "Session booking",
                price: invoice.amount,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoiceData();
  }, [id, location.state, toast]);

  const formatTime = (time: string) => {
    // Convert "14:00:00" to "2:00 PM"
    if (!time) return "";
    
    try {
      const [hours, minutes] = time.split(":").map(Number);
      return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return time;
    }
  };

  const handleDownload = () => {
    toast({
      title: "Invoice downloaded",
      description: "Your invoice has been downloaded as a PDF",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    toast({
      title: "Invoice sent",
      description: "Your invoice has been sent to your email",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground">The requested invoice could not be found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 print:p-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold mb-2">Invoice</h1>
          <p className="text-muted-foreground">
            Your booking confirmation and invoice details
          </p>
        </div>

        <Card className="shadow-md print:shadow-none print:border-none">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-2xl">Invoice #{invoiceData.invoiceNumber}</CardTitle>
              <CardDescription>
                Issue Date: {invoiceData.date}
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail} className="gap-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-muted-foreground text-sm mb-2">
                    Bill To:
                  </h3>
                  <div className="space-y-1">
                    <p className="font-medium">{customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {customerEmail}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground text-sm mb-2">
                    Issued By:
                  </h3>
                  <div className="space-y-1">
                    <p className="font-medium">Swimple Analysis Center</p>
                    <p className="text-sm text-muted-foreground">
                      123 Pool Street, Watertown
                    </p>
                    <p className="text-sm text-muted-foreground">
                      contact@swimple.example.com
                    </p>
                    <p className="text-sm text-muted-foreground">
                      +1 (555) 987-6543
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Invoice Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 text-left text-sm font-medium text-muted-foreground w-full">
                          Description
                        </th>
                        <th className="py-3 text-right text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-4">
                            <div className="font-medium">
                              {item.description}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.details}
                            </div>
                          </td>
                          <td className="py-4 text-right whitespace-nowrap">
                            ₹{item.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{invoiceData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{invoiceData.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium text-lg border-t">
                    <span>Total</span>
                    <span>₹{invoiceData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-md">
                <h3 className="font-medium mb-2">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Payment Method
                    </div>
                    <div>{invoiceData.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Payment Status
                    </div>
                    <div className="text-green-600 font-medium">
                      {invoiceData.paymentStatus}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Note:</strong> Please bring your confirmation email and a valid ID for 
                  verification when you arrive for your swimming analysis session.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Invoice;
