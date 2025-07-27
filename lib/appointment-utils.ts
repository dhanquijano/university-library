import { db } from "@/database/drizzle";
import { appointments } from "@/database/schema";
import { eq, and } from "drizzle-orm";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AppointmentAvailability {
  date: string;
  timeSlots: TimeSlot[];
}

// Generate time slots for a given date range
export const generateTimeSlots = (startTime: string = "09:00", endTime: string = "20:00", interval: number = 30): string[] => {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (
    currentHour < endHour || 
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
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
  branchId: string
): Promise<TimeSlot[]> => {
  try {
    // Get branch and barber names from the IDs
    const [branchesResponse, barbersResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/branches.json`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/barbers.json`)
    ]);

    const [branches, barbers] = await Promise.all([
      branchesResponse.json(),
      barbersResponse.json()
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
          eq(appointments.branch, branchName)
        )
      );

    // Generate all possible time slots
    const allTimeSlots = generateTimeSlots();
    
    // Get booked times
    const bookedTimes = existingAppointments.map(apt => apt.appointmentTime);
    
    // Create time slots with availability
    const timeSlots: TimeSlot[] = allTimeSlots.map(time => ({
      time,
      available: !bookedTimes.includes(time)
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
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  return dates;
};

// Check if a specific time slot is available
export const isTimeSlotAvailable = async (
  date: string,
  time: string,
  barberId: string,
  branchId: string
): Promise<boolean> => {
  try {
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentDate, date),
          eq(appointments.appointmentTime, time),
          eq(appointments.barber, barberId),
          eq(appointments.branch, branchId)
        )
      )
      .limit(1);

    return existingAppointment.length === 0;
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    return false;
  }
};

// Get branch operating hours
export const getBranchHours = (branchId: string): { start: string; end: string } => {
  // This could be fetched from a database or configuration
  // For now, returning default hours
  return {
    start: "09:00",
    end: "20:00"
  };
}; 