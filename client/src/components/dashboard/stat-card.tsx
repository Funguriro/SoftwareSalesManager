import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

export function StatCard({
  title,
  value,
  icon,
  iconBgClass,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className={cn("p-3 rounded-full", iconBgClass)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span 
              className={cn(
                "flex items-center",
                trend.isPositive ? "text-success-500" : "text-error-500"
              )}
            >
              {trend.isPositive ? (
                <ArrowUp className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDown className="mr-1 h-4 w-4" />
              )}
              {trend.value}%
            </span>
            <span className="text-neutral-500 ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
