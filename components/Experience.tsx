import { workExperience } from '@/constants'
import React from 'react'
import { Button } from './shared/MovingBorder'
import { cn } from '@/lib/utils'

const Experience = ({ className }: { className?: string }) => {
  return (

    <div className={cn("max-w-full mt-12 grid lg:grid-cols-6 md:grid-cols-4 grid-cols-1 gap-5", className)}>
      {workExperience.map((card) => (
        <Button
          key={card.id}
          duration={Math.floor(Math.random() * 10000) + 10000}
          borderRadius="1.75rem"
          className="flex-1 text-black bg-white border-white-300"
        >
          <div className="relative flex flex-row gap-2 p-3 py-6 lg:items-center md:p-5 lg:p-10">
            <img
              src={card.thumbnail} alt={card.thumbnail}
              className="w-20 lg:w-32 md:w-24"
            />
            <div className="lg:ms-5">
              <h3 className="text-xl font-bold text-start md:2xl">
                {card.title}
              </h3>
              <p className="mt-3 font-semibold text-start text-black-100">
                {card.desc}
              </p>
            </div>
          </div>
        </Button>
      ))}
    </div>
  )
}

export default Experience