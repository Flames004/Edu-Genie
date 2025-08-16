"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Brain, BookOpen, Zap, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: () => void;
  variant?: "default" | "primary";
}

function QuickActionCard({ icon: Icon, title, description, action, variant = "default" }: QuickActionProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        variant === "primary" ? "border-[#d7c9ff] bg-[#f2eeff]" : ""
      }`}
      onClick={action}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${
            variant === "primary" 
              ? "bg-[#e3d9ff] text-[#5A2ECF]" 
              : "bg-gray-100 text-gray-600"
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: Upload,
      title: "Upload Document",
      description: "Add a new PDF, DOCX, or TXT file",
      action: () => router.push("/documents?tab=upload"),
      variant: "primary" as const,
    },
    {
      icon: Brain,
      title: "Generate Summary",
      description: "Create AI-powered summaries",
      action: () => router.push("/dashboard/analysis?type=summary"),
    },
    {
      icon: BookOpen,
      title: "Create Quiz",
      description: "Generate interactive quizzes",
      action: () => router.push("/dashboard/analysis?type=quiz"),
    },
    {
      icon: Zap,
      title: "Make Flashcards",
      description: "Build study flashcards",
      action: () => router.push("/dashboard/analysis?type=flashcards"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to get you started
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/analysis")}
            className="flex items-center space-x-2"
          >
            <span>Go to Analysis</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {actions.map((action, index) => (
            <QuickActionCard
              key={index}
              icon={action.icon}
              title={action.title}
              description={action.description}
              action={action.action}
              variant={action.variant}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
