import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatTile({
  label,
  value,
  hint,
  icon,
  className,
}: StatTileProps) {
  return (
    <Card size="sm" className={className}>
      <CardContent>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="font-heading text-xl font-semibold tabular-nums">
          {value}
        </div>
        {hint && (
          <div className="text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
