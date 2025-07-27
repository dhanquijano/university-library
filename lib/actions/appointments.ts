"use server";

import { db } from "@/database/drizzle";
import { appointments } from "@/database/schema";
import { eq, and } from "drizzle-orm";

export const createAppointment = async (data: {
  fullName: string;
  email: string;
  mobileNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  branch: string;
  barber: string;
  services: string;
}) => {
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

    const branch = branches.find((b: any) => b.id === data.branch);
    const barber = barbers.find((b: any) => b.id === data.barber);

    const branchName = branch?.name || data.branch;
    const barberName = barber?.name || data.barber;

    // Check for existing appointment with the same date, time, branch, and barber
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentDate, data.appointmentDate),
          eq(appointments.appointmentTime, data.appointmentTime),
          eq(appointments.branch, branchName),
          eq(appointments.barber, barberName)
        )
      )
      .limit(1);

    if (existingAppointment.length > 0) {
      return { 
        success: false, 
        error: "This time slot is already booked. Please select a different time." 
      };
    }

    // Create the appointment if no conflict exists
    await db.insert(appointments).values({
      fullName: data.fullName,
      email: data.email,
      mobileNumber: data.mobileNumber,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      branch: branchName,
      barber: barberName,
      services: data.services,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, error: "Database error" };
  }
};

export const getAllAppointments = async () => {
  try {
    const allAppointments = await db.select().from(appointments);
    return { success: true, data: allAppointments };
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return { success: false, error: "Database error" };
  }
};

export const deleteAppointment = async (id: string) => {
  try {
    await db.delete(appointments).where(eq(appointments.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return { success: false, error: "Database error" };
  }
};

export const updateAppointment = async (id: string, data: {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  branch?: string;
  barber?: string;
  services?: string;
}) => {
  try {
    await db.update(appointments)
      .set(data)
      .where(eq(appointments.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating appointment:", error);
    return { success: false, error: "Database error" };
  }
};
