import ToolButton from "./ToolButton";
import { Brush, FolderSearch, Redo, StarsIcon, Undo } from "lucide-react";
import { useContext } from "react";
import { CanvasContext } from "../contexts/Contexts";
// List of tools:
// - Masking brush
// - Magic brush
// - Undo/redo
// - Open/upload image/mask
// - Hide mask
// - Hide UI
// - Undo/Redo
//

export default function Toolbar() {
  const { undo, redo } = useContext(CanvasContext);
  return (
    <div className="fixed top-1/2 -translate-y-1/2 left-2 z-50 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <ToolButton name="Masking Brush" icon={Brush} onClick={() => {}} />
        <ToolButton name="Magic Brush" icon={StarsIcon} onClick={() => {}} />
        <ToolButton name="Save Image" icon={FolderSearch} onClick={() => {}} />
      </div>
      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <ToolButton name="Undo" icon={Undo} onClick={undo} />
        <ToolButton name="Redo" icon={Redo} onClick={redo} />
      </div>
    </div>
  );
}
