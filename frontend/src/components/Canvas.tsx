import { useRef, useEffect, useState, useCallback, useContext } from "react";
import { fetchImageFromBackend } from "../utils/fetchImages";
import { CanvasContext } from "../contexts/Contexts";

interface CanvasProps {
  imageName: string;
  dataset: string;
}

export default function Canvas({ imageName, dataset }: CanvasProps) {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushMode, setBrushMode] = useState<"draw" | "erase">("draw");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<[number, number] | null>(null);
  const { maskCanvasRef, storeState, currentImageUrl } =
    useContext(CanvasContext);
  // History management

  const foregroundColor = "rgb(255, 255, 255)"; // White
  const backgroundColor = "rgb(0, 0, 0)"; // Black, used for erase mode logic
  const brushSpacing = 1;

  const getMouseXY = useCallback(
    (e: MouseEvent): [number, number] => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return [0, 0];

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      return [x, y];
    },
    [maskCanvasRef],
  );

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

  const floodFill = useCallback(
    (
      x: number,
      y: number,
      ctx: CanvasRenderingContext2D,
      tolerance: number = 254,
    ) => {
      const imageData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height,
      );
      const { data, width, height } = imageData;

      const [fillR, fillG, fillB, fillA] =
        foregroundColor === "rgb(255, 255, 255)"
          ? [255, 255, 255, 255]
          : [0, 0, 0, 255];

      const startX = Math.floor(x);
      const startY = Math.floor(y);
      const startIdx = (startY * width + startX) * 4;
      const startColor = [
        data[startIdx],
        data[startIdx + 1],
        data[startIdx + 2],
        data[startIdx + 3],
      ];

      if (
        startColor[0] === fillR &&
        startColor[1] === fillG &&
        startColor[2] === fillB &&
        startColor[3] === fillA
      ) {
        return;
      }

      const matchColor = (idx: number) =>
        Math.abs(data[idx] - startColor[0]) <= tolerance &&
        Math.abs(data[idx + 1] - startColor[1]) <= tolerance &&
        Math.abs(data[idx + 2] - startColor[2]) <= tolerance &&
        Math.abs(data[idx + 3] - startColor[3]) <= tolerance;

      const setColor = (idx: number) => {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;
      };

      const queue: [number, number][] = [[startX, startY]];
      const visited = new Set<string>([`${startX},${startY}`]);

      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) continue;
        const [currentX, currentY] = next;

        const currentIdx = (currentY * width + currentX) * 4;

        if (matchColor(currentIdx)) {
          setColor(currentIdx);

          const neighbors: [number, number][] = [
            [currentX + 1, currentY],
            [currentX - 1, currentY],
            [currentX, currentY + 1],
            [currentX, currentY - 1],
          ];

          for (const [nx, ny] of neighbors) {
            const key = `${nx},${ny}`;
            if (
              nx >= 0 &&
              nx < width &&
              ny >= 0 &&
              ny < height &&
              !visited.has(key)
            ) {
              visited.add(key);
              queue.push([nx, ny]);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },
    [foregroundColor],
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

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      storeState();
      if (e.button === 0) {
        // Left click only
        const canvas = maskCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        setIsDrawing(true);
        const [x, y] = getMouseXY(e);
        drawPoint(x, y, ctx);
        lastPosRef.current = [x, y];
      }
    },
    [drawPoint, getMouseXY, maskCanvasRef, storeState],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = maskCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      e.preventDefault();
      e.stopPropagation();

      const [x, y] = getMouseXY(e);
      drawPoint(x, y, ctx);
      lastPosRef.current = [x, y];
    },
    [isDrawing, getMouseXY, drawPoint, maskCanvasRef],
  );

  const removeGray = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas?.getContext("2d");
    if (!maskCanvas || !maskCtx) return;

    const imageData = maskCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height,
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // if closer to white, set to white; else black
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg > 127) {
        data[i] = data[i + 1] = data[i + 2] = 255;
      } else {
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
    }
    maskCtx.putImageData(imageData, 0, 0);
  }, [maskCanvasRef]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    lastPosRef.current = null;

    if (brushMode === "draw") {
      removeGray();
    }
  }, [brushMode, removeGray]);

  const switchColor = useCallback(() => {
    setBrushMode((prev) => (prev === "draw" ? "erase" : "draw"));
  }, []);

  const handleBrushSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBrushSize(Number(e.target.value));
    },
    [],
  );

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const [x, y] = getMouseXY(e);
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas?.getContext("2d");
      if (!maskCtx) return;
      floodFill(x, y, maskCtx);
      removeGray();
    },
    [floodFill, getMouseXY, maskCanvasRef, removeGray],
  );

  const loadImage = useCallback(
    (src: string) => {
      const img = new Image();
      img.onload = () => {
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const imageCtx = imageCanvas?.getContext("2d");
        const maskCtx = maskCanvas?.getContext("2d");

        if (!imageCanvas || !maskCanvas || !imageCtx || !maskCtx) return;

        // Resize canvases to match image dimensions
        imageCanvas.width = img.width;
        imageCanvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;

        // Draw image on the image canvas
        imageCtx.clearRect(0, 0, img.width, img.height);
        imageCtx.imageSmoothingEnabled = false;
        imageCtx.drawImage(img, 0, 0, img.width, img.height);

        // Initialize mask canvas to be transparent
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      };

      img.onerror = () => {
        console.error("Failed to load image");
      };

      img.src = src;
    },
    [maskCanvasRef],
  );

  const loadImageFromBackend = useCallback(async () => {
    const imageSrc = await fetchImageFromBackend(currentImageUrl);
    if (imageSrc) {
      loadImage(imageSrc);
    }
  }, [currentImageUrl, loadImage]);

  // Initialize canvas
  useEffect(() => {
    loadImageFromBackend();
  }, [loadImageFromBackend]);

  // Handle event listeners
  useEffect(() => {
    const canvas = maskCanvasRef.current;
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
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    maskCanvasRef,
  ]);

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <div className="flex items-center gap-4 p-2">
        <button
          onClick={switchColor}
          className={`px-4 py-2 text-white border-none rounded cursor-pointer ${
            brushMode === "draw" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {brushMode === "draw" ? "Draw (White)" : "Erase"}
        </button>

        <div className="flex items-center gap-2.5">
          <label htmlFor="brush-size">Brush Size:</label>
          <input
            id="brush-size"
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={handleBrushSizeChange}
          />
          <span className="min-w-[30px] text-center">{brushSize}</span>
        </div>
      </div>

      <div className="relative w-fit h-fit border border-gray-300 shadow-md">
        <canvas ref={imageCanvasRef} className="block" />
        <canvas
          ref={maskCanvasRef}
          className="absolute top-0 left-0 block cursor-crosshair opacity-80"
        />
      </div>
    </main>
  );
}
