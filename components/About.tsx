import React from 'react'
import { testimonials } from "@/constants"
import { InfiniteMovingCards } from './shared/InfiniteMovingCard'

const About = () => {
  return (
    <section id="clients" className="py-10">
      <h2 className="heading" style={{ textAlign: 'left' }}>
        Kind words {''}
        <span className="text-purple">satisfield clients</span>
      </h2>

      <div className="flex flex-col items-center mt-8 max-lg:mt-10">
        <InfiniteMovingCards
          items={testimonials}
          direction="right"
          speed="slow"
          className='max-w-5xl'
        />
      </div>
    </section>
  )
}

export default About