"use server";

import { db } from "@/database/drizzle";
import { appointments } from "@/database/schema"; // make sure it's exported

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
    await db.insert(appointments).values({
      ...data,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, error: "Database error" };
  }
};
