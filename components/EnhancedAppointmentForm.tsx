"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createAppointment } from "@/lib/actions/appointments";
import { Calendar, Clock, MapPin, User, Scissors, Star } from "lucide-react";

// Enhanced schema with dropdown validation
const enhancedAppointmentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z
    .string()
    .regex(
      /^09\d{9}$/,
      "Mobile number must be a valid PH number (e.g., 09171234567)",
    ),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  branch: z.string().min(1, "Branch is required"),
  barber: z.string().min(1, "Barber is required"),
  services: z.string().min(1, "Service is required"),
});

type FormData = z.infer<typeof enhancedAppointmentSchema>;

interface AppointmentData {
  branches: Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
    hours: string;
  }>;
  barbers: Array<{
    id: string;
    name: string;
    specialties: string[];
    experience: string;
    rating: number;
    branches: string[];
  }>;
  services: Array<{
    category: string;
    title: string;
    description: string;
    price: string;
  }>;
  availableDates: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const EnhancedAppointmentForm = () => {
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(enhancedAppointmentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      appointmentDate: "",
      appointmentTime: "",
      branch: "",
      barber: "",
      services: "",
    },
  });

  // Check if all required fields are filled
  const isFormComplete = () => {
    const values = form.getValues();
    const complete = !!(
      values.fullName &&
      values.email &&
      values.mobileNumber &&
      values.branch &&
      values.barber &&
      values.services &&
      values.appointmentDate &&
      values.appointmentTime
    );
    return complete;
  };

  // Removed the problematic useEffect that was causing infinite loops

  // Fetch appointment data on component mount
  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        const response = await fetch("/api/appointments/data");
        const result = await response.json();
        
        if (result.success) {
          setAppointmentData(result.data);
        } else {
          toast.error("Failed to load appointment data");
        }
      } catch (error) {
        console.error("Error fetching appointment data:", error);
        toast.error("Failed to load appointment data");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentData();
  }, []);

  // Fetch barbers when branch changes
  const [availableBarbers, setAvailableBarbers] = useState<any[]>([]);

  useEffect(() => {
    const fetchBarbersForBranch = async (branchId: string) => {
      try {
        const response = await fetch(`/api/appointments/data?branchId=${branchId}`);
        const result = await response.json();
        
        if (result.success) {
          setAvailableBarbers(result.data.barbers);
        } else {
          setAvailableBarbers([]);
        }
      } catch (error) {
        console.error("Error fetching barbers for branch:", error);
        setAvailableBarbers([]);
      }
    };

    if (selectedBranch) {
      fetchBarbersForBranch(selectedBranch);
    } else {
      setAvailableBarbers([]);
    }
  }, [selectedBranch]);

  // Check availability when branch, barber, or date changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedBranch && selectedBarber && selectedDate) {
        checkAvailability();
      } else {
        setTimeSlots([]);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [selectedBranch, selectedBarber, selectedDate]);

  // Periodically refresh availability to handle concurrent bookings
  useEffect(() => {
    if (!selectedBranch || !selectedBarber || !selectedDate) {
      return;
    }

    const intervalId = setInterval(() => {
      checkAvailability();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [selectedBranch, selectedBarber, selectedDate]);

  const checkAvailability = async () => {
    if (!selectedBranch || !selectedBarber || !selectedDate) {
      return;
    }
    
    setCheckingAvailability(true);
    try {
      const response = await fetch(
        `/api/appointments/availability?date=${selectedDate}&barberId=${selectedBarber}&branchId=${selectedBranch}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots(result.data.timeSlots);
      } else {
        console.error("Availability check failed:", result.error);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setTimeSlots([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (data: FormData) => {
    console.log("Form submitted with data:", data);
    try {
      const result = await createAppointment(data);
      
      if (result.success) {
        toast.success("Appointment Booked!", {
          description: "Your appointment was submitted successfully.",
        });
        form.reset();
        setSelectedBranch("");
        setSelectedBarber("");
        setSelectedDate("");
        setSelectedTime("");
        setTimeSlots([]);
      } else {
        // If it's a booking conflict, refresh the time slots
        if (result.error?.includes("already booked")) {
          toast.error("This time slot is no longer available. Please select a different time.", {
            description: "The time slots have been refreshed.",
          });
          // Refresh availability
          if (selectedBranch && selectedBarber && selectedDate) {
            checkAvailability();
          }
        } else {
          toast.error("Error booking appointment", {
            description: result.error ?? "An error occurred",
          });
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An error occurred while booking your appointment");
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    form.setValue("branch", branchId);
    setSelectedBarber("");
    setSelectedDate("");
    form.setValue("barber", "");
    form.setValue("appointmentDate", "");
    form.setValue("appointmentTime", "");
  };

  const handleBarberChange = (barberId: string) => {
    setSelectedBarber(barberId);
    form.setValue("barber", barberId);
    setSelectedDate("");
    form.setValue("appointmentDate", "");
    form.setValue("appointmentTime", "");
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    form.setValue("appointmentDate", date);
    form.setValue("appointmentTime", "");
    setSelectedTime("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading appointment form...</span>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load appointment data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Book Your Appointment
        </h1>
        <p className="text-gray-600">
          Choose your preferred branch, barber, and service to schedule your appointment.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="09171234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Branch Selection */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Branch
            </h2>
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select onValueChange={handleBranchChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentData.branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{branch.name}</span>
                            <span className="text-sm text-gray-500">{branch.address}</span>
                            <span className="text-sm text-gray-500">{branch.hours}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Barber Selection */}
          {selectedBranch && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Select Barber
              </h2>
              <FormField
                control={form.control}
                name="barber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barber</FormLabel>
                    <Select onValueChange={handleBarberChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a barber" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBarbers.length > 0 ? (
                          availableBarbers.map((barber) => (
                            <SelectItem key={barber.id} value={barber.id}>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{barber.name}</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{barber.rating}</span>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-500">{barber.experience} experience</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {barber.specialties.map((specialty: string) => (
                                    <Badge key={specialty} variant="secondary" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">
                            No barbers available at this branch
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Service Selection */}
          {selectedBarber && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Select Service</h2>
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {appointmentData.services.map((service, index) => (
                          <SelectItem key={index} value={service.title}>
                            <div className="flex flex-col">
                              <span className="font-medium">{service.title}</span>
                              <span className="text-sm text-gray-500">{service.description}</span>
                              <span className="text-sm font-medium text-green-600">₱{service.price}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Date and Time Selection */}
          {selectedBarber && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Date & Time
              </h2>
              
              {/* Date Selection */}
              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Date</FormLabel>
                      <Select onValueChange={handleDateChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a date" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {appointmentData.availableDates.map((date) => (
                            <SelectItem key={date} value={date}>
                              {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <FormField
                    control={form.control}
                    name="appointmentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Time</FormLabel>
                        {checkingAvailability ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            <span className="text-sm text-gray-500">Checking availability...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {timeSlots.map((slot) => (
                              <Button
                                key={slot.time}
                                type="button"
                                variant={
                                  !slot.available 
                                    ? "ghost" 
                                    : field.value === slot.time 
                                    ? "default" 
                                    : "outline"
                                }
                                disabled={!slot.available}
                                className={`h-12 ${
                                  slot.available
                                    ? field.value === slot.time
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "hover:bg-green-50 hover:border-green-300"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                                onClick={() => {
                                  if (slot.available) {
                                    field.onChange(slot.time);
                                    setSelectedTime(slot.time);
                                    console.log("Selected time:", slot.time); // Debug log
                                  }
                                }}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                {slot.time}
                                {!slot.available && (
                                  <Badge variant="destructive" className="ml-1 text-xs">
                                    Booked
                                  </Badge>
                                )}
                                {slot.available && field.value === slot.time && (
                                  <Badge variant="secondary" className="ml-1 text-xs bg-white text-blue-600">
                                    Selected
                                  </Badge>
                                )}
                              </Button>
                            ))}
                          </div>
                        )}
                        {selectedTime && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800">
                              <strong>Selected Time:</strong> {selectedTime}
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-lg"
            disabled={checkingAvailability}
          >
            Book Appointment
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EnhancedAppointmentForm; 