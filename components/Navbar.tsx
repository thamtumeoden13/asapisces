'use client'

import { useEffect, useRef, useState } from 'react'
import Button from './Button';
import { TiLocationArrow } from 'react-icons/ti';
import { useWindowScroll } from 'react-use';
import gsap from 'gsap';

const navItems = ['Nexus', 'Vault', 'Prologue', 'About', 'Contact'];

const Navbar = () => {
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isIndicatorActive, setIsIndicatorActive] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isNavVisible, setIsNavVisible] = useState(true);

    const navContainerRef = useRef<HTMLDivElement>(null);
    const audioElementRef = useRef<HTMLAudioElement>(null);

    const { y: currenScrollY } = useWindowScroll();

    const toggleAudioIndicator = () => {
        setIsAudioPlaying((prev) => !prev);

        setIsIndicatorActive((prev) => !prev);
    }

    useEffect(() => {
        if (currenScrollY === 0) {
            setIsNavVisible(true);
            navContainerRef.current?.classList.remove('floating-nav')
        } else if (currenScrollY > lastScrollY) {
            setIsNavVisible(false);
            navContainerRef.current?.classList.add('floating-nav')
        } else if (currenScrollY < lastScrollY) {
            setIsNavVisible(true)
            navContainerRef.current?.classList.add('floating-nav')
        }

        setLastScrollY(currenScrollY);

    }, [currenScrollY, lastScrollY])

    useEffect(() => {
        gsap.to(navContainerRef.current, {
            y: isNavVisible ? 0 : -100,
            opacity: isNavVisible ? 1 : 0,
            duration: 0.2,
        })
    }, [isNavVisible])

    useEffect(() => {
        if (isAudioPlaying) {
            audioElementRef.current?.play();
        } else {
            audioElementRef.current?.pause()
        }
    }, [isAudioPlaying])

    return (
        <div
            ref={navContainerRef}
            className="fixed inset-x-0 z-50 h-16 transition-all duration-700 border-none top-4 sm:inset-x-6 bg-black"
        >
            <header
                className="absolute w-full -translate-y-1/2 top-1/2"
            >
                <nav
                    className="flex items-center justify-between p-4 size-full"
                >
                    <div
                        className="flex items-center gap-7"
                    >
                        <img src="/images/artsunday.png" alt="logo" className='w-10' />

                        {/* <Button
                            id='product-button'
                            title='Products'
                            rightIcon={<TiLocationArrow />}
                            containerClass={"bg-blue-50 md:flex hidden items-center justify-center gap-1"}
                        /> */}
                    </div>

                    <div
                        className="flex items-center h-full"
                    >
                        <div
                            className="hidden md:block"
                        >
                            {navItems.map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className='nav-hover-btn'
                                >
                                    {item}
                                </a>
                            ))}
                        </div>

                        <button className='ml-10 flex items-center space-x-0.5' onClick={toggleAudioIndicator}>
                            <audio
                                ref={audioElementRef}
                                src="/audio/loop.mp3"
                                className='hidden'
                                loop
                            />
                            {[1, 2, 3, 4].map((bar) => (
                                <div
                                    key={bar}
                                    className={`indicator-line ${isIndicatorActive ? 'active' : ''}`}
                                    style={{
                                        animationDelay: `${bar * 0.1}`
                                    }}
                                />
                            ))}
                        </button>

                    </div>
                </nav>
            </header>
        </div>
    )
}

export default Navbar