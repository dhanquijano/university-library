import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Scissors, Clock } from "lucide-react";

interface BarberCardProps {
  barber: {
    id: string;
    name: string;
    specialties: string[];
    experience: string;
    rating: number;
    image?: string;
  };
  onSelect?: (barberId: string) => void;
  selected?: boolean;
}

const BarberCard = ({ barber, onSelect, selected }: BarberCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onSelect?.(barber.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <Scissors className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{barber.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{barber.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span className="text-sm">{barber.experience}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {barber.specialties.map((specialty) => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarberCard; 