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
      <div className="flex justify-center">
        <section
          ref={servicesFade.ref}
          className={`transition-opacity duration-1000 ${
            servicesFade.isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-light-400 rounded-xl shadow-lg flex flex-col md:flex-row items-center w-full max-w-7xl mx-auto px-16 py-14 gap-12">
            <div className="flex-1">
              <h1 className="font-bebas-neue text-4xl text-dark-900 mb-4 text-center md:text-left">
                SANBRY MEN GROOMING HOUSE SERVICES
              </h1>
              <h2 className="font-bebas-neue text-lg text-dark-900 mb-6 text-center md:text-left">
                Welcome to Sanbry Men Grooming House, where exceptional grooming
                meets unmatched service. We’re proud to offer a range of
                professional haircuts, shaves, and beard treatments tailored just
                for you. Explore our services and experience the care and style
                you deserve.
              </h2>
              <ServicesList title="Our Services" services={services} />
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/images/menu-services.jpg"
                alt="menu"
                width={300}
                height={300}
                className="rounded-lg object-cover"
              />
            </div>
          </div>
        </section>
      </div>

      <hr className="border-t-2 border-dark-100 my-8 mx-auto max-w-screen-xl" />

      {/* Stylists Section */}
      <div className="flex justify-center">
        <section
          ref={stylistsFade.ref}
          className={`transition-opacity duration-1000 ${
            stylistsFade.isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-light-400 rounded-xl shadow-lg flex flex-col md:flex-row items-center w-full max-w-6xl mx-auto px-16 py-14 gap-12">
            <div className="flex-1">
              <h1 className="font-bebas-neue text-4xl text-dark-900 mb-4 text-center md:text-left">
                SANBRY MEN GROOMING HOUSE STYLISTS
              </h1>
              <h2 className="font-bebas-neue text-lg text-dark-900 mb-6 text-center md:text-left">
                At Sanbry Men Grooming House, we provide customers with the best
                stylists on the house. Get to know our stylists and book an
                appointment with them today!
              </h2>
              <StylistList name="Our Stylists" stylists={stylists} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Page;