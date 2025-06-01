"use client";

import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

import { skills, experiences } from "@/constants";
import Image from "next/image";
import Cta from "@/components/porfolio/CTA";

const About = () => {
  return (
    <section className="max-container h-full">
      <h1 className="head-text">
        Hello, I&apos;m{" "}
        <span className="font-semibold blue-gradient_text drop-shadow">
          Mr.Vu
        </span>
      </h1>

      <div className="flex-col gap-3 mt-5 flex- text-slate-500">
        <p>
          {" "}
          Software Engineer based in VietNam, specializing in technical
          education through hands-on learning and building applications.
        </p>
      </div>

      <div className="flex flex-col py-10">
        <h3 className="subhead-text">My Skills</h3>

        <div className="flex flex-wrap gap-12 mt-16">
          {skills.map((skill) => (
            <div key={skill.name} className="w-20 h-20 block-container">
              <div className="btn-back rounded-xl" />
              <div className="flex items-center justify-center btn-front rounded-xl">
                <Image
                  src={skill.imageUrl}
                  alt={skill.name}
                  className="object-contain w-1/2 h-1/2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-16">
        <h3 className="subhead-text">Work Experience</h3>

        <div className="flex-col gap-3 mt-5 flex- text-slate-500">
          <p>
            {" "}
            I have 7 years of experience as a Full-Stack JS Developer. During
            these 7 years, I had the chance to work with ReactJs and NextJs for
            approximately 5 years, and 3 years with React Native. Recently, I
            have had 2 years with NodeJs and AWS and a half year with Flutter .
          </p>
        </div>

        <div className="flex mt-12">
          <VerticalTimeline className="max-w-7xl">
            {experiences.map((experience, index) => (
              <VerticalTimelineElement
                key={`experience.company_name-${index}`}
                date={experience.date}
                icon={
                  <div className="flex items-center justify-center w-full h-full">
                    <Image
                      src={experience.icon}
                      alt={experience.company_name}
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </div>
                }
                contentStyle={{
                  borderBottom: "8px",
                  borderStyle: "solid",
                  borderBottomColor: experience.iconBg,
                  boxShadow: "none",
                }}
                iconStyle={{
                  background: experience.iconBg,
                }}
              >
                <div>
                  <h3 className="text-xl font-semibold text-black font-sans">
                    {experience.title}
                  </h3>
                  <p
                    className="font-medium text-black-100 font-base"
                    style={{ margin: 0 }}
                  >
                    {experience.company_name}
                  </p>
                </div>
                <ul className="my-5 ml-5 space-y-2 list-disc">
                  {experience.points.map((point) => (
                    <li
                      key={point}
                      className="pl-1 text-sm font-normal text-black-100/50"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>
        </div>
      </div>
      <hr className="border-slate-200" />

      <Cta />
    </section>
  );
};

export default About;
