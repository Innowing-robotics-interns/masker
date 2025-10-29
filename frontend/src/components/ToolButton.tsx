import { type LucideIcon } from "lucide-react";

export interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

export default function ToolButton({
  icon: Icon,
  label,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      className="hover:bg-blue-500/20 hover:text-blue-800"
      onClick={onClick}
    >
      <Icon />
      <span>{label}</span>
    </button>
  );
}
