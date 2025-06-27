import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/components/SignOutAction";
import React from "react";
import { Session } from "next-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const Header = ({ session }: { session: Session }) => {
  return (
    <header className={"my-10 flex justify-between gap-5"}>
      <Link href="/">
        <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
      </Link>

      <ul className="flex flex-row items-center gap-8">
        <li>
          <Link className="text-lg text-primary" href="/services">
            Services
          </Link>
        </li>
        <li>
          <Link className="text-lg text-primary" href="/appointments">
            Appointments
          </Link>
        </li>
        <li>
          <Link className="text-lg text-primary" href="/stylists">
            Stylists
          </Link>
        </li>
        <li>
          <Link className="text-lg text-primary" href="/my-profile">
            My Profile
          </Link>
        </li>
        <li>
          <form action={signOutAction} className="">
            <Button className="text-lg cursor-pointer bg-transparent text-primary border-none hover:bg-transparent hover:text-primary active:bg-transparent focus:outline-none ">
              Logout
            </Button>
          </form>
        </li>
      </ul>
    </header>
  );
};
export default Header;
