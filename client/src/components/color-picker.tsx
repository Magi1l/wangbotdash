import { cn } from "@/lib/utils";

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  "#5865F2", // Discord blurple
  "#FF73FA", // Discord pink
  "#3BA55D", // Discord green
  "#FEE75C", // Discord yellow
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F97316", // Orange
];

export function ColorPicker({ 
  selectedColor, 
  onColorSelect, 
  colors = defaultColors,
  className 
}: ColorPickerProps) {
  return (
    <div className={cn("color-picker-grid", className)}>
      {colors.map((color) => (
        <button
          key={color}
          className={cn(
            "w-8 h-8 rounded-lg transition-all",
            selectedColor === color && "ring-2 ring-white ring-offset-2 ring-offset-background"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
        />
      ))}
    </div>
  );
}
