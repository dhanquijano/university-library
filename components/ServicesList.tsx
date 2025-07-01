import React from "react";
import { Service } from "@/lib/services";

const groupByCategory = (services: Service[]): Record<string, Service[]> => {
  return services.reduce(
    (acc, service) => {
      const { category } = service;
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>,
  );
};

interface Props {
  title: string;
  services: Service[];
}

const ServicesList = ({ title, services }: Props) => {
  const grouped = groupByCategory(services);

  return (
    <section className="font-bebas-neue text-4xl text-light-100">
      <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>

      {Object.entries(grouped).map(([category, group]) => (
        <div key={category} className="mb-12">
          <h3 className="text-2xl font-semibold mb-4 capitalize">{category}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {group.map((service) => (
              <li
                key={service.title}
                className="flex justify-between border-b pb-4 border-gray-700"
              >
                <div>
                  <h4 className="text-xl font-semibold">{service.title}</h4>
                  <p className="text-sm text-gray-400">{service.description}</p>
                </div>
                <span className="text-lg font-semibold">{service.price}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
export default ServicesList;
