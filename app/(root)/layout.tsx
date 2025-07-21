import { ReactNode } from "react";
import Header from "@/components/Header";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@/database/schema";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  if (session?.user?.id) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (
      user.length > 0 &&
      user[0].lastActivityDate !== new Date().toISOString().slice(0, 10)
    ) {
      await db
        .update(users)
        .set({ lastActivityDate: new Date().toISOString().slice(0, 10) })
        .where(eq(users.id, session.user.id));
    }
  }

  return (
    <main className="root-container">
      <div className="mx-auto max-2xl">
        <Header session={session} />

        <div className="mt-20 pb-20">{children}</div>
      </div>
    </main>
  );
};

export default Layout;
