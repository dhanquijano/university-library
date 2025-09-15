"use server";

import { db } from "@/database/drizzle";
import { appointments } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { isStaffAvailable } from "@/lib/appointment-utils";

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
    // Fetch branch and barber lists
    const [branchesResponse, barbersResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/branches.json`),
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/barbers.json`),
    ]);

    const [branches, barbers] = await Promise.all([
      branchesResponse.json(),
      barbersResponse.json(),
    ]);

    const branch = branches.find((b: any) => b.id === data.branch);
    const barber = barbers.find((b: any) => b.id === data.barber);

    const branchName = branch?.name || data.branch;
    const barberName =
      data.barber === "no_preference" ? "" : barber?.name || data.barber;

    // Only check for conflict if a specific barber is selected
    let conflictExists = false;

    if (barberName !== "") {
      const existingAppointment = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.appointmentDate, data.appointmentDate),
            eq(appointments.appointmentTime, data.appointmentTime),
            eq(appointments.branch, branchName),
            eq(appointments.barber, barberName),
          ),
        )
        .limit(1);

      conflictExists = existingAppointment.length > 0;
    }

    if (conflictExists) {
      return {
        success: false,
        error:
          "This time slot is already booked. Please select a different time.",
      };
    }

    // Check staff availability for the selected time slot
    if (barberName !== "") {
      const staffAvailability = await isStaffAvailable(
        data.appointmentDate,
        data.appointmentTime,
        data.barber,
        data.branch
      );

      if (!staffAvailability.available) {
        return {
          success: false,
          error: staffAvailability.reason || "Staff member is not available at this time.",
        };
      }
    }

    // Create the appointment
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

export const updateAppointment = async (
  id: string,
  data: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    branch?: string;
    barber?: string;
    services?: string;
  },
) => {
  try {
    // If updating appointment time, date, branch, or barber, check for conflicts and staff availability
    if (data.appointmentDate || data.appointmentTime || data.branch || data.barber) {
      // Get the current appointment to merge with new data
      const currentAppointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id))
        .limit(1);

      if (currentAppointment.length === 0) {
        return { success: false, error: "Appointment not found" };
      }

      const current = currentAppointment[0];
      const updatedData = { ...current, ...data };

      // Check for conflicts if updating time/date/barber/branch
      if (updatedData.appointmentDate && updatedData.appointmentTime && updatedData.branch && updatedData.barber) {
        // Check for existing appointments (excluding current one)
        const existingAppointment = await db
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.appointmentDate, updatedData.appointmentDate),
              eq(appointments.appointmentTime, updatedData.appointmentTime),
              eq(appointments.branch, updatedData.branch),
              eq(appointments.barber, updatedData.barber),
              // Exclude current appointment
              eq(appointments.id, id)
            ),
          )
          .limit(1);

        if (existingAppointment.length > 0) {
          return {
            success: false,
            error: "This time slot is already booked. Please select a different time.",
          };
        }

        // Check staff availability
        const staffAvailability = await isStaffAvailable(
          updatedData.appointmentDate,
          updatedData.appointmentTime,
          updatedData.barber,
          updatedData.branch
        );

        if (!staffAvailability.available) {
          return {
            success: false,
            error: staffAvailability.reason || "Staff member is not available at this time.",
          };
        }
      }
    }

    await db.update(appointments).set(data).where(eq(appointments.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating appointment:", error);
    return { success: false, error: "Database error" };
  }
};
