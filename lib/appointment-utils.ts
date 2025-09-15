import { db } from "@/database/drizzle";
import { appointments } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import redis from "@/database/redis";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AppointmentAvailability {
  date: string;
  timeSlots: TimeSlot[];
}

// Generate time slots for a given date range
export const generateTimeSlots = (
  startTime: string = "09:00",
  endTime: string = "20:00",
  interval: number = 30,
): string[] => {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    slots.push(timeString);

    currentMinute += interval;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
};

// Get available time slots for a specific date and barber
export const getAvailableTimeSlots = async (
  date: string,
  barberId: string,
  branchId: string,
): Promise<TimeSlot[]> => {
  try {
    // Get branch and barber names from the IDs
    const [branchesResponse, barbersResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/branches.json`),
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/barbers.json`),
    ]);

    const [branches, barbers] = await Promise.all([
      branchesResponse.json(),
      barbersResponse.json(),
    ]);

    const branch = branches.find((b: any) => b.id === branchId);
    const barber = barbers.find((b: any) => b.id === barberId);

    const branchName = branch?.name || branchId;
    const barberName = barber?.name || barberId;

    // Get all appointments for the specific date, barber, and branch
    const existingAppointments = await db
      .select({ appointmentTime: appointments.appointmentTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentDate, date),
          eq(appointments.barber, barberName),
          eq(appointments.branch, branchName),
        ),
      );

    // Generate all possible time slots
    const allTimeSlots = generateTimeSlots();

    // Get booked times
    const bookedTimes = existingAppointments.map((apt) => apt.appointmentTime);

    // Get shifts and leaves for staff availability check
    const shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
    const leaves = ((await redis.get("scheduling:leaves")) as any[]) || [];
    const dayShifts = shifts.filter(
      (s) => s.branchId === branchId && s.barberId === barberId && s.date === date
    );
    const dayLeaves = leaves.filter(
      (l) => l.barberId === barberId && l.date === date && l.status === "approved"
    );

    // Helper functions for staff availability
    const withinAnyShift = (time: string) => {
      // If no shifts are scheduled, staff is not available
      if (dayShifts.length === 0) return false;
      
      // If shifts are scheduled, only allow times within those shifts
      return dayShifts.some((s) => time >= s.startTime && time < s.endTime && !(s.breaks || []).some((b: any) => time >= b.startTime && time < b.endTime));
    };
    
    const notOnLeave = (time: string) =>
      dayLeaves.every((l) => {
        if (!l.startTime || !l.endTime) return false; // full-day leave blocks all
        return time < l.startTime || time >= l.endTime;
      });

    // Create time slots with availability (check both booking conflicts and staff scheduling)
    const timeSlots: TimeSlot[] = allTimeSlots.map((time) => ({
      time,
      available: !bookedTimes.includes(time) && withinAnyShift(time) && notOnLeave(time),
    }));

    return timeSlots;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return [];
  }
};

// Get available dates for the next 30 days
export const getAvailableDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Skip Sundays (assuming the salon is closed on Sundays)
    if (date.getDay() !== 0) {
      dates.push(date.toISOString().split("T")[0]);
    }
  }

  return dates;
};

// Check if a specific time slot is available
export const isTimeSlotAvailable = async (
  date: string,
  time: string,
  barberId: string,
  branchId: string,
): Promise<boolean> => {
  try {
    // Check for existing appointments
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentDate, date),
          eq(appointments.appointmentTime, time),
          eq(appointments.barber, barberId),
          eq(appointments.branch, branchId),
        ),
      )
      .limit(1);

    // If there's already an appointment, it's not available
    if (existingAppointment.length > 0) {
      return false;
    }

    // Check staff availability
    const staffAvailability = await isStaffAvailable(date, time, barberId, branchId);
    return staffAvailability.available;
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    return false;
  }
};

// Get branch operating hours
export const getBranchHours = (
  branchId: string,
): { start: string; end: string } => {
  // This could be fetched from a database or configuration
  // For now, returning default hours
  return {
    start: "09:00",
    end: "20:00",
  };
};

export interface Branch {
  id: string;
  name: string;
}

export interface Barber {
  id: string;
  name: string;
  rating: number;
  experience: string;
  specialties: string[];
}

export interface Service {
  title: string;
  description: string;
  price: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AppointmentFormValues {
  branch: string;
  barber: string;
  services: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Check if staff is available for a specific time slot
export const isStaffAvailable = async (
  date: string,
  time: string,
  barberId: string,
  branchId: string,
): Promise<{ available: boolean; reason?: string }> => {
  try {
    // Get shifts and leaves from Redis
    const shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
    const leaves = ((await redis.get("scheduling:leaves")) as any[]) || [];

    // Filter shifts and leaves for the specific date, barber, and branch
    const dayShifts = shifts.filter(
      (s) => s.branchId === branchId && s.barberId === barberId && s.date === date
    );
    const dayLeaves = leaves.filter(
      (l) => l.barberId === barberId && l.date === date && l.status === "approved"
    );

    // Check if barber is on leave
    const isOnLeave = dayLeaves.some((leave) => {
      // If no specific time range, it's a full-day leave
      if (!leave.startTime || !leave.endTime) {
        return true;
      }
      // Check if the appointment time falls within the leave period
      return time >= leave.startTime && time < leave.endTime;
    });

    if (isOnLeave) {
      return { available: false, reason: "Staff member is on approved leave" };
    }

    // If no shifts are scheduled, staff is not available (default business hours don't apply)
    if (dayShifts.length === 0) {
      return { available: false, reason: "No staff scheduled for this time" };
    }

    // Check if the time falls within any scheduled shift
    const isWithinShift = dayShifts.some((shift) => {
      // Check if time is within shift hours
      const withinShiftHours = time >= shift.startTime && time < shift.endTime;
      
      if (!withinShiftHours) {
        return false;
      }

      // Check if time falls within any break period
      const isOnBreak = (shift.breaks || []).some((breakPeriod: any) => 
        time >= breakPeriod.startTime && time < breakPeriod.endTime
      );

      return !isOnBreak;
    });

    if (!isWithinShift) {
      return { available: false, reason: "Staff member is not scheduled during this time" };
    }

    return { available: true };
  } catch (error) {
    console.error("Error checking staff availability:", error);
    return { available: false, reason: "Error checking availability" };
  }
};
