import { redirect } from "next/navigation";

const Companion = async () => {
  redirect("/companion-library/");

  return (
    <section className="mx-auto px-14 flex flex-col gap-8 bg-background h-full w-full max-w-[1440px] pt-10 max-sm:px-2">
      
    </section>
  );
};

export default Companion;
