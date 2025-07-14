"use client";

import React from "react";
import AppointmentForm from "@/components/AppointmentForm";
import { FieldValues } from "react-hook-form";
import { appointmentSchema } from "@/lib/validations";
import { createAppointment } from "@/lib/actions/appointments";

const Page = () => (
  <AppointmentForm
    schema={appointmentSchema}
    defaultValues={{
      fullName: "",
      email: "",
      mobileNumber: "",
      appointmentDate: "",
      appointmentTime: "",
      branch: "",
      barber: "",
      services: "",
    }}
    onSubmit={createAppointment}
  />
);
export default Page;
