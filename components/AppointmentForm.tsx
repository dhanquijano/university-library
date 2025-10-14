"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { createAppointment } from "@/lib/actions/appointments";
import PersonalInformation from "./appointment/PersonalInformation";
import BranchSelection from "./appointment/BranchSelection";
import BarberSelection from "./appointment/BarberSelection";
import ServiceSelection from "./appointment/ServiceSelection";
import DateTimeSelection from "./appointment/DateTimeSelection";
import { AppointmentData, TimeSlot, Barber } from "./appointment/types";

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

const AppointmentForm = () => {
  const [appointmentData, setAppointmentData] =
    useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableBarbers, setAvailableBarbers] = useState<Barber[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

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

  // Fetch appointment data on component mount
  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        const response = await fetch("/api/appointments/data");
        const result = await response.json();

        if (result.success) {
          console.log("Appointment data loaded:", result.data);
          console.log("Services count:", result.data.services?.length || 0);
          if (result.data.services?.length > 0) {
            console.log("First service:", result.data.services[0]);
          }
          setAppointmentData(result.data);
        } else {
          console.error("Failed to load appointment data:", result.error);
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

  // Fetch ALL barbers when branch changes (not just available ones)
  useEffect(() => {
    const fetchAllBarbersForBranch = async (branchId: string) => {
      try {
        // Fetch all barbers for the branch, regardless of availability
        const response = await fetch(
          `/api/appointments/data?branchId=${branchId}&includeAll=true`,
        );
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
      fetchAllBarbersForBranch(selectedBranch);
    } else {
      setAvailableBarbers([]);
    }
  }, [selectedBranch]);

  // Fetch available dates when barber changes
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (selectedBranch && selectedBarber) {
        // If "no preference" is selected, use the global available dates
        if (selectedBarber === 'no_preference') {
          console.log("Using global available dates for no preference:", appointmentData?.availableDates);
          setAvailableDates(appointmentData?.availableDates || []);
          return;
        }

        try {
          const response = await fetch(
            `/api/appointments/available-dates?barberId=${selectedBarber}&branchId=${selectedBranch}`
          );
          const result = await response.json();
          
          if (result.success) {
            setAvailableDates(result.data.availableDates);
          } else {
            setAvailableDates([]);
          }
        } catch (error) {
          console.error("Error fetching available dates:", error);
          setAvailableDates([]);
        }
      } else {
        setAvailableDates([]);
      }
    };

    fetchAvailableDates();
  }, [selectedBranch, selectedBarber, appointmentData]);

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
        `/api/appointments/availability?date=${selectedDate}&barberId=${selectedBarber}&branchId=${selectedBranch}`,
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
          toast.error(
            "This time slot is no longer available. Please select a different time.",
            {
              description: "The time slots have been refreshed.",
            },
          );
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
    setSelectedTime("");
    form.setValue("appointmentDate", "");
    form.setValue("appointmentTime", "");
    setTimeSlots([]);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    form.setValue("appointmentDate", date);
    form.setValue("appointmentTime", "");
    setSelectedTime("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
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
          Choose your preferred branch, barber, and service to schedule your
          appointment.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <PersonalInformation form={form} />
          
          <BranchSelection 
            form={form} 
            appointmentData={appointmentData} 
            onBranchChange={handleBranchChange} 
          />

          {selectedBranch && (
            <BarberSelection 
              form={form} 
              availableBarbers={availableBarbers} 
              onBarberChange={handleBarberChange}
              selectedBranch={selectedBranch}
            />
          )}

          {selectedBarber && appointmentData && (
            <ServiceSelection 
              form={form} 
              appointmentData={appointmentData} 
            />
          )}

          {selectedBarber && selectedBarber !== 'no_preference' && availableDates.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>This barber is currently not available for booking.</strong>
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                The barber may not have any scheduled shifts in the coming days, or may be on leave. 
                Please select a different barber or choose "No Preference" to see available options.
              </p>
            </div>
          )}

          {selectedBarber && availableDates.length > 0 && (
            <DateTimeSelection 
              form={form} 
              appointmentData={appointmentData} 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
              timeSlots={timeSlots} 
              checkingAvailability={checkingAvailability} 
              selectedTime={selectedTime} 
              onTimeSelect={handleTimeSelect}
              availableDates={availableDates}
            />
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

export default AppointmentForm;
