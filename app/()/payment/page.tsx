"use client";

import { IconCash, IconCalculator, IconCreditCard } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface RoomWithPerson {
  _id: string;
  readable_id: number;
  rent: number;
  water_price: number;
  person_name: string;
  person_id: string;
  is_occupied: boolean;
  deadline_day: number | null;
  assignment_date_bs: string | null;
}

interface PaymentRecord {
  _id: string;
  room_readable_id: number;
  person_name: string;
  payment_month: string; // e.g., "2082-05" (BS YYYY-MM format)
  payment_month_name: string; // e.g., "Kartik 2081"
  payment_month_name_nepali?: string; // e.g., "कार्तिक"
  electricity_units: number;
  electricity_cost: number;
  water_cost: number;
  rent_cost: number;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  payment_date_ad: string;
  payment_method: string;
  status: string;
}

export default function Payment() {
  const [rooms, setRooms] = useState<RoomWithPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithPerson | null>(null);
  const [electricityUnits, setElectricityUnits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthPopoverOpen, setMonthPopoverOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [previousBalance, setPreviousBalance] = useState(0);
  const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");

  async function fetchOccupiedRooms() {
    try {
      setLoading(true);
      const res = await fetch("/api/room");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const json = await res.json();
      const allRooms = json.data || [];

      // Filter only occupied rooms (rooms with people)
      const occupiedRooms = allRooms.filter(
        (room: any) => room.is_occupied && room.person_name
      );
      setRooms(occupiedRooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentPayments() {
    try {
      const res = await fetch("/api/payment?limit=20&sort=-payment_date_ad");
      if (!res.ok) throw new Error("Failed to fetch payments");
      const json = await res.json();
      setRecentPayments(json.data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  }

  async function fetchPreviousBalance(roomId: string, personId: string) {
    try {
      const res = await fetch(
        `/api/payment?room_id=${roomId}&person_id=${personId}&limit=1`
      );
      if (!res.ok) return { balance: 0, lastPayment: null };
      const json = await res.json();
      const lastPayment = json.data?.[0];
      return { 
        balance: lastPayment?.remaining_balance || 0,
        lastPayment: lastPayment || null
      };
    } catch (err) {
      console.error("Error fetching previous balance:", err);
      return { balance: 0, lastPayment: null };
    }
  }

  // Generate Bikram Sambat month options (6 months before to 6 months after current month)
  const generateMonthOptions = () => {
    const months = [];

    // Current BS date (6th month, 16th day - Ashwin 16, 2082)
    const currentBSYear = 2082;
    const currentBSMonth = 6; // Ashwin (6th month in BS calendar)

    // Generate 13 months: 6 before + current + 6 after
    for (let i = -6; i <= 6; i++) {
      // Calculate BS date for each month
      let bsYear = currentBSYear;
      let bsMonth = currentBSMonth + i;

      // Handle year underflow and overflow
      while (bsMonth < 1) {
        bsMonth += 12;
        bsYear -= 1;
      }
      while (bsMonth > 12) {
        bsMonth -= 12;
        bsYear += 1;
      }

      // Create value in BS format for storage
      const value = `${bsYear}-${String(bsMonth).padStart(2, "0")}`;

      // Nepali month names in order
      const nepaliMonths = [
        "बैशाख",
        "जेष्ठ",
        "आषाढ",
        "श्रावण",
        "भाद्र",
        "आश्विन",
        "कार्तिक",
        "मंसिर",
        "पौष",
        "माघ",
        "फाल्गुन",
        "चैत्र",
      ];

      const monthName = nepaliMonths[bsMonth - 1];
      const label = `${monthName} ${bsYear}`;

      months.push({ value, label, bsYear, bsMonth, monthName });
    }
    return months;
  };

  const monthOptions = generateMonthOptions();

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  // Get all overdue months for a room
  const getOverdueMonths = (room: RoomWithPerson): { monthKey: string; monthName: string; status: 'missing' | 'partial'; remainingAmount?: number }[] => {
    const roomPayments = recentPayments.filter(
      payment => payment.room_readable_id === room.readable_id
    );
    
    const currentBSYear = 2082;
    const currentBSMonth = 6; // Ashwin (6th month in BS calendar)
    
    // Check if this is a new tenant
    if (isNewTenant(room, currentBSYear, currentBSMonth)) {
      return []; // New tenants have no overdue months
    }
    
    // Get tenant assignment month to determine when to start checking
    let startCheckingFromMonth = 1; // Default to start of year
    if (room.assignment_date_bs) {
      try {
        const parts = room.assignment_date_bs.split('-');
        if (parts.length === 3) {
          const assignmentYear = parseInt(parts[0]);
          const assignmentMonth = parseInt(parts[1]);
          if (assignmentYear === currentBSYear) {
            startCheckingFromMonth = assignmentMonth; // Start from assignment month
          }
        }
      } catch (error) {
        console.error('Error parsing assignment date:', error);
      }
    }
    
    const overdueMonths = [];
    
    // Check from assignment month to current month
    for (let month = startCheckingFromMonth; month <= currentBSMonth; month++) {
      const monthKey = `${currentBSYear}-${String(month).padStart(2, '0')}`;
      const monthName = getNepaliMonthName(month);
      
      // Find payment for this month
      const monthPayment = roomPayments.find(payment => {
        return payment.payment_month === monthKey ||
               (payment.payment_month_name && 
                payment.payment_month_name.includes(String(currentBSYear)) &&
                payment.payment_month_name.includes(monthName));
      });
      
      // Check if month is overdue
      if (!monthPayment) {
        // No payment at all
        overdueMonths.push({
          monthKey,
          monthName: `${monthName} ${currentBSYear}`,
          status: 'missing' as const
        });
      } else if (monthPayment.status === 'partial') {
        // Partial payment
        overdueMonths.push({
          monthKey,
          monthName: `${monthName} ${currentBSYear}`,
          status: 'partial' as const,
          remainingAmount: monthPayment.remaining_balance
        });
      }
    }
    
    return overdueMonths;
  };

  // Check if a room has overdue payments (simplified - just check if any overdue months exist)
  const isRoomOverdue = (room: RoomWithPerson): boolean => {
    const overdueMonths = getOverdueMonths(room);
    return overdueMonths.length > 0;
  };
  
  // Helper function to get Nepali month name by number
  const getNepaliMonthName = (monthNumber: number): string => {
    const nepaliMonths = [
      "बैशाख", "जेष्ठ", "आषाढ", "श्रावण", "भाद्र", "आश्विन",
      "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत्र"
    ];
    return nepaliMonths[monthNumber - 1] || "";
  };

  // Check if tenant is new (assigned this month - only exempt for their assignment month)
  const isNewTenant = (room: RoomWithPerson, currentBSYear: number, currentBSMonth: number): boolean => {
    if (!room.assignment_date_bs) return false;
    
    try {
      // Parse assignment date (format: YYYY-MM-DD)
      const parts = room.assignment_date_bs.split('-');
      if (parts.length !== 3) return false;
      
      const assignmentYear = parseInt(parts[0]);
      const assignmentMonth = parseInt(parts[1]);
      
      // Only consider "new" if assigned in the current month (same year and month)
      // This gives them grace period only for their first month
      return (assignmentYear === currentBSYear && assignmentMonth === currentBSMonth);
    } catch (error) {
      console.error('Error parsing assignment date:', error);
      return false;
    }
  };

  // Sort rooms - overdue first, then others
  const sortedRooms = [...rooms].sort((a, b) => {
    const aOverdue = isRoomOverdue(a);
    const bOverdue = isRoomOverdue(b);
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.readable_id - b.readable_id; // Sort by room number if same overdue status
  });

  useEffect(() => {
    fetchOccupiedRooms();
    fetchRecentPayments();
  }, []);

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculate amounts
      const electricityCost = Number(electricityUnits) * 13;
      const waterCost = selectedRoom?.water_price || 0;
      const rentCost = selectedRoom?.rent || 0;
      const totalAmount = electricityCost + waterCost + rentCost;

      // Get selected month name (BS format)
      const selectedMonthData = monthOptions.find(
        (m) => m.value === selectedMonth
      );
      const selectedMonthName = selectedMonthData?.label || "";
      const selectedMonthNameNepali = selectedMonthData?.monthName || "";

      // Process payment via API
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom?._id,
          person_id: selectedRoom?.person_id,
          payment_month: selectedMonth, // BS format: YYYY-MM
          payment_month_name: selectedMonthName, // e.g., "Kartik 2081"
          payment_month_name_nepali: selectedMonthNameNepali, // e.g., "कार्तिक"
          electricity_units: Number(electricityUnits),
          electricity_cost: electricityCost,
          water_cost: waterCost,
          rent_cost: rentCost,
          total_amount: monthlyTotal,
          amount_paid: paidAmount,
          remaining_balance: remainingBalance,
          previous_balance: previousBalance,
          payment_method: paymentMethod,
          status: getPaymentStatus(),
          notes: `Payment for ${selectedMonthName} (BS) - Room #${selectedRoom?.readable_id} - ${selectedRoom?.person_name}`,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message =
          errorBody?.message ||
          `Failed to process payment (HTTP ${res.status})`;
        throw new Error(message);
      }

      const data = await res.json().catch(() => ({}));
      setAlertTitle("Payment Processed");
      setAlertDescription(
        data?.message ||
          `Payment of रु ${totalAmount} processed successfully for ${selectedRoom?.person_name}`
      );
      setAlertOpen(true);
      setPaymentOpen(false);
      setElectricityUnits("");
      setSelectedRoom(null);

      // Refresh recent payments list
      fetchRecentPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setAlertTitle("Payment Error");
      setAlertDescription(message);
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentDialog = async (room: RoomWithPerson) => {
    setSelectedRoom(room);
    setElectricityUnits("");
    setAmountPaid("");
    setPaymentMethod("cash");

    // Set current BS month as default (Ashwin 2082)
    const currentMonth = `2082-06`; // Ashwin 2082
    setSelectedMonth(currentMonth);

    // Fetch previous balance and payment info
    const { balance, lastPayment: lastPaymentData } = await fetchPreviousBalance(room._id, room.person_id);
    setPreviousBalance(balance);
    setLastPayment(lastPaymentData);

    setPaymentOpen(true);
  };

  // Check if we're completing a partial payment
  const isCompletingPartialPayment = lastPayment && 
    lastPayment.status === "partial" && 
    lastPayment.payment_month === selectedMonth;

  const electricityCost = Number(electricityUnits) * 13 || 0;
  const waterCost = selectedRoom?.water_price || 0;
  
  // If completing a partial payment, don't add rent again
  const rentCost = isCompletingPartialPayment ? 0 : (selectedRoom?.rent || 0);
  
  const monthlyTotal = electricityCost + waterCost + rentCost;
  const totalDue = monthlyTotal + previousBalance;
  const paidAmount = Number(amountPaid) || 0;
  const remainingBalance = totalDue - paidAmount;

  // Determine payment status
  const getPaymentStatus = () => {
    if (paidAmount === 0) return "pending";
    if (paidAmount >= totalDue)
      return remainingBalance < 0 ? "overpaid" : "completed";
    return "partial";
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Payment Management</h1>
        <p className="text-muted-foreground">
          Manage payments for occupied rooms using Bikram Sambat calendar
        </p>
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p>No occupied rooms found.</p>
      ) : (
        <div className="grid gap-4">
          {sortedRooms.map((room) => {
            const isOverdue = isRoomOverdue(room);
            return (
              <div
                key={room._id}
                className={`border rounded-lg p-4 flex justify-between items-center ${
                  isOverdue 
                    ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" 
                    : "bg-card"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-lg ${isOverdue ? "text-red-700 dark:text-red-300" : ""}`}>
                      Room #{room.readable_id}
                    </h3>
                    {isOverdue && (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tenant: {room.person_name}
                  </p>
                  <div className="text-sm space-y-1">
                    <p>Rent: रु {room.rent}</p>
                    <p>Water: रु {room.water_price}</p>
                    <p className="text-xs text-muted-foreground">
                      + Electricity (units × रु 13)
                    </p>
                     {room.deadline_day && (
                       <p className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                         Payment due: {room.deadline_day}{getOrdinalSuffix(room.deadline_day)} of every month
                       </p>
                     )}
                     {isNewTenant(room, 2082, 6) && (
                       <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                         🆕 New tenant - assigned this month
                       </p>
                     )}
                     {isOverdue && (
                       <div className="text-xs text-red-600 dark:text-red-400 font-medium space-y-1">
                         {(() => {
                           const overdueMonths = getOverdueMonths(room);
                           return overdueMonths.map((month, index) => (
                             <p key={month.monthKey}>
                               {month.status === 'missing' 
                                 ? `⚠️ Payment for ${month.monthName} not received`
                                 : `⚠️ Partial payment for ${month.monthName} - रु ${month.remainingAmount} remaining`
                               }
                             </p>
                           ));
                         })()}
                       </div>
                     )}
                  </div>
                </div>
                <Button
                  onClick={() => openPaymentDialog(room)}
                  className={`flex items-center gap-2 ${
                    isOverdue 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : ""
                  }`}
                >
                  <IconCash size={16} />
                  Payment
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Payments Section */}
      {recentPayments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
          <div className="grid gap-3">
            {recentPayments.map((payment) => (
              <div
                key={payment._id}
                className="border rounded-lg p-3 bg-muted/30"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      Room #{payment.room_readable_id} - {payment.person_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-primary">
                        Payment for: {payment.payment_month_name}
                      </span>{" "}
                      (Bikram Sambat)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid on:{" "}
                      {new Date(payment.payment_date_ad).toLocaleDateString()}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Electricity: {payment.electricity_units} kWh (रु{" "}
                      {payment.electricity_cost}) • Water: रु{" "}
                      {payment.water_cost} • Rent: रु {payment.rent_cost} •
                      {payment.payment_method.charAt(0).toUpperCase() +
                        payment.payment_method.slice(1)}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="text-muted-foreground">
                        Paid: रु {payment.amount_paid}
                      </span>
                      {payment.remaining_balance !== 0 && (
                        <span
                          className={`ml-2 ${
                            payment.remaining_balance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {payment.remaining_balance > 0
                            ? "Due: "
                            : "Overpaid: "}
                          रु {Math.abs(payment.remaining_balance)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      रु {payment.total_amount}
                    </p>
                    <p
                      className={`text-xs capitalize ${
                        payment.status === "completed"
                          ? "text-green-600"
                          : payment.status === "partial"
                          ? "text-yellow-600"
                          : payment.status === "overpaid"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                    >
                      {payment.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Calculate and process payment for {selectedRoom?.person_name} -
              Room #{selectedRoom?.readable_id}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* Month Selection */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Payment Month (Bikram Sambat)
              </label>
              <Popover
                open={monthPopoverOpen}
                onOpenChange={setMonthPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-between"
                  >
                    {selectedMonth
                      ? monthOptions.find((m) => m.value === selectedMonth)
                          ?.label
                      : "Select month"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search month..." />
                    <CommandList>
                      <CommandEmpty>No months found.</CommandEmpty>
                      <CommandGroup>
                        {monthOptions.map((month) => (
                          <CommandItem
                            key={month.value}
                            onSelect={() => {
                              setSelectedMonth(month.value);
                              setMonthPopoverOpen(false);
                            }}
                          >
                            {month.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Method */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                  />
                  <IconCash size={16} />
                  <span className="text-sm">Cash</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                  />
                  <IconCreditCard size={16} />
                  <span className="text-sm">Online</span>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="electricity" className="text-sm font-medium">
                Electricity Units (kWh)
              </label>
              <input
                id="electricity"
                type="number"
                min="0"
                step="0.1"
                value={electricityUnits}
                onChange={(e) => setElectricityUnits(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder="Enter electricity units"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="amountPaid" className="text-sm font-medium">
                Amount Paid (रु)
              </label>
              <input
                id="amountPaid"
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder="Enter amount paid"
                required
              />
            </div>

             {/* Enhanced Calculation Display */}
             <div className="bg-muted rounded-lg p-4 space-y-3">
               <div className="flex items-center gap-2 text-sm font-medium">
                 <IconCalculator size={16} />
                 Payment Calculation
               </div>
               
               {isCompletingPartialPayment && (
                 <div className="bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded p-2 text-xs">
                   <p className="text-blue-800 dark:text-blue-200 font-medium">
                     📝 Completing partial payment for {lastPayment?.payment_month_name}
                   </p>
                   <p className="text-blue-600 dark:text-blue-300">
                     Rent already charged in previous payment. Only electricity and water charges apply.
                   </p>
                 </div>
               )}

              <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span>Rent:</span>
                   <span className={isCompletingPartialPayment ? "text-muted-foreground line-through" : ""}>
                     रु {selectedRoom?.rent || 0}
                     {isCompletingPartialPayment && " (already charged)"}
                   </span>
                 </div>
                <div className="flex justify-between">
                  <span>Water:</span>
                  <span>रु {waterCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Electricity:</span>
                  <span className="text-muted-foreground">
                    {electricityUnits || "0"} × 13 = रु {electricityCost}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Total:</span>
                  <span>रु {monthlyTotal}</span>
                </div>
                {previousBalance !== 0 && (
                  <div className="flex justify-between">
                    <span>Previous Balance:</span>
                    <span
                      className={
                        previousBalance > 0 ? "text-red-600" : "text-green-600"
                      }
                    >
                      रु {previousBalance}
                    </span>
                  </div>
                )}
                <hr className="border-muted-foreground/20" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total Due:</span>
                  <span className="text-primary">रु {totalDue}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>रु {paidAmount}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Remaining:</span>
                  <span
                    className={
                      remainingBalance > 0
                        ? "text-red-600"
                        : remainingBalance < 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    रु {remainingBalance}
                    {remainingBalance > 0 && " (Due)"}
                    {remainingBalance < 0 && " (Overpaid)"}
                    {remainingBalance === 0 && " (Paid)"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedMonth}>
                {submitting ? "Processing..." : `Record Payment`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
