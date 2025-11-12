"use client";

import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import CanvasProvider from "./contexts/CanvasContext";
import FileManager from "./components/FileManager";
import { useState } from "react";

function App() {
  const [showFileManager, setShowFileManager] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <CanvasProvider>
        <div className="h-full overflow-auto">
          <Canvas imageName="137.png" dataset="test1" />
        </div>
        <div className="fixed ">
          {showFileManager && <FileManager />}
          <Toolbar toggleFiles={() => setShowFileManager(!showFileManager)} />
        </div>
      </CanvasProvider>
    </div>
  );
}

export default App;
