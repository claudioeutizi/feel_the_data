import React from "react";
import { Canvas } from "@react-three/fiber";
import ImageWithDepthMap from './ImageWithDepthMap/ImageWithDepthMap'
import { OrbitControls } from "@react-three/drei";
import "./App.css"

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 1] }}>
      <OrbitControls />
        <ambientLight />
        <pointLight position={[0, 0, 1]} />
        <ImageWithDepthMap
          colorMapPath="images/duomo.jpg"
          depthMapPath="images/duomoDepth.png"
        />
      </Canvas>
    </div>
  );
}

export default App;