import React from "react";
import { stylists } from '@/lib/stylists';
import StylistList from "@/components/StylistList";

const Page = () => {
    return (
      <>
        <h1 className="font-bebas-neue text-6xl text-light-100 text-center">
          Sanbry Men Grooming House Stylists
        </h1>
        <h2 className="font-bebas-neue text-3xl text-light-100 text-center mt-10 mb-10">
          At Sanbry Men Grooming House, we provide customers with the best stylists
          on the house. Get to know our stylists and book an appointment with them today!
        </h2>

      <StylistList name="Our Stylists" stylists={stylists} />
      </>
    );
};
export default Page;
