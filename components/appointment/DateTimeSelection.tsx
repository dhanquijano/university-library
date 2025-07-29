import React from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { AppointmentData, TimeSlot } from "./types";

interface DateTimeSelectionProps {
  form: any;
  appointmentData: AppointmentData;
  selectedDate: string;
  onDateChange: (date: string) => void;
  timeSlots: TimeSlot[];
  checkingAvailability: boolean;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const DateTimeSelection = ({ 
  form, 
  appointmentData, 
  selectedDate, 
  onDateChange, 
  timeSlots, 
  checkingAvailability, 
  selectedTime, 
  onTimeSelect 
}: DateTimeSelectionProps) => (
  <div className="bg-white rounded-lg border p-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
      <Calendar className="h-5 w-5" />
      Select Date & Time
    </h2>

    {/* Date Selection */}
    <div className="mb-4">
      <FormField
        control={form.control}
        name="appointmentDate"
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Appointment Date</FormLabel>
            <Select
              onValueChange={onDateChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a date" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {appointmentData.availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    {/* Time Selection */}
    {selectedDate && (
      <div>
        <FormField
          control={form.control}
          name="appointmentTime"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Appointment Time</FormLabel>
              {checkingAvailability ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-gray-500">
                    Checking availability...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={
                        !slot.available
                          ? "ghost"
                          : field.value === slot.time
                            ? "default"
                            : "outline"
                      }
                      disabled={!slot.available}
                      className={`h-12 ${
                        slot.available
                          ? field.value === slot.time
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "hover:bg-green-50 hover:border-green-300"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (slot.available) {
                          field.onChange(slot.time);
                          onTimeSelect(slot.time);
                        }
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {slot.time}
                      {!slot.available && (
                        <Badge
                          variant="destructive"
                          className="ml-1 text-xs"
                        >
                          Booked
                        </Badge>
                      )}
                      {slot.available &&
                        field.value === slot.time && (
                          <Badge
                            variant="secondary"
                            className="ml-1 text-xs bg-white text-blue-600"
                          >
                            Selected
                          </Badge>
                        )}
                    </Button>
                  ))}
                </div>
              )}
              {selectedTime && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Selected Time:</strong> {selectedTime}
                  </p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    )}
  </div>
);

export default DateTimeSelection;