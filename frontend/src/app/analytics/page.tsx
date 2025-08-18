"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BookOpen, Brain, FileText, Trophy } from "lucide-react";
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

  // Get analysis type breakdown with better display names
  const analysisBreakdown = data?.recentDocuments.reduce((acc: Record<string, number>, doc) => {
    doc.analyses?.forEach(analysis => {
      const analysisType = analysis.taskType || 'unknown';
      acc[analysisType] = (acc[analysisType] || 0) + 1;
    });
    return acc;
  }, {}) || {};

  // Map analysis types to display names and colors
  const getAnalysisDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'summary': 'Summaries',
      'explanation': 'Explanations', 
      'quiz': 'Quizzes',
      'keywords': 'Keywords',
      'unknown': 'Other'
    };
    return typeMap[type] || type;
  };

  const getAnalysisColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'summary': 'bg-blue-500',
      'explanation': 'bg-green-500',
      'quiz': 'bg-purple-500', 
      'keywords': 'bg-orange-500',
      'unknown': 'bg-gray-500'
    };
    return colorMap[type] || 'bg-gray-500';
  };

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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100">Analytics</h1>
            <p className="text-muted-foreground dark:text-neutral-300">
              Track your learning progress and study patterns
            </p>
          </div>

          {/* Analytics Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-neutral-100">Documents Uploaded</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground dark:text-neutral-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{data?.stats.documents || 0}</div>
                <p className="text-xs text-muted-foreground dark:text-neutral-300">
                  +{documentsThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-neutral-100">Total Analyses</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground dark:text-neutral-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{totalAnalyses}</div>
                <p className="text-xs text-muted-foreground dark:text-neutral-300">
                  +{analysesThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-neutral-100">Quiz Average</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground dark:text-neutral-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                  {data?.stats.quizzes.total > 0 ? `${data?.stats.quizzes.averageScore}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground dark:text-neutral-300">
                  {data?.stats.quizzes.total || 0} quizzes taken
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-neutral-100">Avg Analyses/Doc</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground dark:text-neutral-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{avgAnalysesPerDoc}</div>
                <p className="text-xs text-muted-foreground dark:text-neutral-300">
                  Per document
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-neutral-100">This Week Activity</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground dark:text-neutral-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{documentsThisWeek + analysesThisWeek}</div>
                <p className="text-xs text-muted-foreground dark:text-neutral-300">
                  Total actions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader>
                <CardTitle className="dark:text-neutral-100">Analysis Types</CardTitle>
                <p className="text-sm text-muted-foreground dark:text-neutral-300">
                  Breakdown of your analysis activity
                </p>
              </CardHeader>
              <CardContent>
                {Object.keys(analysisBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analysisBreakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getAnalysisColor(type)}`}></div>
                          <span className="text-sm font-medium dark:text-neutral-100">{getAnalysisDisplayName(type)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground dark:text-neutral-300">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground dark:text-neutral-300">
                    <div className="text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No analyses yet</p>
                      <p className="text-xs">Start analyzing documents to see breakdown</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Performance Section */}
            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader>
                <CardTitle className="dark:text-neutral-100">Quiz Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.stats.quizzes.total > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                          <span className="text-sm font-medium dark:text-neutral-100">Best Score</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {data?.stats.quizzes.bestScore}%
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm font-medium dark:text-neutral-100">Average Score</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                          {data?.stats.quizzes.averageScore}%
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                          <span className="text-sm font-medium dark:text-neutral-100">Total Quizzes</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                          {data?.stats.quizzes.total}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground dark:text-neutral-300">
                    <div className="text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No quiz results yet</p>
                      <p className="text-xs">Complete some quizzes to see your performance</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
              <CardHeader>
                <CardTitle className="dark:text-neutral-100">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground dark:text-neutral-300">
                  Your latest document activities
                </p>
              </CardHeader>
              <CardContent>
                {data?.recentDocuments && data.recentDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentDocuments.slice(0, 5).map((doc) => (
                      <div key={doc._id} className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground dark:text-neutral-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate dark:text-neutral-100">{doc.originalName}</p>
                          <p className="text-xs text-muted-foreground dark:text-neutral-300">
                            {doc.analyses?.length || 0} analyses • {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground dark:text-neutral-300">
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
            <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
            <CardHeader>
                <CardTitle className="dark:text-neutral-100">Study Insights</CardTitle>
                <p className="text-sm text-muted-foreground dark:text-neutral-300">
                Summary of your learning patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data?.stats.documents || 0}</div>
                  <p className="text-sm text-muted-foreground dark:text-neutral-300">Documents Processed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalAnalyses}</div>
                  <p className="text-sm text-muted-foreground dark:text-neutral-300">AI Analyses Generated</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analysesThisWeek}</div>
                  <p className="text-sm text-muted-foreground dark:text-neutral-300">Analyses This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
