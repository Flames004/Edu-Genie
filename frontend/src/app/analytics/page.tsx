"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BookOpen, Brain, FileText } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function AnalyticsPage() {
  const { data, isLoading } = useDashboardData();

  // Calculate additional analytics
  const totalAnalyses = data?.stats.analyses || 0;
  const documentsThisWeek = data?.stats.thisWeek.documents || 0;
  const analysesThisWeek = data?.stats.thisWeek.analyses || 0;
  
  // Calculate average analyses per document
  const avgAnalysesPerDoc = data?.stats.documents > 0 
    ? (totalAnalyses / data.stats.documents).toFixed(1)
    : "0";

  // Get analysis type breakdown
  const analysisBreakdown = data?.recentDocuments.reduce((acc: Record<string, number>, doc) => {
    doc.analyses?.forEach(analysis => {
      acc[analysis.type] = (acc[analysis.type] || 0) + 1;
    });
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                Track your learning progress and study patterns
              </p>
            </div>
            
            {/* Loading State */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your learning progress and study patterns
            </p>
          </div>

          {/* Analytics Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.documents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{documentsThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnalyses}</div>
                <p className="text-xs text-muted-foreground">
                  +{analysesThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Analyses/Doc</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgAnalysesPerDoc}</div>
                <p className="text-xs text-muted-foreground">
                  Per document
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week Activity</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentsThisWeek + analysesThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Total actions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Types</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Breakdown of your analysis activity
                </p>
              </CardHeader>
              <CardContent>
                {Object.keys(analysisBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analysisBreakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium capitalize">{type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No analyses yet</p>
                      <p className="text-xs">Start analyzing documents to see breakdown</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your latest document activities
                </p>
              </CardHeader>
              <CardContent>
                {data?.recentDocuments && data.recentDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentDocuments.slice(0, 5).map((doc) => (
                      <div key={doc._id} className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.analyses?.length || 0} analyses • {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No documents yet</p>
                      <p className="text-xs">Upload documents to see activity</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Study Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Study Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Summary of your learning patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data?.stats.documents || 0}</div>
                  <p className="text-sm text-muted-foreground">Documents Processed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalAnalyses}</div>
                  <p className="text-sm text-muted-foreground">AI Analyses Generated</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{analysesThisWeek}</div>
                  <p className="text-sm text-muted-foreground">Analyses This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
