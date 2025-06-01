import { useGLTF } from '@react-three/drei'
import React, { useRef } from 'react'

import skyScene from '../assets/3d/sky.glb'
import { useFrame } from '@react-three/fiber';

const Sky = ({ isRotating }) => {
    const { scene, animations } = useGLTF(skyScene);
    const skyRef = useRef();

    useFrame((_, delta) => {
        if (isRotating) {
            skyRef.current.rotation.y += 0.15 * delta
        }
    })
    return (
        // to create and display 3D objects
        // use the primitive element when you want to directly embed a complex 3D model or scene
        <mesh ref={skyRef}>
            <primitive object={scene} />
        </mesh>
    )
}

export default Sky