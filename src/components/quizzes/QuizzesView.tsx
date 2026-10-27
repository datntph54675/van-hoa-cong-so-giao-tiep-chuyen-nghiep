import React, { useState, useMemo } from 'react';
import { QuizQuestion, QuizTopic, QuizResult } from '../../types';
import { QUIZ_TOPICS } from '../../data/seedData';
import {
  FileQuestion,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Award,
  AlertCircle,
  HelpCircle,
  History
} from 'lucide-react';

interface QuizzesViewProps {
  quizQuestions: QuizQuestion[];
  quizHistory: QuizResult[];
  onSaveQuizResult: (result: QuizResult) => number;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  quizQuestions,
  quizHistory,
  onSaveQuizResult
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);

  // Active quiz topic
  const activeTopic = useMemo(
    () => QUIZ_TOPICS.find((t) => t.id === selectedTopicId),
    [selectedTopicId]
  );

  // Filter questions for the active topic
  const activeQuestions = useMemo(() => {
    if (!activeTopic) return [];
    return quizQuestions.filter((q) => activeTopic.questionIds.includes(q.id));
  }, [quizQuestions, activeTopic]);

  const currentQuestion = activeQuestions[currentQuestionIndex];

  // Start a quiz
  const handleStartQuiz = (topicId: string) => {
    setSelectedTopicId(topicId);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setLastResult(null);
  };

  // Choose an answer
  const handleSelectAnswer = (qId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex
    }));
  };

  // Submit quiz
  const handleSubmitQuiz = () => {
    if (!activeTopic) return;

    let correctCount = 0;
    activeQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });

    const total = activeQuestions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = percentage >= 80;

    const result: QuizResult = {
      id: 'res-' + Date.now(),
      quizId: activeTopic.id,
      quizTitle: activeTopic.title,
      score: correctCount,
      totalQuestions: total,
      percentage,
      passed,
      timestamp: Date.now(),
      userAnswers
    };

    onSaveQuizResult(result);
    setLastResult(result);
    setIsSubmitted(true);
  };

  // Retake current quiz
  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setLastResult(null);
  };

  // Quit to topic selection
  const handleExitQuiz = () => {
    setSelectedTopicId(null);
    setIsSubmitted(false);
    setLastResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      {!selectedTopicId && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Kiểm tra Kiến thức & Đánh giá Năng lực
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Thực hiện bài kiểm tra trắc nghiệm theo từng chủ đề hoặc bài thi chứng chỉ toàn diện để đánh giá chuẩn mực ứng xử.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-[200px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium">Lịch sử bài thi</span>
              <span className="font-mono tabular-nums font-bold text-blue-900">
                {quizHistory.length} lượt thi
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              Điểm TB:{' '}
              <strong className="text-slate-900 font-mono tabular-nums">
                {quizHistory.length > 0
                  ? Math.round(
                      quizHistory.reduce((a, b) => a + b.percentage, 0) /
                        quizHistory.length
                    )
                  : 0}
                %
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: TOPIC SELECTION */}
      {!selectedTopicId && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUIZ_TOPICS.map((topic) => {
              const qCount = topic.questionIds.length;
              const isComprehensive = topic.id === 'topic-comprehensive';
              const topicHistory = quizHistory.filter((h) => h.quizId === topic.id);
              const bestScore = topicHistory.length > 0
                ? Math.max(...topicHistory.map((h) => h.percentage))
                : null;

              return (
                <div
                  key={topic.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    isComprehensive
                      ? 'md:col-span-2 bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-blue-800 shadow-md'
                      : 'bg-white border-slate-200/80 hover:border-blue-400 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-mono tabular-nums ${isComprehensive ? 'text-blue-300' : 'text-slate-700'}`}>
                        {qCount} câu hỏi · {topic.durationMinutes} phút
                      </span>

                      {bestScore !== null && (
                        <span className={`font-semibold ${
                          bestScore >= 80
                            ? isComprehensive ? 'text-emerald-300' : 'text-emerald-700'
                            : isComprehensive ? 'text-amber-300' : 'text-amber-700'
                        }`}>
                          Điểm cao nhất: {bestScore}%
                        </span>
                      )}
                    </div>

                    <h3 className={`text-lg font-bold leading-snug ${isComprehensive ? 'text-white' : 'text-slate-900'}`}>
                      {topic.title}
                    </h3>

                    <p className={`text-xs leading-relaxed ${isComprehensive ? 'text-blue-100' : 'text-slate-600'}`}>
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-current/15 flex items-center justify-between">
                    <span className={`text-xs ${isComprehensive ? 'text-blue-200' : 'text-slate-700'}`}>
                      Chuẩn đạt: ≥ 80%
                    </span>

                    <button
                      onClick={() => handleStartQuiz(topic.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isComprehensive
                          ? 'bg-white text-blue-950 hover:bg-blue-50'
                          : 'bg-blue-900 text-white hover:bg-blue-800'
                      }`}
                    >
                      <span>Bắt đầu bài thi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quiz History Table */}
          {quizHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-900" />
                  <span>Lịch sử các bài kiểm tra đã làm</span>
                </h3>
                <span className="text-xs text-slate-700">Dữ liệu thực tế</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-700">
                      <th className="py-2.5 font-semibold">Tên bài kiểm tra</th>
                      <th className="py-2.5 font-semibold">Ngày thực hiện</th>
                      <th className="py-2.5 font-semibold text-center">Số câu đúng</th>
                      <th className="py-2.5 font-semibold text-center">Điểm số</th>
                      <th className="py-2.5 font-semibold text-right">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-900">{item.quizTitle}</td>
                        <td className="py-3 text-slate-700">
                          {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 text-center font-mono tabular-nums">
                          {item.score}/{item.totalQuestions}
                        </td>
                        <td className="py-3 text-center font-mono tabular-nums font-bold">
                          {item.percentage}%
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block font-semibold ${
                              item.passed ? 'text-emerald-800' : 'text-amber-800'
                            }`}
                          >
                            {item.passed ? '✓ Đạt chuẩn' : '✕ Cần ôn luyện thêm'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ACTIVE QUIZ IN-PROGRESS OR REVIEW */}
      {selectedTopicId && activeTopic && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quiz Header Bar */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <button
              onClick={handleExitQuiz}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thoát bài thi</span>
            </button>

            <div className="text-center">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {activeTopic.title}
              </h2>
              <span className="text-xs text-slate-700">
                Câu {currentQuestionIndex + 1} / {activeQuestions.length}
              </span>
            </div>

            <div className="text-xs font-mono tabular-nums text-slate-700">
              Đã trả lời: {Object.keys(userAnswers).length}/{activeQuestions.length}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  ((currentQuestionIndex + 1) / activeQuestions.length) * 100
                )}%`
              }}
            />
          </div>

          {/* Quick Question Number Jump Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeQuestions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = currentQuestionIndex === idx;

              let btnClass = 'bg-white text-slate-600 border border-slate-200';
              if (isCurrent) {
                btnClass = 'bg-blue-900 text-white font-bold ring-2 ring-blue-900/30';
              } else if (isSubmitted) {
                const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;
                btnClass = isCorrect
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300';
              } else if (isAnswered) {
                btnClass = 'bg-blue-50 text-blue-900 border-blue-200 font-medium';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono tabular-nums flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Câu hỏi số {currentQuestionIndex + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  const isCorrect = currentQuestion.correctAnswerIndex === optIdx;

                  let style =
                    'border-slate-200 hover:border-blue-400 bg-white text-slate-800';
                  if (isSubmitted) {
                    if (isCorrect) {
                      style =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500';
                    } else if (isSelected) {
                      style =
                        'border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-400';
                    } else {
                      style = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    style =
                      'border-blue-900 bg-blue-50/70 text-blue-950 font-medium ring-1 ring-blue-900';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitted}
                      onClick={() => handleSelectAnswer(currentQuestion.id, optIdx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3.5 ${style}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-blue-900 bg-blue-900 text-white'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="flex-1 leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Shown when submitted) */}
              {isSubmitted && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Giải thích đáp án:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Prev / Next controls inside the card */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none py-1.5 px-3 rounded-lg border border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                {!isSubmitted && currentQuestionIndex === activeQuestions.length - 1 ? (
                  <button
                    onClick={handleSubmitQuiz}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    Nộp bài & Chấm điểm
                  </button>
                ) : (
                  <button
                    disabled={currentQuestionIndex === activeQuestions.length - 1}
                    onClick={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(activeQuestions.length - 1, prev + 1)
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none py-1.5 px-3 rounded-lg border border-slate-200"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Summary Score Card (When Submitted) */}
          {isSubmitted && lastResult && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 text-center sm:text-left">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Kết quả bài kiểm tra
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {lastResult.quizTitle}
                  </h3>
                </div>

                <div className="text-center sm:text-right">
                  <div className="text-3xl font-extrabold text-blue-900 font-mono tabular-nums">
                    {lastResult.percentage}%
                  </div>
                  <span className="text-xs text-slate-700">
                    Đúng {lastResult.score} / {lastResult.totalQuestions} câu
                  </span>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                  lastResult.passed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <strong>
                  {lastResult.passed
                    ? '🎉 Chúc mừng! Bạn đã đạt chuẩn năng lực bài kiểm tra này.'
                    : '⚠️ Bạn chưa đạt chuẩn 80%. Hãy xem lại phần giải thích chi tiết và làm lại bài kiểm tra nhé!'}
                </strong>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại bài này</span>
                </button>

                <button
                  onClick={handleExitQuiz}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>Hoàn tất & Quay lại danh mục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
