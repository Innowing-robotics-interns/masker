import { createContext } from "react";

interface CanvasContextType {
  undo: () => void;
  redo: () => void;
  storeState: () => void;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null> | null;
}

const defaultContext: CanvasContextType = {
  undo: () => {},
  redo: () => {},
  storeState: () => {},
  maskCanvasRef: null,
};

export const CanvasContext = createContext<CanvasContextType>(defaultContext);
