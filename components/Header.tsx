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
        <Image src="/icons/sanbry logo.png" alt="logo" width={40} height={40} />
      </Link>

      <ul className="flex flex-row items-center gap-8">
        <li>
          <Link className="text-lg text-primary" href="/appointments">
            Appointments
          </Link>
        </li>
        <li>
          <Link className="text-lg text-primary" href="/contact">
            Contact Us
          </Link>
        </li>
        {session?.user ? (
          <>
            {(session?.user?.role === "ADMIN" ||
              session?.user?.role === "MANAGER" ||
              session?.user?.role === "STAFF") && (
              <li>
                <a href="/admin" className="text-lg text-primary">
                  Admin Panel
                </a>
              </li>
            )}
            <li>
              <form action={signOutAction}>
                <Button className="text-lg cursor-pointer bg-transparent text-primary border-none hover:bg-transparent hover:text-primary active:bg-transparent focus:outline-none">
                  Logout
                </Button>
              </form>
            </li>
          </>
        ) : (
          <li>
            <a href="/sign-in" className="text-lg text-primary">
              Login
            </a>
          </li>
        )}
      </ul>
    </header>
  );
};
export default Header;
