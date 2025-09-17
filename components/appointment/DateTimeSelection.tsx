import React, { useMemo, useState } from "react";
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
        render={({ field }: any) => {
          // Calendar state: default to month of first available date
          const first = appointmentData.availableDates[0];
          const [initialYear, initialMonth] = first
            ? first.split("-").map(Number)
            : [new Date().getFullYear(), new Date().getMonth() + 1];
          const [viewYear, setViewYear] = useState<number>(initialYear);
          const [viewMonth, setViewMonth] = useState<number>(initialMonth); // 1-12

          const availableSet = useMemo(() => new Set(appointmentData.availableDates), [appointmentData.availableDates]);

          const monthLabel = useMemo(() => {
            const d = new Date(viewYear, viewMonth - 1, 1);
            return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          }, [viewYear, viewMonth]);

          const weeks = useMemo(() => {
            const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1);
            const startWeekday = firstDayOfMonth.getDay(); // 0 Sun - 6 Sat
            const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
            const days: Array<{ date: string | null; disabled: boolean }>[] = [];
            let week: Array<{ date: string | null; disabled: boolean }> = [];

            // Leading blanks
            for (let i = 0; i < startWeekday; i++) {
              week.push({ date: null, disabled: true });
            }

            for (let day = 1; day <= daysInMonth; day++) {
              const iso = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isAvailable = availableSet.has(iso);
              week.push({ date: iso, disabled: !isAvailable });
              if (week.length === 7) {
                days.push(week);
                week = [];
              }
            }

            if (week.length) {
              while (week.length < 7) week.push({ date: null, disabled: true });
              days.push(week);
            }
            return days;
          }, [viewYear, viewMonth, availableSet]);

          const canGoPrev = useMemo(() => {
            const min = appointmentData.availableDates[0];
            if (!min) return false;
            const minDate = new Date(min);
            const viewDate = new Date(viewYear, viewMonth - 1, 1);
            return viewDate > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
          }, [appointmentData.availableDates, viewYear, viewMonth]);

          const canGoNext = useMemo(() => {
            const max = appointmentData.availableDates[appointmentData.availableDates.length - 1];
            if (!max) return false;
            const maxDate = new Date(max);
            const viewDate = new Date(viewYear, viewMonth - 1, 1);
            return viewDate < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
          }, [appointmentData.availableDates, viewYear, viewMonth]);

          const goPrev = () => {
            if (!canGoPrev) return;
            const m = viewMonth - 1;
            if (m < 1) {
              setViewMonth(12);
              setViewYear(viewYear - 1);
            } else {
              setViewMonth(m);
            }
          };

          const goNext = () => {
            if (!canGoNext) return;
            const m = viewMonth + 1;
            if (m > 12) {
              setViewMonth(1);
              setViewYear(viewYear + 1);
            } else {
              setViewMonth(m);
            }
          };

          const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          return (
            <FormItem>
              <FormLabel>Appointment Date</FormLabel>
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <button type="button" className="px-2 py-1 border rounded disabled:opacity-50" onClick={goPrev} disabled={!canGoPrev}>
                    Prev
                  </button>
                  <div className="font-medium">{monthLabel}</div>
                  <button type="button" className="px-2 py-1 border rounded disabled:opacity-50" onClick={goNext} disabled={!canGoNext}>
                    Next
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-1">
                  {weekdayHeaders.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weeks.map((row, i) => (
                    <React.Fragment key={i}>
                      {row.map((cell, j) => {
                        const isSelected = cell.date && field.value === cell.date;
                        return (
                          <button
                            key={`${i}-${j}`}
                            type="button"
                            disabled={!cell.date || cell.disabled}
                            onClick={() => {
                              if (!cell.date || cell.disabled) return;
                              field.onChange(cell.date);
                              onDateChange(cell.date);
                            }}
                            className={
                              `h-10 rounded-md border text-sm ` +
                              `${!cell.date || cell.disabled ? "opacity-40 cursor-not-allowed " : "hover:bg-green-50 hover:border-green-300 "}` +
                              `${isSelected ? "bg-blue-600 text-white hover:bg-blue-700 " : ""}`
                            }
                          >
                            {cell.date ? Number(cell.date.split("-")[2]).toString() : ""}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          );
        }}
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
                          Not Available
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