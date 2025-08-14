import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents";
import { getQuizResults } from "@/lib/api/analysis";
import { Document } from "@/types";

interface DashboardData {
  stats: {
    documents: number;
    analyses: number;
    studyTime: number;
    quizzes: {
      total: number;
      averageScore: number;
      bestScore: number;
    };
    thisWeek: {
      documents: number;
      analyses: number;
    };
  };
  recentDocuments: Document[];
}

export function useDashboardData() {
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await documentsApi.getDocuments();
      return response.documents || [];
    },
  });

  const {
    data: quizData,
    isLoading: quizLoading,
    error: quizError,
  } = useQuery({
    queryKey: ["quiz-results"],
    queryFn: getQuizResults,
  });

  // Calculate stats from documents
  const stats = {
    documents: documents?.length || 0,
    analyses: documents?.reduce((total, doc) => total + (doc.analyses?.length || 0), 0) || 0,
    studyTime: 0, // TODO: Implement study time tracking
    quizzes: {
      total: quizData?.stats.totalQuizzes || 0,
      averageScore: quizData?.stats.averageScore || 0,
      bestScore: quizData?.stats.bestScore || 0,
    },
    thisWeek: {
      documents: documents?.filter(doc => {
        const uploadDate = new Date(doc.uploadDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length || 0,
      analyses: documents?.reduce((total, doc) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentAnalyses = doc.analyses?.filter(analysis => {
          const analysisDate = new Date(analysis.createdAt);
          return analysisDate > weekAgo;
        }).length || 0;
        return total + recentAnalyses;
      }, 0) || 0,
    },
  };

  // Get recent documents (last 5)
  const recentDocuments = documents?.slice().sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  ).slice(0, 5) || [];

  const dashboardData: DashboardData = {
    stats,
    recentDocuments,
  };

  return {
    data: dashboardData,
    isLoading: documentsLoading || quizLoading,
    error: documentsError || quizError,
    refetch: () => {
      // TODO: Implement refetch for documents query
    },
  };
}
