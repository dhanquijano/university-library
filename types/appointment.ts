export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

export interface Barber {
  id: string;
  name: string;
  specialties: string[];
  experience: string;
  rating: number;
  branches: string[];
  branchId?: string; // Added based on usage in useAppointmentForm.ts
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AppointmentData {
  branches: Branch[];
  barbers: Barber[];
  services: Array<{
    category: string;
    title: string;
    description: string;
    price: string;
  }>;
  availableDates: string[];
}