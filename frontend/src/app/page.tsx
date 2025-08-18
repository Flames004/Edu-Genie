"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 text-gray-900 dark:text-neutral-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="h-12 w-12 rounded-full border-2 border-[#5A2ECF] dark:border-violet-400 flex items-center justify-center">
              <Image src="/logo-genie-nobg.png" alt="EduGenie Logo" width={40} height={40} />
            </div>
            <h1 className="text-3xl font-bold text-[#5A2ECF] dark:text-violet-300">EduGenie</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-neutral-100 mb-6">
            Your AI-Powered
            <span className="text-[#5A2ECF]"> Learning Companion</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-neutral-300 mb-8">
            Upload documents, generate summaries, create quizzes and flashcards, analyze your study habits, and enjoy a beautiful, modern experience powered by AI.
          </p>
          <div className="flex justify-center space-x-4 mb-12">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Learning
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
          
            {/* Smart Summaries Card */}
            <Card className="bg-gradient-to-br from-green-50 via-green-100 to-teal-50 dark:from-emerald-900 dark:via-neutral-900 dark:to-emerald-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 mb-3">
              <CardHeader className="text-center dark:bg-neutral-900">
                <div className="w-14 h-14 bg-green-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-200 dark:ring-emerald-900">
                  <svg className="w-7 h-7 text-green-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-bold text-green-700 dark:text-emerald-200 mb-2">Smart Summaries</CardTitle>
                <CardDescription className="text-gray-600 dark:text-neutral-300">
                  Generate concise, intelligent summaries that capture key concepts
                </CardDescription>
              </CardHeader>
            </Card>
            {/* Interactive Quizzes Card */}
            <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-50 dark:from-violet-900 dark:via-neutral-900 dark:to-violet-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 mb-3">
              <CardHeader className="text-center dark:bg-neutral-900">
                <div className="w-14 h-14 bg-purple-100 dark:bg-violet-800 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-purple-200 dark:ring-violet-900">
                  <svg className="w-7 h-7 text-purple-600 dark:text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-bold text-purple-700 dark:text-violet-200 mb-2">Interactive Quizzes</CardTitle>
                <CardDescription className="text-gray-600">
                  Create custom quizzes and flashcards to test your knowledge
                </CardDescription>
              </CardHeader>
            </Card>
            {/* Flashcards & Study Tracking Card */}
            <Card className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 mb-3">
              <CardHeader className="text-center">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-yellow-200">
                  <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-bold text-yellow-700 mb-2">Flashcards & Study Tracking</CardTitle>
                <CardDescription className="text-gray-600">
                  Study with flashcards, track your progress, and see real-time dashboard updates
                </CardDescription>
              </CardHeader>
            </Card>

            {/* How EduGenie Works Section */}
          <section className="max-w-4xl mx-auto mt-16 mb-8">
            <h3 className="text-3xl font-bold text-center text-[#5A2ECF] mb-8">How EduGenie Works</h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
                <div className="w-12 h-12 bg-[#5A2ECF]/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-[#5A2ECF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                </div>
                <span className="font-semibold text-[#5A2ECF] mb-2">1. Upload</span>
                <span className="text-gray-600 text-center">Add your study materials (PDF, Word, text) in seconds.</span>
              </div>
              <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
                <div className="w-12 h-12 bg-[#00BFAE]/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-[#00BFAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4-4-4-4m8 8V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h9a2 2 0 002-2z" /></svg>
                </div>
                <span className="font-semibold text-[#00BFAE] mb-2">2. Analyze</span>
                <span className="text-gray-600 text-center">Get instant AI-powered summaries and insights.</span>
              </div>
              <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
                <div className="w-12 h-12 bg-[#7C4DFF]/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-[#7C4DFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" /></svg>
                </div>
                <span className="font-semibold text-[#7C4DFF] mb-2">3. Practice</span>
                <span className="text-gray-600 text-center">Create quizzes and flashcards to reinforce learning.</span>
              </div>
              <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                </div>
                <span className="font-semibold text-yellow-700 mb-2">4. Track</span>
                <span className="text-gray-600 text-center">Monitor your study time and progress with analytics.</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
