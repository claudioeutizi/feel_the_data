import React, { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

function ImageWithDepthMap({ colorMapPath, depthMapPath, ...props }) {
  const meshRef = useRef();

  const [colorMap, depthMap] = useLoader(THREE.TextureLoader, [
    colorMapPath,
    depthMapPath,
  ]);

//   useFrame(() => {
//     meshRef.current.material.uniforms.time.value = performance.now() / 1000;
//   });

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      colorMap: { value: colorMap },
      depthMap: { value: depthMap },
      time: { value: 0.0 },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += 0.02 * sin(pos.y * 5.0 + time * 2.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D colorMap;
      uniform sampler2D depthMap;
      varying vec2 vUv;
      
      void main() {
        vec4 depth = texture2D(depthMap, vUv);
        gl_FragColor = texture2D(colorMap, vUv + depth.r);
        gl_FragDepth = depth;
      }
    `,
  });

  return (
    <mesh ref={meshRef} material={shaderMaterial} {...props}>
      <planeBufferGeometry args={[1, 1]} />
    </mesh>
  );
}

export default ImageWithDepthMap