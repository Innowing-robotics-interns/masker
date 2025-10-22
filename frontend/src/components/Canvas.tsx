import { useRef, useEffect, useState, useCallback } from "react";
import { fetchImageFromBackend } from "../utils/fetchImages";

interface CanvasProps {
  imageName: string;
  dataset: string;
}

export default function Canvas({ imageName, dataset }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushMode, setBrushMode] = useState<"draw" | "erase">("draw");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<[number, number] | null>(null);

  const foregroundColor = "rgb(255, 255, 255)"; // White
  const backgroundColor = "rgb(0, 0, 0)"; // Black
  const brushSpacing = 1;

  const getMouseXY = useCallback((e: MouseEvent): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return [x, y];
  }, []);

  const dist = useCallback(
    (x1: number, y1: number, x2: number, y2: number): number => {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    },
    [],
  );

  const drawCircle = useCallback(
    (x: number, y: number, width: number, ctx: CanvasRenderingContext2D) => {
      const color = brushMode === "draw" ? foregroundColor : backgroundColor;

      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      if (brushMode === "erase") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.beginPath();
      ctx.imageSmoothingEnabled = false;
      ctx.arc(x, y, width, 0, 2 * Math.PI);
      ctx.fill();
    },
    [brushMode, foregroundColor, backgroundColor],
  );

  const drawPoint = useCallback(
    (x: number, y: number, ctx: CanvasRenderingContext2D) => {
      const lastPos = lastPosRef.current;

      if (lastPos) {
        const [x0, y0] = lastPos;
        const d = dist(x0, y0, x, y);

        if (d > brushSpacing) {
          const spacingRatio = brushSpacing / d;
          let spacingRatioTotal = spacingRatio;

          while (spacingRatioTotal <= 1) {
            const xn = x0 + spacingRatioTotal * (x - x0);
            const yn = y0 + spacingRatioTotal * (y - y0);

            drawCircle(xn, yn, brushSize, ctx);
            spacingRatioTotal += spacingRatio;
          }
        } else {
          drawCircle(x, y, brushSize, ctx);
        }
      } else {
        drawCircle(x, y, brushSize, ctx);
      }
    },
    [brushSize, brushSpacing, dist, drawCircle],
  );

  const floodFill = useCallback(
    (x: number, y: number, ctx: CanvasRenderingContext2D) => {
      // Get image data
      const imageData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height,
      );
      const data = imageData.data;
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      // Convert fillColor to RGBA array
      let fillR, fillG, fillB, fillA;
      if (foregroundColor === "rgb(255, 255, 255)") {
        [fillR, fillG, fillB, fillA] = [255, 255, 255, 255];
      } else if (foregroundColor === "rgb(0, 0, 0)") {
        [fillR, fillG, fillB, fillA] = [0, 0, 0, 255];
      } else {
        [fillR, fillG, fillB, fillA] = [255, 255, 255, 255];
      }

      // Get the starting pixel color
      const startX = Math.floor(x);
      const startY = Math.floor(y);
      const startIdx = (startY * width + startX) * 4;
      const startColor = [
        data[startIdx],
        data[startIdx + 1],
        data[startIdx + 2],
        data[startIdx + 3],
      ];

      // If the fill color is the same as the start color, do nothing
      if (
        startColor[0] === fillR &&
        startColor[1] === fillG &&
        startColor[2] === fillB &&
        startColor[3] === fillA
      ) {
        return;
      }

      // Helper to compare pixel color with tolerance
      function matchColor(idx) {
        return (
          Math.abs(data[idx] - startColor[0]) <= tolerance &&
          Math.abs(data[idx + 1] - startColor[1]) <= tolerance &&
          Math.abs(data[idx + 2] - startColor[2]) <= tolerance &&
          Math.abs(data[idx + 3] - startColor[3]) <= tolerance
        );
      }

      // Helper to set pixel color
      function setColor(idx) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;
      }

      // Optimized scanline flood fill
      const stack = [[startX, startY]];
      while (stack.length > 0) {
        let [x, y] = stack.pop();
        let idx = (y * width + x) * 4;

        // Move to the leftmost pixel in this scanline
        while (x >= 0 && matchColor(idx)) {
          x--;
          idx -= 4;
        }
        x++;
        idx += 4;

        let spanAbove = false;
        let spanBelow = false;

        // Fill rightwards and check above/below
        while (x < width && matchColor(idx)) {
          setColor(idx);

          // Check pixel above
          if (y > 0) {
            const aboveIdx = ((y - 1) * width + x) * 4;
            if (matchColor(aboveIdx)) {
              if (!spanAbove) {
                stack.push([x, y - 1]);
                spanAbove = true;
              }
            } else if (spanAbove) {
              spanAbove = false;
            }
          }

          // Check pixel below
          if (y < height - 1) {
            const belowIdx = ((y + 1) * width + x) * 4;
            if (matchColor(belowIdx)) {
              if (!spanBelow) {
                stack.push([x, y + 1]);
                spanBelow = true;
              }
            } else if (spanBelow) {
              spanBelow = false;
            }
          }

          x++;
          idx += 4;
        }
      }

      // Update the canvas
      ctx.putImageData(imageData, 0, 0);
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click only
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        setIsDrawing(true);
        const [x, y] = getMouseXY(e);
        drawPoint(x, y, ctx);
        lastPosRef.current = [x, y];
      }
      // if (e.button === 2) {
      //   const [x, y] = getMouseXY(e);
      //   const canvas = canvasRef.current;
      //   floodFill(x, y, canvas?.getContext("2d"));
      // }
    },
    [drawPoint, getMouseXY],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      e.preventDefault();
      e.stopPropagation();

      const [x, y] = getMouseXY(e);
      drawPoint(x, y, ctx);
      lastPosRef.current = [x, y];
    },
    [isDrawing, getMouseXY, drawPoint],
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    lastPosRef.current = null;
  }, []);

  const switchColor = useCallback(() => {
    setBrushMode((prev) => (prev === "draw" ? "erase" : "draw"));
  }, []);

  const handleBrushSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBrushSize(Number(e.target.value));
    },
    [],
  );

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // Resize canvas to match image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas and draw image
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.imageSmoothingEnabled = false; // Disable smoothing like original
      ctx.drawImage(img, 0, 0, img.width, img.height);
    };

    img.onerror = () => {
      console.error("Failed to load image");
    };

    img.src = src;
  }, []);

  const loadImageFromBackend = useCallback(async () => {
    const imageSrc = await fetchImageFromBackend(imageName, dataset);
    if (imageSrc) {
      loadImage(imageSrc);
    }
  }, [imageName, dataset, loadImage]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load image
    loadImageFromBackend();

    // Initialize with black background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [loadImageFromBackend]);

  // Handle event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleContextMenu]);

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <button
          onClick={switchColor}
          style={{
            padding: "8px 16px",
            backgroundColor: brushMode === "draw" ? "#4CAF50" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {brushMode === "draw" ? "Draw (White)" : "Erase"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="brush-size">Brush Size:</label>
          <input
            id="brush-size"
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={handleBrushSizeChange}
          />
          <span style={{ minWidth: "30px", textAlign: "center" }}>
            {brushSize}
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #ccc",
          cursor: "crosshair",
          display: "block",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}
