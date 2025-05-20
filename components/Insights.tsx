'use client';

import { motion } from 'framer-motion';

import styles from '../styles'
import { insights } from '../constants'
import { TitleText } from './shared/CustomTexts';
import InsightCard from './InsightCard';
import { staggerContainer } from '@/lib/utils';

const Insights = () => (
  <section className={`${styles.paddings} relative z-10`}>
    <motion.div
      variants={staggerContainer(0.3, 0.2)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.25 }}
      className={`${styles.innerWidth} max-auto flex flex-col`}
    >
      <TitleText
        title="Insight about metaverse"
        textStyles="text-center"
      />
      <div
        className="mt-[50px] flex flex-col gap-5"
      >
        {insights.map((insight, index) => (
          <InsightCard
            key={`insight-${index}`}
            index={index + 1}
            {...insight}
          />
        ))}
      </div>
    </motion.div>
  </section>
);

export default Insights;
