import React from 'react';
import { Lesson, Scenario, QuizResult, NavTab } from '../../types';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';

interface ProgressViewProps {
  lessons: Lesson[];
  scenarios: Scenario[];
  completedLessonIds: string[];
  completedScenarios: Record<string, any>;
  quizHistory: QuizResult[];
  points: number;
  unlockedBadgeIds: string[];
  onNavigate: (tab: NavTab, id?: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  lessons,
  scenarios,
  completedLessonIds,
  completedScenarios,
  quizHistory,
  points,
  unlockedBadgeIds,
  onNavigate
}) => {
  const totalLessons = lessons.length;
  const completedCount = completedLessonIds.length;
  const lessonPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const totalScenarios = scenarios.length;
  const completedScenariosCount = Object.keys(completedScenarios).length;
  const scenarioPercent = totalScenarios > 0 ? Math.round((completedScenariosCount / totalScenarios) * 100) : 0;

  // Average quiz score
  const avgQuizScore =
    quizHistory.length > 0
      ? Math.round(
          quizHistory.reduce((a, b) => a + b.percentage, 0) / quizHistory.length
        )
      : 0;

  // Domain categories mastery estimation
  const domainMastery = [
    {
      domain: 'Chuẩn mực Văn hóa & Tác phong',
      relatedLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
      relatedTopic: 'topic-culture'
    },
    {
      domain: 'Giao tiếp Cấp trên & Đồng nghiệp',
      relatedLessons: ['lesson-4', 'lesson-5', 'lesson-7'],
      relatedTopic: 'topic-interpersonal'
    },
    {
      domain: 'Đối ngoại, Thư tín Email & Hội họp',
      relatedLessons: ['lesson-6', 'lesson-8'],
      relatedTopic: 'topic-communication-tools'
    },
    {
      domain: 'Xử lý Xung đột, Đạo đức số & Bảo mật',
      relatedLessons: ['lesson-9', 'lesson-10'],
      relatedTopic: 'topic-ethics-conflicts'
    }
  ].map((d) => {
    const compL = d.relatedLessons.filter((id) => completedLessonIds.includes(id)).length;
    const totalL = d.relatedLessons.length;
    const lScore = (compL / totalL) * 60; // 60% weight from lessons

    const topicResult = quizHistory.find((q) => q.quizId === d.relatedTopic);
    const qScore = topicResult ? (topicResult.percentage / 100) * 40 : 20; // 40% weight from quiz

    const finalPercent = Math.min(100, Math.round(lScore + qScore));
    return {
      domain: d.domain,
      percent: finalPercent,
      completedLessons: compL,
      totalLessons: totalL
    };
  });

  // Strengths and Improvements
  const strengths = domainMastery.filter((d) => d.percent >= 70);
  const areasToImprove = domainMastery.filter((d) => d.percent < 70);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Báo cáo Tiến độ & Đánh giá Năng lực
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tổng hợp dữ liệu thực tế về tiến độ học tập, kết quả kiểm tra và phân tích năng lực chuyên nghiệp.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-[200px]">
          <div className="text-[11px] text-slate-700">Tổng điểm kinh nghiệm</div>
          <div className="text-xl font-extrabold text-blue-900 font-mono tabular-nums">
            {points} <span className="text-xs font-normal text-slate-700">XP</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
            <span>Tiến độ toàn khóa</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {lessonPercent}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${lessonPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-700 pt-1">
            Đã hoàn thành {completedCount}/{totalLessons} bài học chuẩn mực
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
            <span>Thực hành tình huống</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {scenarioPercent}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${scenarioPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-700 pt-1">
            Đã vượt qua {completedScenariosCount}/{totalScenarios} kịch bản thực tế
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
            <span>Điểm kiểm tra trung bình</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {quizHistory.length > 0 ? `${avgQuizScore}%` : '---'}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{ width: `${avgQuizScore}%` }}
            />
          </div>
          <p className="text-xs text-slate-700 pt-1">
            Dựa trên {quizHistory.length} bài thi trắc nghiệm đã nộp
          </p>
        </div>
      </div>

      {/* Domain Mastery Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Đánh giá Năng lực theo 4 Trụ cột Chuẩn mực
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Mức độ thuần thục được tính toán kết hợp từ số bài học đã đọc và điểm số bài thi tương ứng.
          </p>
        </div>

        <div className="space-y-5">
          {domainMastery.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800">
                <span>{item.domain}</span>
                <span className="font-mono tabular-nums text-blue-900">
                  {item.percent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    item.percent >= 80
                      ? 'bg-emerald-500'
                      : item.percent >= 50
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-700 flex items-center justify-between">
                <span>Đã học {item.completedLessons}/{item.totalLessons} bài học</span>
                <span>
                  {item.percent >= 80 ? 'Thành thạo' : item.percent >= 50 ? 'Khá' : 'Cần củng cố'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvement Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Kỹ năng nổi bật</span>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-900">{s.domain}:</strong> Đạt {s.percent}% mức độ chuẩn mực. Bạn thể hiện sự am hiểu vững chắc về nhóm kỹ năng này.
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-700 p-4 bg-slate-50 rounded-xl">
              Chưa có nhóm kỹ năng nào đạt trên 70%. Hãy tiếp tục hoàn thành thêm các bài học và bài kiểm tra nhé!
            </p>
          )}
        </div>

        {/* Needs Improvement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Kỹ năng cần tập trung cải thiện</span>
          </div>
          {areasToImprove.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {areasToImprove.map((s, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 bg-amber-50/50 rounded-lg border border-amber-100">
                  <span className="text-amber-600 font-bold">!</span>
                  <div>
                    <strong className="text-slate-900">{s.domain}:</strong> Hiện đạt {s.percent}%. Đề xuất ôn tập lại các bài học liên quan và làm lại bài kiểm tra trắc nghiệm.
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-800 p-4 bg-emerald-50 rounded-xl font-medium">
              Tuyệt vời! Toàn bộ 4 trụ cột kỹ năng đều đạt chuẩn trên 70%.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
