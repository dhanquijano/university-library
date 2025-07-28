export interface AppointmentData {
  branches: Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
    hours: string;
  }>;
  barbers: Array<{
    id: string;
    name: string;
    specialties: string[];
    experience: string;
    rating: number;
    branches: string[];
  }>;
  services: Array<{
    category: string;
    title: string;
    description: string;
    price: string;
  }>;
  availableDates: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Barber {
  id: string;
  name: string;
  specialties: string[];
  experience: string;
  rating: number;
  branches: string[];
}