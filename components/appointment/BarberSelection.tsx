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
  selectedBranch?: string;
}

const BarberSelection = ({ 
  form, 
  availableBarbers, 
  onBarberChange,
  selectedBranch 
}: BarberSelectionProps) => {
  const [barberAvailability, setBarberAvailability] = React.useState<Record<string, boolean>>({});
  const [checkingAvailability, setCheckingAvailability] = React.useState(false);

  // Check availability for all barbers when component mounts or branch changes
  React.useEffect(() => {
    const checkAllBarbersAvailability = async () => {
      if (!selectedBranch || availableBarbers.length === 0) {
        setBarberAvailability({});
        setCheckingAvailability(false);
        return;
      }

      setCheckingAvailability(true);
      
      try {
        const availabilityPromises = availableBarbers.map(async (barber) => {
          try {
            const response = await fetch(
              `/api/appointments/available-dates?barberId=${barber.id}&branchId=${selectedBranch}`
            );
            const result = await response.json();
            return {
              barberId: barber.id,
              hasAvailability: result.success && result.data.availableDates.length > 0
            };
          } catch (error) {
            console.error(`Error checking availability for barber ${barber.id}:`, error);
            return {
              barberId: barber.id,
              hasAvailability: false
            };
          }
        });

        const results = await Promise.all(availabilityPromises);
        const availabilityMap = results.reduce((acc, result) => {
          acc[result.barberId] = result.hasAvailability;
          return acc;
        }, {} as Record<string, boolean>);

        setBarberAvailability(availabilityMap);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAllBarbersAvailability();
  }, [selectedBranch, availableBarbers]);
  const renderBarberInfo = (barber: Barber | "no_preference", isInDropdown = false) => {
    if (barber === "no_preference") {
      return (
        <div className={`flex flex-col w-full ${isInDropdown ? 'items-start text-left' : 'items-center text-center'} py-1`}>
          <span className="font-medium">No Preference</span>
          <span className="text-sm text-gray-500">
            We'll assign a barber for you
          </span>
        </div>
      );
    }

    const hasAvailability = barberAvailability[barber.id] ?? true;

    return (
      <div className={`flex flex-col w-full ${isInDropdown ? 'items-start text-left' : 'items-center text-center'} py-1`}>
        <div className={`flex items-center gap-2 ${isInDropdown ? 'justify-start' : 'justify-center'}`}>
          <span className={`font-medium ${!hasAvailability ? 'text-gray-400' : ''}`}>
            {barber.name}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{barber.rating}</span>
          </div>
          {!hasAvailability && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
              No availability
            </Badge>
          )}
        </div>
        <span className={`text-sm ${!hasAvailability ? 'text-gray-400' : 'text-gray-500'}`}>
          {barber.experience} experience
        </span>
        <div className={`flex flex-wrap gap-1 mt-1 ${isInDropdown ? 'justify-start' : 'justify-center'}`}>
          {(Array.isArray(barber.specialties) ? barber.specialties : []).map((specialty: string) => (
            <Badge
              key={specialty}
              variant="secondary"
              className={`text-xs ${!hasAvailability ? 'bg-gray-100 text-gray-400' : ''}`}
            >
              {specialty}
            </Badge>
          ))}
        </div>
        {!hasAvailability && (
          <span className="text-xs text-gray-400 mt-1">
            Currently not available for booking
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Scissors className="h-5 w-5" />
        Select Barber
        {checkingAvailability && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-sm text-gray-500">Checking availability...</span>
          </div>
        )}
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
                  <SelectTrigger className="flex items-center justify-center min-h-[4.5rem] py-3 px-4">
                    <SelectValue placeholder="Choose a barber">
                      {field.value === "no_preference"
                        ? renderBarberInfo("no_preference", false)
                        : selectedBarber &&
                          renderBarberInfo(selectedBarber, false)}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>

                <SelectContent className="max-w-md">
                  <SelectItem
                    value="no_preference"
                    className="w-full cursor-pointer py-3 px-4 focus:bg-gray-50"
                  >
                    {renderBarberInfo("no_preference", true)}
                  </SelectItem>

                  {availableBarbers.length > 0 ? (
                    availableBarbers.map((barber) => (
                      <SelectItem
                        key={barber.id}
                        value={barber.id}
                        className="w-full cursor-pointer py-3 px-4 focus:bg-gray-50"
                        disabled={!barberAvailability[barber.id]}
                      >
                        {renderBarberInfo(barber, true)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
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