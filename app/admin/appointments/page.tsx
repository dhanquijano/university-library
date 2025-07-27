"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Clock, User, Phone, MapPin, Scissors } from "lucide-react";
import AppointmentDetailModal from "@/components/admin/AppointmentDetailModal";
import { getAllAppointments } from "@/lib/actions/appointments";

interface AppointmentsPageProps {
  searchParams: {
    search?: string;
    date?: string;
    status?: string;
    sort?: string;
  };
}

const AppointmentsPage = ({ searchParams }: AppointmentsPageProps) => {
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const result = await getAllAppointments();
        if (result.success) {
          setAppointmentsData(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleAppointmentUpdate = async () => {
    const result = await getAllAppointments();
    if (result.success) {
      setAppointmentsData(result.data || []);
    }
  };

  const getStatusBadge = (appointmentDate: string, appointmentTime: string) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    
    if (appointmentDateTime < now) {
      return <Badge variant="destructive">Completed</Badge>;
    } else if (appointmentDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Today</Badge>;
    } else {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all booked appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {appointmentsData.length} appointments
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name..."
                defaultValue={searchParams.search}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              defaultValue={searchParams.date}
              className="w-auto"
            />
            <Select defaultValue={searchParams.sort || "newest"}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="date">Appointment Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
          </div>
        ) : appointmentsData.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchParams.search || searchParams.date 
                ? "No appointments match your search criteria."
                : "No appointments have been booked yet."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointmentsData.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Customer Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {appointment.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{appointment.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{appointment.email}</span>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {dayjs(appointment.appointmentDate).format("MMM DD, YYYY")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{appointment.appointmentTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{appointment.branch}</span>
                      </div>
                    </div>

                    {/* Services and Barber */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-medium">{appointment.barber}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Services: </span>
                        <span className="text-gray-900">{appointment.services}</span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="text-sm text-gray-500">
                      Booked on {dayjs(appointment.createdAt).format("MMM DD, YYYY 'at' h:mm A")}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end gap-3 ml-4">
                    {getStatusBadge(appointment.appointmentDate, appointment.appointmentTime)}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onUpdate={handleAppointmentUpdate}
        />
      )}
    </div>
  );
};

export default AppointmentsPage; 