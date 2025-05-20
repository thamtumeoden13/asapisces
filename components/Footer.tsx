"use client";

import { motion } from "framer-motion";

import { socials } from "../constants";
import styles from "@/styles";
import { footerVariants } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./shared/MovingBorder";
import { IconDirectionSign } from "@tabler/icons-react";
import Link from "next/link";
import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { Author, Construction, Project } from "@/sanity/types";
import { ROUTE_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import ContactModal from "./shared/ContactModal";
import { TextGenerateEffect } from "./TextGenerateEffect";

export type ProjectCardType = Omit<Project, "author" | "construction"> & {
  author?: Author;
} & { construction?: Construction };

const Footer = () => {
  const [footerRoute, setFooterRoute] = useState<ProjectCardType[]>([]);

  useEffect(() => {
    const getNavProjectRouter = async () => {
      const { select: footerRoute } = await client.fetch(ROUTE_BY_SLUG_QUERY, {
        slug: "danh-muc-cuoi-trang",
      });
      setFooterRoute(footerRoute);
    };

    getNavProjectRouter();
  }, []);

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="show"
      className={`${styles.paddings} py-8 relative bg-black overflow-hidden`}
    >
      <div className="footer-gradient" />
      <div
        className={`${styles.innerWidth} mx-auto flex flex-col gap-8 max-w-7xl`}
      >
        <div
          // className="flex flex-wrap items-center justify-between gap-5"
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {/* <h4
					className="font-bold md:text-[64px] text-[44px] text-white"
				>
					Enter the Metaverse
				</h4> */}
          <div className="flex flex-col">
            <Image
              src={"/bg-artsunday.png"}
              alt="Art Sunday"
              width={500}
              height={500}
              className="object-contain w-[360px] h-[100px]"
            />
            <TextGenerateEffect
              className="font-medium text-left my-1 text-white-100 text-[20px] md:text-md lg:text-lg hover:cursor-pointer hover:underline"
              words="Địa Chỉ: 42-D1 Khu NOXH Hiệp Phát, Nguyễn Đức Thuận, P.Hiệp Thành, Tp.Thủ Dầu Một, T.Bình Dương"
              idxTranfer={1}
              link="https://maps.app.goo.gl/AyaCwsVrC4kCTPQf7"
            />
            <TextGenerateEffect
              className="font-medium text-left  my-1 text-white-100 text-[20px] md:text-md lg:text-lg hover:cursor-pointer hover:underline"
              words="Số Điện Thoại: 0904 177 100"
              idxTranfer={2}
              link="tel:0904177100"
            />
            <TextGenerateEffect
              className="font-medium text-left  my-1 text-white-100 text-[20px] md:text-md lg:text-lg hover:cursor-pointer hover:underline"
              words="Mã Số Thuế: 3702962067"
              idxTranfer={2}
              link="https://masothue.com/3702962067-cong-ty-tnhh-kien-truc-xay-dung-art-sunday"
            />
          </div>
          <div className="flex flex-col items-start gap-5">
            <h4 className="w-full font-extrabold text-[24px] text-white">
              Dự Án
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {footerRoute.map(({ title, slug }) => (
                <Button
                  key={title}
                  duration={Math.floor(Math.random() * 10000) + 10000}
                  borderRadius="1.75rem"
                  className="flex-1 text-white border-slate-800"
                >
                  <Link
                    href={`/du-an/${slug?.current}`}
                    className="flex gap-2 p-2"
                  >
                    <IconDirectionSign className="w-6 h-6 text-white" />
                    <span className="font-normal text-[16px] text-white hover:text-purple">
                      {title}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="mb-[50px] h-[2px] bg-white opacity-10" />
          <div className="flex flex-wrap items-center justify-end gap-4 md:justify-between">
            <ContactModal />
            <p className="font-normal text-[14px] text-white opacity-50">
              Copyright © 2023 - 2025 Art Sunday. All rights reserved.
            </p>
            <div className="flex gap-4 ">
              {socials.map((social, index) => (
                <HoverBorderGradient
                  key={social.name}
                  containerClassName="rounded-full"
                  as="button"
                  className="flex items-center bg-black width-[40px] height-[40px] rounded-full p-2"
                >
                  <Link
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{social.name}</span>
                    <Image
                      src={social.url}
                      alt={social.name}
                      className="object-contain cursor-pointer"
                      width={40}
                      height={40}
                    />
                  </Link>
                </HoverBorderGradient>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
