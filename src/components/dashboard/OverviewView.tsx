import React from 'react';
import { Lesson, Scenario, QuizResult, UserProfile, NavTab } from '../../types';
import { RecentActivity } from '../../services/storage';
import {
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  Zap,
  Target
} from 'lucide-react';

interface OverviewViewProps {
  profile: UserProfile;
  lessons: Lesson[];
  scenarios: Scenario[];
  completedLessonIds: string[];
  completedScenarios: Record<string, any>;
  quizHistory: QuizResult[];
  points: number;
  unlockedBadges: string[];
  recentActivities: RecentActivity[];
  onNavigate: (tab: NavTab, detailId?: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  profile,
  lessons,
  scenarios,
  completedLessonIds,
  completedScenarios,
  quizHistory,
  points,
  unlockedBadges,
  recentActivities,
  onNavigate
}) => {
  const totalLessons = lessons.length;
  const completedCount = completedLessonIds.length;
  const completionPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const totalQuizzes = quizHistory.length;
  const avgQuizScore =
    totalQuizzes > 0
      ? Math.round(
          quizHistory.reduce((acc, curr) => acc + curr.percentage, 0) / totalQuizzes
        )
      : 0;

  const completedScenariosCount = Object.keys(completedScenarios).length;

  // Next recommended lesson is the first uncompleted lesson
  const recommendedLesson =
    lessons.find((l) => !completedLessonIds.includes(l.id)) || lessons[0];

  // In-progress lessons (up to 2)
  const inProgressLessons = lessons
    .filter((l) => !completedLessonIds.includes(l.id))
    .slice(0, 3);

  // Determine user rank title based on points
  const getRankTitle = (pts: number) => {
    if (pts >= 700) return 'Đại Sứ Văn Hóa';
    if (pts >= 500) return 'Chuyên Viên Cao Cấp';
    if (pts >= 300) return 'Nhân Viên Tiên Tiến';
    return 'Học Viên Tiềm Năng';
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_workplace_culture_1792583598654.jpg"
            alt="Môi trường làm việc chuyên nghiệp"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-2">
            <span>{profile.department}</span>
            <span aria-hidden="true">·</span>
            <span>{getRankTitle(points)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3" style={{ textWrap: 'balance' }}>
            Chào buổi sáng, {profile.name}!
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            Nâng tầm chuẩn mực văn hóa công sở, hoàn thiện kỹ năng giao tiếp và tự tin xử lý mọi tình huống phức tạp trong môi trường làm việc chuyên nghiệp.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('lessons', recommendedLesson?.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <span>Tiếp tục học: {recommendedLesson ? recommendedLesson.title : 'Bài học'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('scenarios')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium rounded-lg backdrop-blur-xs border border-white/15 transition-colors whitespace-nowrap"
            >
              <Target className="w-4 h-4 text-blue-400" />
              <span>Thực hành tình huống</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Real Metrics (Tabular figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Points & Rank */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Điểm tích lũy (XP)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {points} <span className="text-xs font-sans text-slate-700 font-normal">XP</span>
          </div>
          <div className="text-xs text-slate-700 mt-2">
            Danh hiệu: <strong className="text-blue-900 font-medium">{getRankTitle(points)}</strong>
          </div>
        </div>

        {/* Metric 2: Completed Lessons */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Tiến độ bài học</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {completedCount} <span className="text-sm font-sans text-slate-700 font-normal">/ {totalLessons}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Quiz Average */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Điểm kiểm tra trung bình</span>
            <FileQuestion className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalQuizzes > 0 ? `${avgQuizScore}%` : 'Chưa thi'}
          </div>
          <div className="text-xs text-slate-700 mt-2">
            Đã làm <span className="font-mono tabular-nums font-medium text-slate-900">{totalQuizzes}</span> bài kiểm tra
          </div>
        </div>

        {/* Metric 4: Scenarios Practiced */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Thực hành tình huống</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {completedScenariosCount} <span className="text-sm font-sans text-slate-700 font-normal">/ {scenarios.length}</span>
          </div>
          <div className="text-xs text-slate-700 mt-2">
            Đã mở khóa <span className="font-mono tabular-nums font-medium text-slate-900">{unlockedBadges.length}</span> huy hiệu
          </div>
        </div>
      </div>

      {/* Main Grid: Recommended Learning + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): In-progress and Recommended Lessons */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Bài học đề xuất & Đang theo học</h2>
            <button
              onClick={() => onNavigate('lessons')}
              className="text-xs font-semibold text-blue-800 hover:text-blue-950 flex items-center gap-1 transition-colors"
            >
              Xem tất cả ({totalLessons})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {inProgressLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => onNavigate('lessons', lesson.id)}
                className="group p-5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  {/* Clean unboxed metadata with subtle dots */}
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="font-medium text-blue-900">{lesson.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lesson.estimatedMinutes} phút đọc</span>
                    <span aria-hidden="true">·</span>
                    <span>{lesson.sections.length} phần nội dung</span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                    {lesson.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {lesson.summary}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center">
                  <span className="text-xs font-medium text-blue-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Vào bài học <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {inProgressLessons.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-slate-900">Tuyệt vời! Bạn đã hoàn thành tất cả bài học</h4>
                <p className="text-xs text-slate-700 mt-1">
                  Hãy thử sức với bài thi kiểm tra chứng chỉ hoặc luyện tập thêm các tình huống giao tiếp.
                </p>
              </div>
            )}
          </div>

          {/* Quick Scenario Practice Highlight */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-800">Thực hành tương tác</span>
              <h3 className="text-base font-bold text-slate-900">
                Luyện phản xạ xử lý tình huống công sở
              </h3>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                8 kịch bản thực tế mô phỏng: Cấp trên phê bình gay gắt, khách hàng VIP khiếu nại, đồng nghiệp trễ deadline... Chọn phương án và nhận phân tích chuyên sâu.
              </p>
            </div>
            <button
              onClick={() => onNavigate('scenarios')}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shrink-0 shadow-2xs transition-colors"
            >
              Bắt đầu tình huống
            </button>
          </div>
        </div>

        {/* Right Column (1 span): Recent Activities & Quick AI Tutor card */}
        <div className="space-y-6">
          {/* Ask AI quick widget */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Trợ lý AI Công Sở</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang băn khoăn về cách từ chối sếp khéo léo, viết email xin lỗi hay giải quyết bất đồng với đồng nghiệp?
            </p>
            <button
              onClick={() => onNavigate('ai-tutor')}
              className="w-full py-2 px-3 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Hỏi Cố vấn ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h3>
              <span className="text-[11px] text-slate-700">Thời gian thực</span>
            </div>

            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 leading-snug">{act.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-700 mt-0.5">
                      <span>{new Date(act.timestamp).toLocaleDateString('vi-VN')}</span>
                      {act.pointsEarned > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-800 font-medium font-mono tabular-nums">
                            +{act.pointsEarned} XP
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {recentActivities.length === 0 && (
                <p className="text-xs text-slate-700 py-3 text-center">Chưa có hoạt động nào được ghi nhận.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
