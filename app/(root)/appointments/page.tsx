"use client";

import React from "react";
import AppointmentForm from "@/components/AppointmentForm";
import { FieldValues } from "react-hook-form";
import { appointmentSchema } from "@/lib/validations";
import { createAppointment } from "@/lib/actions/appointments";

const Page = () => (
  <section className="w-full max-w-screen-xl mx-auto px-4">
    <div className="mt-10">
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
    </div>
  </section>
);
export default Page;
