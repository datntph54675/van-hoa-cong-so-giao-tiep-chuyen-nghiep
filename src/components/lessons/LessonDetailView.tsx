import React, { useState } from 'react';
import { Lesson } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Check,
  X,
  Lightbulb,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LessonDetailViewProps {
  lesson: Lesson;
  isCompleted: boolean;
  onToggleComplete: (lessonId: string) => void;
  onBack: () => void;
  onNavigateLesson: (lessonId: string) => void;
  allLessons: Lesson[];
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({
  lesson,
  isCompleted,
  onToggleComplete,
  onBack,
  onNavigateLesson,
  allLessons
}) => {
  // Review question state
  const [selectedReviewOption, setSelectedReviewOption] = useState<number | null>(null);
  const [hasAnsweredReview, setHasAnsweredReview] = useState(false);

  // Find previous and next lessons
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleReviewAnswer = (optionIdx: number) => {
    setSelectedReviewOption(optionIdx);
    setHasAnsweredReview(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        {/* Completion status button */}
        <button
          onClick={() => onToggleComplete(lesson.id)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-all ${
            isCompleted
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCompleted ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành (+50 XP)'}</span>
        </button>
      </div>

      {/* Lesson Hero Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Clean unboxed metadata with dot separators */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
          <span className="font-bold text-blue-900">Bài số {lesson.order}</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-600 font-medium">{lesson.category}</span>
          <span aria-hidden="true">·</span>
          <span>{lesson.estimatedMinutes} phút đọc</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900" style={{ textWrap: 'balance' }}>
          {lesson.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed border-l-2 border-blue-600 pl-4 py-0.5">
          {lesson.summary}
        </p>

        {/* Learning Objectives */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Mục tiêu bài học
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            {lesson.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Article Sections */}
      <div className="space-y-6">
        {lesson.sections.map((section, idx) => (
          <div key={idx} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
              {section.title}
            </h2>

            <p className="text-sm text-slate-700 leading-relaxed">
              {section.content}
            </p>

            {section.bulletPoints && section.bulletPoints.length > 0 && (
              <ul className="space-y-2 mt-3 text-xs sm:text-sm text-slate-700">
                {section.bulletPoints.map((bp, bidx) => (
                  <li key={bidx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">▪</span>
                    <span className="leading-relaxed">{bp}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Concrete Example Box */}
            {section.example && (
              <div className="mt-5 p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Tình huống thực tế minh họa</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 italic">
                  "{section.example.situation}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1 font-bold text-emerald-800">
                      <Check className="w-3.5 h-3.5" />
                      <span>Cách ứng xử chuyên nghiệp</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {section.example.goodApproach}
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1 font-bold text-rose-800">
                      <X className="w-3.5 h-3.5" />
                      <span>Cách ứng xử nên tránh</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {section.example.badApproach}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DOs & DONTs Checklist */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          Quy tắc Ứng xử Chuẩn mực (Nên làm & Nên tránh)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DOs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>NÊN LÀM (Chuẩn mực chuyên nghiệp)</span>
            </h3>
            <div className="space-y-2">
              {lesson.dos.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-100">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DONTs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <X className="w-4 h-4" />
              <span>NÊN TRÁNH (Tác phong thiếu chuyên nghiệp)</span>
            </h3>
            <div className="space-y-2">
              {lesson.donts.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 p-2.5 bg-rose-50/40 rounded-lg border border-rose-100">
                  <span className="text-rose-600 font-bold mt-0.5">✕</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Thông điệp cốt lõi cần ghi nhớ</span>
        </div>
        <p className="text-sm sm:text-base font-medium leading-relaxed text-blue-50">
          "{lesson.keyTakeaway}"
        </p>
      </div>

      {/* Interactive Review Question */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Câu hỏi ôn tập kiến thức</span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          {lesson.reviewQuestion.question}
        </h3>

        <div className="space-y-2">
          {lesson.reviewQuestion.options.map((option, idx) => {
            const isSelected = selectedReviewOption === idx;
            const isCorrect = idx === lesson.reviewQuestion.correctIndex;

            let optionStyle = 'border-slate-200 hover:border-blue-400 bg-white text-slate-800';
            if (hasAnsweredReview) {
              if (isCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
              } else if (isSelected) {
                optionStyle = 'border-rose-400 bg-rose-50 text-rose-900';
              } else {
                optionStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
              }
            } else if (isSelected) {
              optionStyle = 'border-blue-800 bg-blue-50 text-blue-950 font-medium';
            }

            return (
              <button
                key={idx}
                disabled={hasAnsweredReview}
                onClick={() => handleReviewAnswer(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 ${optionStyle}`}
              >
                <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1 leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {hasAnsweredReview && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-slate-800 space-y-1 animate-in fade-in">
            <strong className="text-blue-900 font-bold block">
              {selectedReviewOption === lesson.reviewQuestion.correctIndex
                ? '✓ Chính xác!'
                : '✕ Chưa chính xác!'}
            </strong>
            <p className="leading-relaxed text-slate-700">
              {lesson.reviewQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Completion and Prev/Next Navigation */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {prevLesson ? (
            <button
              onClick={() => onNavigateLesson(prevLesson.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bài trước: Bài {prevLesson.order}</span>
            </button>
          ) : (
            <div />
          )}
        </div>

        <button
          onClick={() => onToggleComplete(lesson.id)}
          className={`px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 ${
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-blue-900 hover:bg-blue-800 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCompleted ? 'Đã hoàn thành bài học này' : 'Hoàn thành bài học (+50 XP)'}</span>
        </button>

        <div>
          {nextLesson ? (
            <button
              onClick={() => onNavigateLesson(nextLesson.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span>Bài tiếp: Bài {nextLesson.order}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
};
