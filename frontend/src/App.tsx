"use client";

import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import CanvasProvider from "./contexts/CanvasContext";

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <CanvasProvider>
        <div className=" h-full overflow-auto">
          <Canvas imageName="137.png" dataset="test1" />
        </div>
        <Toolbar />
      </CanvasProvider>
    </div>
  );
}

export default App;
