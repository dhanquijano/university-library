import React from "react";
import { Stylists } from "@/lib/stylists";

const groupByMainExpertise = (stylists: Stylists[]): Record<string, Stylists[]> => {
  return stylists.reduce(
    (acc, stylists) => {
      const expertise = stylists.expertise[0] || "General";
      if (!acc[expertise]) acc[expertise] = [];
      acc[expertise].push(stylists);
      return acc;
    },
    {} as Record<string, Stylists[]>,
  );
};

interface Props {
  name: string;
  stylists: Stylists[];
}

const StylistList = ({ name, stylists }: Props) => {
  const grouped = groupByMainExpertise(stylists);

  return (
    <section className="font-bebas-neue text-4xl text-light-100">
      <h2 className="font-bebas-neue text-4xl text-light-100">{name}</h2>

      {Object.entries(grouped).map(([id, group]) => (
        <div key={id} className="mb-12">
          <h3 className="text-2xl font-semibold mb-4 capitalize">{id}</h3>
          <ul className="grid grid-cols-2 grid-flow-col gap-8 mt-8">
            {group.map((service) => (
              <li
                key={service.name}
                className="flex items-center border-b pb-4 border-gray-700 gap-x-6"
              >
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-28 h-28 rounded-full object-cover"
                />
                <div className="w-full text-center"> 
                  <h4 className="text-2xl font-semibold">{service.name}</h4>
                  <p className="text-base text-gray-400 whitespace-pre-line">{service.expertise.join(", ")}</p>
                </div>
                <span className="text-lg font-semibold">{service.rating}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
export default StylistList;
