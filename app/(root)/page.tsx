import Image from "next/image";
import { Button } from "@/components/ui/button";
import BookOverview from "@/components/BookOverview";
import BookList from "@/components/BookList";
import { books, users } from "@/database/schema";
import { db } from "@/database/drizzle";
import { auth } from "@/auth";
import { desc } from "drizzle-orm";

const Home = async () => {
  const session = await auth();

  const latestBooks = (await db
    .select()
    .from(books)
    .limit(10)
    .orderBy(desc(books.createdAt))) as Book[];

  return (
    <>
      <BookOverview {...latestBooks[0]} userID={session?.user?.id as string} />

      <BookList
        title="Latest Books"
        books={latestBooks.slice(1)}
        containerClassName="mt-28"
      />
    </>
  );
};
export default Home;
