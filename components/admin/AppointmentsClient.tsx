"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Scissors,
} from "lucide-react";
import AppointmentDetailModal from "@/components/admin/AppointmentDetailModal";
import { getAllAppointments } from "@/lib/actions/appointments";

interface AppointmentsClientProps {
  search?: string;
  date?: string;
  status?: string;
  sort?: string;
}

const AppointmentsClient = ({
  search: initialSearch = "",
  date: initialDate = "",
  status: initialStatus = "",
  sort: initialSort = "newest",
}: AppointmentsClientProps) => {
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch);
  const [date, setDate] = useState(initialDate);
  const [sort, setSort] = useState(initialSort);
  const [status, setStatus] = useState(initialStatus);

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
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`,
    );

    if (appointmentDateTime < now) {
      return <Badge variant="destructive">Completed</Badge>;
    } else if (
      appointmentDateTime.getTime() - now.getTime() <
      24 * 60 * 60 * 1000
    ) {
      return (
        <Badge variant="default" className="bg-orange-100 text-orange-800">
          Today
        </Badge>
      );
    } else {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  const filteredAppointments = appointmentsData
    .filter((a) => a.fullName.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => (date ? dayjs(a.appointmentDate).isSame(date, "day") : true))
    .filter((a) => {
      if (!status) return true;
      const appointmentDateTime = new Date(
        `${a.appointmentDate}T${a.appointmentTime}`,
      );
      const now = new Date();
      return status === "upcoming"
        ? appointmentDateTime >= now
        : appointmentDateTime < now;
    })
    .sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sort === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sort === "date") {
        return (
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
        );
      }
      return 0;
    });

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
            {filteredAppointments.length} appointments
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 ">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-auto ">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="date">Appointment Date</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status || "all"}
              onValueChange={(val) => setStatus(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">
              Loading appointments...
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No appointments
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || date
                ? "No appointments match your search criteria."
                : "No appointments have been booked yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {appointment.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {appointment.mobileNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          {appointment.email}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {dayjs(appointment.appointmentDate).format(
                            "MMM DD, YYYY",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {appointment.appointmentTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {appointment.branch}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-medium">
                          {appointment.barber === ""
                            ? "No Preference"
                            : appointment.barber}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Services:{" "}
                        </span>
                        <span className="text-gray-900">
                          {appointment.services}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Booked on{" "}
                      {dayjs(appointment.createdAt).format(
                        "MMM DD, YYYY 'at' h:mm A",
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 ml-4">
                    {getStatusBadge(
                      appointment.appointmentDate,
                      appointment.appointmentTime,
                    )}
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

      {/* Modal */}
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

export default AppointmentsClient;
