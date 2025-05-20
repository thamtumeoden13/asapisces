import About2 from '@/components/About2'
import Hero from '@/components/Hero'
import React from 'react'

const page = () => {
  return (
    <div className='relative w-screen min-h-screen overflow-x-hidden'>
        <Hero />
        <About2 />
    </div>
  )
}

export default page