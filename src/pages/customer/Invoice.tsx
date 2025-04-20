
import React from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const Invoice = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const invoiceData = {
    invoiceNumber: "INV-2023-" + id,
    date: "April 22, 2023",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    customerPhone: "+1 (555) 123-4567",
    items: [
      {
        description: "3-Day Swimming Analysis Session",
        details: "April 22-24, 2023 (9:00 AM - 10:00 AM)",
        price: 149.99,
      },
    ],
    subtotal: 149.99,
    tax: 0.0,
    total: 149.99,
    paymentMethod: "Credit Card (VISA ****1234)",
    paymentStatus: "Paid",
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
                    <p className="font-medium">{invoiceData.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoiceData.customerEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoiceData.customerPhone}
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
                            ${item.price.toFixed(2)}
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
                    <span>${invoiceData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${invoiceData.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium text-lg border-t">
                    <span>Total</span>
                    <span>${invoiceData.total.toFixed(2)}</span>
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
