import * as THREE from "three";
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

const ImageWithDepthMapDisplacement = () => {
  const meshRef = useRef();
  const imageTexture = useTexture("/duomo.jpg");
  const displacementTexture = useTexture("/duomoDepth.png");

  // Crea il materiale con lo shader
  const material = new THREE.ShaderMaterial({
    uniforms: {
      displacementMap: { value: displacementTexture },
      amplitude: { value: 50 },
      tex: { value: imageTexture },
    },
    vertexShader: `
      uniform sampler2D displacementMap;
      uniform float amplitude;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 dMap = texture2D(displacementMap, uv);
        vec3 displaced = position + normal * (normalize(dMap).r * amplitude);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tex;
      varying vec2 vUv;

      void main() {
        gl_FragColor = texture2D(tex, vUv);
      }
    `,
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeBufferGeometry attach="geometry" args={[imageTexture.image.width / 20, imageTexture.image.height / 20, 50, 50]} />
    </mesh>
  );
};

export default ImageWithDepthMapDisplacement;