import React from "react";
import { Scissors, Star } from "lucide-react";
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
import { Barber } from "./types";

interface BarberSelectionProps {
  form: any;
  availableBarbers: Barber[];
  onBarberChange: (barberId: string) => void;
}

const BarberSelection = ({ 
  form, 
  availableBarbers, 
  onBarberChange 
}: BarberSelectionProps) => {
  const renderBarberInfo = (barber: Barber | "no_preference") => {
    if (barber === "no_preference") {
      return (
        <div className="flex flex-col w-full items-center text-center">
          <span className="font-medium">No Preference</span>
          <span className="text-sm text-gray-500">
            We'll assign a barber for you
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full items-center text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="font-medium">{barber.name}</span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{barber.rating}</span>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {barber.experience} experience
        </span>
        <div className="flex flex-wrap gap-1 mt-1 justify-center">
          {barber.specialties.map((specialty: string) => (
            <Badge
              key={specialty}
              variant="secondary"
              className="text-xs"
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Scissors className="h-5 w-5" />
        Select Barber
      </h2>

      <FormField
        control={form.control}
        name="barber"
        render={({ field }: any) => {
          const selectedBarber =
            field.value === "no_preference"
              ? null
              : availableBarbers.find((b) => b.id === field.value);

          return (
            <FormItem>
              <FormLabel>Barber</FormLabel>
              <Select
                onValueChange={onBarberChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="text-center items-center min-h-[4.5rem] py-2">
                    <SelectValue placeholder="Choose a barber">
                      {field.value === "no_preference"
                        ? renderBarberInfo("no_preference")
                        : selectedBarber &&
                          renderBarberInfo(selectedBarber)}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  <SelectItem
                    value="no_preference"
                    className="!w-full items-start text-left py-2"
                  >
                    {renderBarberInfo("no_preference")}
                  </SelectItem>

                  {availableBarbers.length > 0 ? (
                    availableBarbers.map((barber) => (
                      <SelectItem
                        key={barber.id}
                        value={barber.id}
                        className="!w-full items-start text-left py-2"
                      >
                        {renderBarberInfo(barber)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      No barbers available at this branch
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
};

export default BarberSelection;