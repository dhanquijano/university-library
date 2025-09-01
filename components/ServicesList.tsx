import React from "react";
import { Service } from "@/lib/services";

interface Props {
  title: string;
  services: Service[];
}

// Helper to group services by category
const groupByCategory = (services: Service[]) => {
  return services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);
};

const ServicesList = ({ title, services }: Props) => {
  const grouped = groupByCategory(services);

  return (
    <section className="font-bebas-neue text-2xl text-light-100 w-full">
      <h2 className="font-bebas-neue text-2xl text-light-100 mb-4 text-center">{title}</h2>
      <div className="flex flex-col overflow-y-auto gap-6 px-2 py-2 bg-light-200 rounded-lg shadow max-h-[600px] w-full">
        {Object.entries(grouped).map(([category, group]) => (
          <div key={category}>
            <h3 className="text-lg font-bold text-dark-900 mb-2">{category}</h3>
            <div className="flex flex-col gap-3">
              {group.map((service) => (
                <div
                  key={service.title}
                  className="flex flex-col items-center justify-between bg-white rounded-lg shadow p-2 min-h-[80px]"
                >
                  <h4 className="text-lg font-bold text-dark-900 mb-1 text-center">{service.title}</h4>
                  <p className="text-sm text-dark-700 mb-1 text-center">{service.description}</p>
                  <span className="text-base font-bold text-dark-900">{service.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesList;
