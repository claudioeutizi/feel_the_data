import React, { useState } from "react";
import ParticleSystem from "./Graphics/ParticleSystem";
import "./App.css"

function App() {
  const [filigranaValue, setFiligranaValue] = useState(20);
  const [dimValue, setDimValue] = useState(10);

  const handleFiligranaSliderChange = (event) => {
    setFiligranaValue(event.target.value);
  };

  const handleDimSliderChange = (event) => {
    setDimValue(event.target.value);
  }
  
  return (
    <div>
      <span>Filigrana:</span>
      <input type="range" id="#filigrana-slider" min="1" max="20" value={filigranaValue} onChange={handleFiligranaSliderChange} />
      <br/>
      <span>Dim:</span>
      <input type="range" id="#dim-slider" min="10" max="30" value={dimValue} onChange={handleDimSliderChange} />
      <ParticleSystem filigrana={filigranaValue} dim = {dimValue} myImage={"duomo.jpg"}></ParticleSystem>
    </div>
  );
}

export default App;