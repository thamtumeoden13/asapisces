import Hero from "@/components/Hero";
import About from "@/components/awwwards/About";
import Story from "@/components/awwwards/Story";
import Features from "@/components/awwwards/Features";
import Contact from "@/components/awwwards/Contact";

export default async function Home() {
  return (
    <>
      <Hero />
      <About />
      <Features />
      <Story />
      <Contact />
    </>
  );
}
