import React from "react";
import ServicesList from "@/components/ServicesList";
import { services } from "@/lib/services";
import Image from "next/image";

const Page = () => {
  return (
    <>
      <h1 className="font-bebas-neue text-6xl text-light-100 text-center">
        Sanbry Men Grooming House Services
      </h1>
      <h2 className="font-bebas-neue text-3xl text-light-100 text-center mt-10 mb-10">
        Welcome to Sanbry Men Grooming House, where exceptional grooming meets
        unmatched service. We’re proud to offer a range of professional
        haircuts, shaves, and beard treatments tailored just for you. Explore
        our services and experience the care and style you deserve.
      </h2>
      <Image
        src="/images/menu-services.jpg"
        alt="menu"
        width={350}
        height={350}
        className="mx-auto"
      />
      <ServicesList title="Our Services" services={services} />
    </>
  );
};
export default Page;
