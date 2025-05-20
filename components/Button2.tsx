
import React from 'react'

const Button = (
    {
        id,
        title,
        leftIcon,
        rightIcon,
        containerClass

    }
        : {
            id: string;
            title: string;
            leftIcon?: React.ReactNode,
            rightIcon?: React.ReactNode,
            containerClass?: string;
        }) => {
    return (
        <button
            id={id}
            className={`relative z-10 py-3 overflow-hidden text-black rounded-full cursor-pointer group w-fit bg-violet-50 px-7 ${containerClass}`}
        >
            {leftIcon}

            <span className='relative overflow-hidden uppercase incline-flex font-general tedt-xs'>
                {title}
            </span>

            {rightIcon}

        </button>
    )
}

export default Button