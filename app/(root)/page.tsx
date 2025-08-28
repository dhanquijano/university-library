"use client";
import React from "react";
import ServicesList from "@/components/ServicesList";
import StylistList from "@/components/StylistList";
import { services } from "@/lib/services";
import { stylists } from "@/lib/stylists";
import Image from "next/image";
import { useFadeInOnScroll } from "./useFadeInOnScroll"; // import the hook

const Page = () => {
  const servicesFade = useFadeInOnScroll();
  const stylistsFade = useFadeInOnScroll();

  return (
    <>
      {/* Hero Section */}
      <div className="hero-bg mx-auto max-w-screen-xl px-4 animate-fadeIn">
        <div className="text-6xl text-white font-semibold text-center mb-8">
          Greetings from the Heart!
        </div>
      </div>

      <hr className="border-t-2 border-dark-100 my-8 mx-auto max-w-screen-xl" />

      {/* Services Section */}
      <section
        ref={servicesFade.ref}
        className={`mx-auto max-w-screen-xl px-4 py-16 transition-opacity duration-1000 ${
          servicesFade.isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="font-bebas-neue text-6xl text-light-100 text-center">
          SANBRY MEN GROOMING HOUSE SERVICES
        </h1>
        <h2 className="font-bebas-neue text-3xl text-light-100 text-center mt-10 mb-10">
          Welcome to Sanbry Men Grooming House, where exceptional grooming meets unmatched service. We’re proud to offer a range of professional haircuts, shaves, and beard treatments tailored just for you. Explore our services and experience the care and style you deserve.
        </h2>
        <Image
          src="/images/menu-services.jpg"
          alt="menu"
          width={350}
          height={350}
          className="mx-auto"
        />
        <ServicesList title="Our Services" services={services} />
      </section>

      <hr className="border-t-2 border-dark-100 my-8 mx-auto max-w-screen-xl" />

      {/* Stylists Section */}
      <section
        ref={stylistsFade.ref}
        className={`mx-auto max-w-screen-xl px-4 py-16 transition-opacity duration-1000 ${
          stylistsFade.isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="font-bebas-neue text-6xl text-light-100 text-center">
          SANBRY MEN GROOMING HOUSE STYLISTS
        </h1>
        <h2 className="font-bebas-neue text-3xl text-light-100 text-center mt-10 mb-10">
          At Sanbry Men Grooming House, we provide customers with the best stylists on the house. Get to know our stylists and book an appointment with them today!
        </h2>
        <StylistList name="Our Stylists" stylists={stylists} />
      </section>
    </>
  );
};

export default Page;