import React, { useState } from 'react';
import { Scenario, ScenarioOption } from '../../types';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Sparkles,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface ScenariosViewProps {
  scenarios: Scenario[];
  completedScenarios: Record<string, { selectedOptionId: string; timestamp: number; score: number }>;
  onCompleteScenario: (scenarioId: string, optionId: string, score: number) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  scenarios,
  completedScenarios,
  onCompleteScenario
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0]?.id || '');
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  // Selected option state for current active scenario
  const completedState = completedScenarios[activeScenario.id];
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    completedState ? completedState.selectedOptionId : null
  );

  const selectedOption: ScenarioOption | undefined = activeScenario.options.find(
    (opt) => opt.id === selectedOptionId
  );

  const handleSelectOption = (option: ScenarioOption) => {
    setSelectedOptionId(option.id);
    onCompleteScenario(activeScenario.id, option.id, option.scoreAwarded);
  };

  const handleNextScenario = () => {
    const currentIndex = scenarios.findIndex((s) => s.id === activeScenario.id);
    if (currentIndex < scenarios.length - 1) {
      const nextId = scenarios[currentIndex + 1].id;
      setActiveScenarioId(nextId);
      const nextCompleted = completedScenarios[nextId];
      setSelectedOptionId(nextCompleted ? nextCompleted.selectedOptionId : null);
    }
  };

  const completedCount = Object.keys(completedScenarios).length;
  const totalCount = scenarios.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Khu vực Thực hành Tình huống Công sở
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mô phỏng 8 tình huống ứng xử phức tạp: Cấp trên phê bình, khách hàng khiếu nại, bất đồng cuộc họp, rò rỉ dữ liệu...
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-[200px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">Đã thực hành</span>
            <span className="font-mono tabular-nums font-bold text-blue-900">
              {completedCount}/{totalCount} tình huống
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Left scenario selector & Right simulation stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (4 cols): Scenario List Picker */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 px-1">
            Danh sách tình huống ({scenarios.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {scenarios.map((sc, index) => {
              const isCompleted = !!completedScenarios[sc.id];
              const isActive = sc.id === activeScenario.id;

              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setActiveScenarioId(sc.id);
                    const state = completedScenarios[sc.id];
                    setSelectedOptionId(state ? state.selectedOptionId : null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'border-blue-900 bg-blue-50/50 shadow-2xs'
                      : isCompleted
                      ? 'border-emerald-200 bg-white hover:border-slate-300'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-blue-900 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-700 truncate">{sc.category}</div>
                    <h3 className={`text-xs font-semibold mt-0.5 line-clamp-2 leading-snug ${
                      isActive ? 'text-blue-950 font-bold' : 'text-slate-800'
                    }`}>
                      {sc.title}
                    </h3>
                  </div>

                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Interactive Scenario Simulator */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          {/* Scenario Context Header */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <span className="font-bold text-blue-900">Tình huống #{activeScenario.order}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-600">{activeScenario.category}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeScenario.title}
            </h2>

            {/* Character role */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 text-xs font-semibold">
              <UserCheck className="w-4 h-4 text-blue-700" />
              <span>Vai trò của bạn: {activeScenario.characterRole}</span>
            </div>

            {/* Context Story */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
              <div className="font-bold text-slate-900">Bối cảnh sự việc:</div>
              <p>{activeScenario.context}</p>
            </div>

            {/* Problem Statement Dilemma */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs sm:text-sm text-amber-950 leading-relaxed">
              <span className="font-bold block text-amber-900 mb-0.5">Vấn đề cần giải quyết:</span>
              {activeScenario.problemStatement}
            </div>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Lựa chọn phương án ứng xử của bạn:
            </h3>

            <div className="space-y-3">
              {activeScenario.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;

                let borderStyle = 'border-slate-200 hover:border-blue-400 bg-white text-slate-800';
                if (isSelected) {
                  if (opt.quality === 'best') {
                    borderStyle = 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600';
                  } else if (opt.quality === 'acceptable') {
                    borderStyle = 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500';
                  } else {
                    borderStyle = 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3.5 ${borderStyle}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-blue-900 bg-blue-900 text-white'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1 leading-relaxed">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Immediate Deep Feedback Box */}
          {selectedOption && (
            <div
              className={`p-6 rounded-2xl border space-y-4 animate-in fade-in slide-in-from-top-2 ${
                selectedOption.quality === 'best'
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : selectedOption.quality === 'acceptable'
                  ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                  : 'bg-rose-50/70 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedOption.quality === 'best' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <h4 className="text-sm font-bold">
                    {selectedOption.feedbackTitle}
                  </h4>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold px-2.5 py-1 rounded-md bg-white/80 border border-current">
                  +{selectedOption.scoreAwarded} XP
                </span>
              </div>

              {/* Psychological & practical explanation */}
              <div className="text-xs sm:text-sm leading-relaxed text-slate-800 space-y-1">
                <strong className="block text-slate-900 font-semibold">Phân tích tác động:</strong>
                <p>{selectedOption.feedbackDescription}</p>
              </div>

              {/* Recommended Phrasing Script */}
              {selectedOption.recommendedPhrasing && (
                <div className="p-4 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Mẫu câu giao tiếp gợi ý (Recommended Phrasing):</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                    "{selectedOption.recommendedPhrasing}"
                  </p>
                </div>
              )}

              {/* Action: Next Scenario button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextScenario}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <span>Chuyển sang tình huống tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
