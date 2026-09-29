import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import CategoryIcon from "./CategoryIcon";
import type { Category } from "@/types";

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export default function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", className)}
      style={{
        color: category.color,
        backgroundColor: `color-mix(in oklch, ${category.color} 12%, transparent)`,
        borderColor: `color-mix(in oklch, ${category.color} 35%, transparent)`,
      }}
    >
      <CategoryIcon name={category.icon} aria-hidden className="size-3" />
      {category.name}
    </Badge>
  );
}
