import React from "react";
import { MapPin } from "lucide-react";
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

interface BranchSelectionProps {
  form: any;
  appointmentData: AppointmentData;
  onBranchChange: (branchId: string) => void;
}

const BranchSelection = ({ 
  form, 
  appointmentData, 
  onBranchChange 
}: BranchSelectionProps) => (
  <div className="bg-white rounded-lg border p-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
      <MapPin className="h-5 w-5" />
      Select Branch
    </h2>
    <FormField
      control={form.control}
      name="branch"
      render={({ field }: any) => (
        <FormItem>
          <FormLabel>Branch</FormLabel>
          <Select
            onValueChange={onBranchChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger className="text-center items-center min-h-[4.5rem] py-2">
                <SelectValue placeholder="Choose a branch" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {appointmentData.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-sm text-gray-500">
                      {branch.address}
                    </span>
                    <span className="text-sm text-gray-500">
                      {branch.hours}
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

export default BranchSelection;