import gsap from "gsap";
import { useEffect, useRef } from "react"

const AnimatiedTitle = ({ title, sectionId, containerClass }: { title?: string, sectionId?: string,  containerClass?: string }) => {

    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const titleAnimation = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: '100 bottom',
                    end: 'center bottom',
                    toggleActions: 'play none none reverse'
                },
            });

            titleAnimation.to('.animated-word', {
                opacity: 1,
                transform: 'translate3d(0,0,0) rotateY(0deg) rotateX(0deg)',
                ease: 'power2.inOut',
                stagger: 0.02,
            })
        }, containerRef);

        return () => ctx.revert();
    }, [])

    return (

        <div
            id={sectionId}
            ref={containerRef}
            className={`animated-title ${containerClass}`}
        >
            {title && title.split('<br />').map((line, index) => {
                return (
                    <div
                        key={index}
                        className="flex-wrap max-w-full gap-2 px-10 flex-center md:gap-3"
                    >
                        {line.split(' ').map((word, i) => (
                            <span
                                key={i}
                                className="animated-word"
                                dangerouslySetInnerHTML={{ __html: word }}
                            />
                        ))}
                    </div>
                )
            })}
        </div>
    )
}

export default AnimatiedTitle