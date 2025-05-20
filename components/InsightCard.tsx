// 'use client';

import { fadeIn } from '@/lib/utils';
import { motion } from 'framer-motion';


const InsightCard = ({ imgUrl, title, subtitle, index }: { imgUrl: string, title: string, subtitle: string, index: number }) => (
  <motion.div
    variants={fadeIn('up', 'spring', index * 0.5, 1)}
    className="flex flex-col gap-4 md:flex-row"
  >
    <img
      src={imgUrl}
      alt="planet-01"
      className="md:w-[220px] w-full h-[220px] rounded-[32px] object-cover"
    />
    <div className="flex items-center justify-between w-full">
      <div
        className="flex-1 md:ml-[62px] flex flex-col max-w-[650px]"
      >
        <h4 className="text-26-semibold !lg:text-[42px] !text-white">{title}</h4>
        <p className="text-20-medium mt-[16px] !font-normal !lg:text-[20px] text-[14px] !text-white">{subtitle}</p>
      </div>
      <div
        className="lg:flex hidden items-center justify-center w-[100px] h-[100px] rounded-full bg-transparent border-[1px] border-white"
      >
        <img
          src="/arrow.svg"
          alt="arrow"
          className="w-[40%] h-[40%] object-contain"
        />
      </div>
    </div>
  </motion.div>
);

export default InsightCard;
