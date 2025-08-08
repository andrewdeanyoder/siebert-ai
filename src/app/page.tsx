'use server'
import Image from "next/image";
import Chat from "#/components/Chat";
import { redirect } from 'next/navigation'
import { createClient } from '#/utils/supabase/server'
import StickyBanner from "./components/StickyBanner";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }

  return (
    <>
      <StickyBanner/>
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          {/* todo: factor out the logo */}
          <div className="flex flex-col items-center w-full mb-8">
            <Image
              src="/teacher.jpeg"
              alt="Teacher"
              width={200}
              height={50}
              className="w-auto h-auto max-w-full"
              priority
            />
            <h1 className="text-3xl font-bold text-white mt-4">A&P Memory Lab Tutor</h1>
          </div>
          <div className="w-full max-w-4xl">
            <Chat/>
          </div>
        </main>
      </div>
    </>
  );
}