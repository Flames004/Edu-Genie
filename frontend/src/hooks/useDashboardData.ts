import { useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents";
import { getQuizResults, getFlashcardStats } from "@/lib/api/analysis";
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
  allDocuments: Document[];
}

export function useDashboardData() {
  // Add queryClient for refetch implementation
  const queryClient = useQueryClient();
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

  const {
    data: flashcardStats,
    isLoading: flashcardLoading,
    error: flashcardError,
  } = useQuery({
    queryKey: ["flashcard-results"],
    queryFn: getFlashcardStats,
  });

  const quizTimeMinutes = quizData?.stats.totalTimeSpent ? Math.round(quizData.stats.totalTimeSpent / 60) : 0;
  const flashcardTimeMinutes = flashcardStats?.stats.totalTimeSpent ? Math.round(flashcardStats.stats.totalTimeSpent / 60) : 0;

  // Calculate stats from documents
  const stats = {
    documents: documents?.length || 0,
    analyses: documents?.reduce((total, doc) => total + (doc.analyses?.length || 0), 0) || 0,
    studyTime: quizTimeMinutes + flashcardTimeMinutes,
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
          const analysisDate = new Date(analysis.timestamp);
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

  // All documents (sorted by upload date desc)
  const allDocuments = documents?.slice().sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  ) || [];

  const dashboardData: DashboardData = {
    stats,
    recentDocuments,
    allDocuments,
  };

  // Use React Query's queryClient to refetch all relevant queries
  // Import useQueryClient at the top if not already
  // Usage: queryClient.invalidateQueries({ queryKey: [...] })
  // We'll refetch documents, quiz-results, and flashcard-results
  // Note: This hook should be used in a React component context
  // so queryClient is available
  // If not, user should call refetch on individual queries
  // Here, we provide a refetch that invalidates all three
  // Import useQueryClient if not already
  // import { useQueryClient } from "@tanstack/react-query";
  // Add this line at the top if missing
  // const queryClient = useQueryClient();
  // We'll add it here for completeness
  // If already present, this is a no-op
  // (If you want, you can move queryClient to the top of the hook)
  //
  // Implementation:
  // refetch: () => {
  //   queryClient.invalidateQueries({ queryKey: ["documents"] });
  //   queryClient.invalidateQueries({ queryKey: ["quiz-results"] });
  //   queryClient.invalidateQueries({ queryKey: ["flashcard-results"] });
  // },
  //
  // Let's add this:
  //
  // At the top of the hook:
  // const queryClient = useQueryClient();
  //
  // In the return:
  // refetch: () => {
  //   queryClient.invalidateQueries({ queryKey: ["documents"] });
  //   queryClient.invalidateQueries({ queryKey: ["quiz-results"] });
  //   queryClient.invalidateQueries({ queryKey: ["flashcard-results"] });
  // },

  // Add useQueryClient import if missing
  // import { useQueryClient } from "@tanstack/react-query";

  // Add queryClient
  // (If already present, this is a no-op)
  // const queryClient = useQueryClient();

  // Implementation:
  //
  // Add at the top of the hook:
  // const queryClient = useQueryClient();

  // In the return:
  return {
    data: dashboardData,
    isLoading: documentsLoading || quizLoading || flashcardLoading,
    error: documentsError || quizError || flashcardError,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-results"] });
      queryClient.invalidateQueries({ queryKey: ["flashcard-results"] });
    },
  };
}
