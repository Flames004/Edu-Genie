"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Brain, Clock, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`} />
            <span className={`text-xs ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats?: {
    documents: number;
    analyses: number;
    studyTime: number; // in minutes
    thisWeek: {
      documents: number;
      analyses: number;
    };
  };
  isLoading?: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Default stats when loading or no data
  const defaultStats = {
    documents: 0,
    analyses: 0,
    studyTime: 0,
    thisWeek: {
      documents: 0,
      analyses: 0,
    },
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Documents"
        value={isLoading ? "..." : currentStats.documents.toString()}
        description="Documents uploaded"
        icon={FileText}
        trend={!isLoading ? {
          value: `+${currentStats.thisWeek.documents} this week`,
          isPositive: currentStats.thisWeek.documents >= 0
        } : undefined}
      />
      
      <StatsCard
        title="AI Analyses"
        value={isLoading ? "..." : currentStats.analyses.toString()}
        description="Generated insights"
        icon={Brain}
        trend={!isLoading ? {
          value: `+${currentStats.thisWeek.analyses} this week`,
          isPositive: currentStats.thisWeek.analyses >= 0
        } : undefined}
      />
      
      <StatsCard
        title="Study Time"
        value={isLoading ? "..." : formatStudyTime(currentStats.studyTime)}
        description="Time spent learning"
        icon={Clock}
      />
      
      <StatsCard
        title="Efficiency"
        value={isLoading ? "..." : currentStats.documents > 0 ? (currentStats.analyses / currentStats.documents).toFixed(1) : "0.0"}
        description="Analyses per document"
        icon={TrendingUp}
        trend={!isLoading ? {
          value: "Optimal range",
          isPositive: true
        } : undefined}
      />
    </div>
  );
}
