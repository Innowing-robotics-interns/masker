// Docs for reference:
// https://new.konvajs.org/docs/react/Free_Drawing.html
// https://new.konvajs.org/docs/react/Images.html

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Line } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";

interface LineData {
  tool: string;
  points: number[];
}

export default function Canvas() {
  // Prevent default right click context menu
  useEffect(() => {
    const handleContextMenu = (e: PointerEvent) => {
      e.preventDefault();
    };

    // attach the event listener to
    // the document object
    document.addEventListener("contextmenu", handleContextMenu);

    // clean up the event listener when
    // the component unmounts
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  const [img] = useImage("/datasets/test1/images/137.png/new");
  const canvasSize = img
    ? { width: img.width, height: img.height }
    : { width: 800, height: 600 };

  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState<LineData[]>([]);
  const isDrawing = useRef(false);
  const isFilling = useRef(false);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0) {
      isDrawing.current = true;
    }
    if (e.evt.button === 2) {
      isFilling.current = true;
    }
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      setLines([...lines, { tool, points: [pos.x, pos.y] }]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point || lines.length === 0) {
      return;
    }

    const lastLine = lines[lines.length - 1];
    const updatedLine = {
      ...lastLine,
      points: lastLine.points.concat([point.x, point.y]),
    };

    // replace last
    const newLines = [...lines];
    newLines.splice(newLines.length - 1, 1, updatedLine);
    setLines(newLines);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div>
      <select
        value={tool}
        onChange={(e) => {
          setTool(e.target.value);
        }}
      >
        <option value="pen">Pen</option>
        <option value="eraser">Eraser</option>
      </select>
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        {/* Image layer */}
        <Layer>
          <Image
            image={img}
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </Layer>

        {/* Drawing layer */}
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#df4b26"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === "eraser" ? "destination-out" : "source-over"
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
