import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentData } from "./types";

interface ServiceSelectionProps {
  form: any;
  appointmentData: AppointmentData;
}

const ServiceSelection = ({ 
  form, 
  appointmentData 
}: ServiceSelectionProps) => (
  <div className="bg-white rounded-lg border p-6">
    <h2 className="text-xl font-semibold mb-4">Select Service</h2>
    <FormField
      control={form.control}
      name="services"
      render={({ field }: any) => (
        <FormItem>
          <FormLabel>Service</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="text-center items-center min-h-[4.5rem] py-2">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {appointmentData.services.map((service, index) => (
                <SelectItem key={index} value={service.title}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {service.title}
                    </span>
                    <span className="text-sm text-gray-500">
                      {service.description}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      ₱{service.price}
                    </span>
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
);

export default ServiceSelection;