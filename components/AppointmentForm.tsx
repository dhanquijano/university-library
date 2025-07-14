"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefaultValues,
  FieldValues,
  SubmitHandler,
  useForm,
  UseFormReturn,
  Path,
} from "react-hook-form";
import { ZodType } from "zod";

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

import { toast } from "sonner";
import { APPOINTMENT_FIELD_NAMES, APPOINTMENT_FIELD_TYPES } from "@/constants";

interface Props<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
}

const AppointmentForm = <T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
}: Props<T>) => {
  const form: UseFormReturn<T> = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = await onSubmit(data);

    if (result.success) {
      toast("Appointment Booked!", {
        description: "Your appointment was submitted successfully.",
      });

      form.reset();
    } else {
      toast("Error booking appointment", {
        description: result.error ?? "An error occurred",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
        Book Your Appointment
      </h1>
      <p className="text-light-100">
        Please complete all fields to schedule your appointment.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6 w-full"
        >
          {Object.keys(defaultValues).map((field) => (
            <FormField
              key={field}
              control={form.control}
              name={field as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize text-white">
                    {APPOINTMENT_FIELD_NAMES[
                      field.name as keyof typeof APPOINTMENT_FIELD_NAMES
                    ] ?? field.name}
                  </FormLabel>
                  <FormControl>
                    <Input
                      required
                      type={
                        APPOINTMENT_FIELD_TYPES[
                          field.name as keyof typeof APPOINTMENT_FIELD_TYPES
                        ] ?? "text"
                      }
                      {...field}
                      className="form-input "
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="form-btn">
            Submit Appointment
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AppointmentForm;
