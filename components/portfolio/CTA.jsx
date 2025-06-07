import React from 'react'
import Link from 'next/link'

const CTA = () => {
    return (
        <section className='cta'>
            <p className='cta-text'>Have a project in mind? <br className='sm:block hidden' />
                Let&#39;s build something together!
            </p>
            <Link href='/portfolio/contact' className='btn'>
                Contact
            </Link>
        </section>
    )
}

export default CTA