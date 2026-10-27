import React, { useState, useEffect } from 'react';
import { DocumentItem, AiProposal, DocumentAnalysisResult, DocumentAnalysisRecord } from '../../types';
import { AdminApiService } from '../../services/adminApi';
import {
  Sparkles,
  BookOpen,
  Target,
  FileQuestion,
  CheckCircle2,
  AlertTriangle,
  X,
  Languages,
  ArrowRight,
  RefreshCw,
  Edit2,
  Trash2,
  Send,
  Eye,
  Check,
  Ban,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Lightbulb,
  FileText
} from 'lucide-react';

interface AdminAiStudioViewProps {
  documents: DocumentItem[];
  preselectedDocId?: string;
  onRefreshAll: () => Promise<void>;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminAiStudioView: React.FC<AdminAiStudioViewProps> = ({
  documents,
  preselectedDocId,
  onRefreshAll,
  onShowToast
}) => {
  const [activeStudioTab, setActiveStudioTab] = useState<
    'analyze' | 'generate-lesson' | 'generate-scenario' | 'generate-quiz' | 'moderation-queue'
  >('analyze');

  // Tab 1: Analysis State
  const [selectedDocId, setSelectedDocId] = useState<string>(preselectedDocId || documents[0]?.id || '');
  const [rawTextToAnalyze, setRawTextToAnalyze] = useState('');
  const [sourceLang, setSourceLang] = useState('Tự động phát hiện');
  const [targetAudience, setTargetAudience] = useState('Cán bộ, nhân viên cơ quan, doanh nghiệp và sinh viên');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisRecord | DocumentAnalysisResult | null>(null);

  // Tab 2: Lesson Generation State
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonExcerpt, setLessonExcerpt] = useState('');
  const [lessonAudience, setLessonAudience] = useState('Nhân viên văn phòng');
  const [lessonDirectives, setLessonDirectives] = useState(
    'Biên soạn bài bản, rõ ràng, thực tiễn, có ví dụ cụ thể và bảng kiểm Nên làm / Nên tránh'
  );
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatedLessonProposal, setGeneratedLessonProposal] = useState<AiProposal | null>(null);

  // Tab 3: Scenario Generation State
  const [scenarioTopic, setScenarioTopic] = useState('');
  const [scenarioExcerpt, setScenarioExcerpt] = useState('');
  const [scenarioAudience, setScenarioAudience] = useState('Chuyên viên dự án / Quản lý nhóm');
  const [scenarioDirectives, setScenarioDirectives] = useState(
    'Tình huống gay cấn, có chiều sâu tâm lý, 3 phương án lựa chọn kèm giải thích cặn kẽ'
  );
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [generatedScenarioProposal, setGeneratedScenarioProposal] = useState<AiProposal | null>(null);

  // Tab 4: Quiz Generation State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizExcerpt, setQuizExcerpt] = useState('');
  const [quizCount, setQuizCount] = useState(5);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuizProposal, setGeneratedQuizProposal] = useState<AiProposal | null>(null);

  // Tab 5: Moderation Queue State
  const [proposals, setProposals] = useState<AiProposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [inspectingProposal, setInspectingProposal] = useState<AiProposal | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Load proposals on mount & tab switch
  const loadProposals = async () => {
    setIsLoadingProposals(true);
    try {
      const data = await AdminApiService.getProposals();
      setProposals(data);
    } catch (err: any) {
      console.warn('Error loading proposals:', err);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  // Update selected doc if props change
  useEffect(() => {
    if (preselectedDocId) {
      setSelectedDocId(preselectedDocId);
      const targetDoc = documents.find((d) => d.id === preselectedDocId);
      if (targetDoc?.analysisResult) {
        setAnalysisResult(targetDoc.analysisResult);
      }
    }
  }, [preselectedDocId, documents]);

  // Tab 1: Run Document Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const doc = documents.find((d) => d.id === selectedDocId);
      const res = await AdminApiService.analyzeDocument({
        documentId: selectedDocId || undefined,
        rawContent: !selectedDocId ? rawTextToAnalyze : undefined,
        sourceLanguage: sourceLang,
        targetAudienceNote: targetAudience
      });

      if (res.success && res.analysis) {
        setAnalysisResult(res.analysis);
        const detectedLang = res.analysis.detectedLanguage || res.analysis.sourceLanguage || 'Tự động';
        onShowToast(
          'Hoàn tất phân tích tài liệu!',
          `Đã nhận diện ngôn ngữ: ${detectedLang} và lưu vào kho phân tích.`,
          'success'
        );
        await onRefreshAll();
      }
    } catch (err: any) {
      onShowToast('Lỗi phân tích tài liệu', err.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick switch from proposal topic to generation
  const handleStartGenerateLessonFromTopic = (topicItem: any) => {
    setLessonTopic(topicItem.title || topicItem);
    setLessonExcerpt(analysisResult?.vietnameseSummary || '');
    setActiveStudioTab('generate-lesson');
  };

  const handleStartGenerateScenarioFromTopic = (scenItem: any) => {
    setScenarioTopic(scenItem.title || scenItem);
    setScenarioExcerpt(scenItem.context || analysisResult?.vietnameseSummary || '');
    setActiveStudioTab('generate-scenario');
  };

  // Tab 2: Run Lesson Generator
  const handleGenerateLesson = async () => {
    if (!lessonTopic.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập chủ đề bài học.', 'error');
      return;
    }

    setIsGeneratingLesson(true);
    try {
      const res = await AdminApiService.generateLesson({
        topic: lessonTopic.trim(),
        sourceExcerpt: lessonExcerpt.trim(),
        targetAudience: lessonAudience,
        directives: lessonDirectives,
        documentId: selectedDocId || undefined
      });

      if (res.success && res.proposal) {
        setGeneratedLessonProposal(res.proposal);
        onShowToast(
          'Đã tạo bản nháp bài học!',
          'Bản nháp đã được lưu vào Hàng đợi kiểm duyệt (chưa công khai cho học viên).',
          'success'
        );
        await loadProposals();
      }
    } catch (err: any) {
      onShowToast('Lỗi tạo bài học', err.message, 'error');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Tab 3: Run Scenario Generator
  const handleGenerateScenario = async () => {
    if (!scenarioTopic.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập chủ đề tình huống.', 'error');
      return;
    }

    setIsGeneratingScenario(true);
    try {
      const res = await AdminApiService.generateScenario({
        scenarioTopic: scenarioTopic.trim(),
        sourceExcerpt: scenarioExcerpt.trim(),
        targetAudience: scenarioAudience,
        directives: scenarioDirectives,
        documentId: selectedDocId || undefined
      });

      if (res.success && res.proposal) {
        setGeneratedScenarioProposal(res.proposal);
        onShowToast(
          'Đã tạo bản nháp tình huống!',
          'Bản nháp đã được lưu vào Hàng đợi kiểm duyệt (chưa công khai cho học viên).',
          'success'
        );
        await loadProposals();
      }
    } catch (err: any) {
      onShowToast('Lỗi tạo tình huống', err.message, 'error');
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  // Tab 4: Run Quiz Generator
  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập chủ đề câu hỏi trắc nghiệm.', 'error');
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const res = await AdminApiService.generateQuiz({
        topic: quizTopic.trim(),
        sourceExcerpt: quizExcerpt.trim(),
        questionCount: quizCount,
        documentId: selectedDocId || undefined
      });

      if (res.success && res.proposal) {
        setGeneratedQuizProposal(res.proposal);
        onShowToast('Đã tạo bộ câu hỏi kiểm tra!', 'Đã gửi đến Hàng đợi kiểm duyệt.', 'success');
        await loadProposals();
      }
    } catch (err: any) {
      onShowToast('Lỗi tạo câu hỏi', err.message, 'error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Tab 5: Refine proposal with AI
  const handleRefineProposal = async () => {
    if (!inspectingProposal || !refineInstruction.trim()) {
      onShowToast('Thiếu yêu cầu', 'Vui lòng nhập chỉ đạo chỉnh sửa cho AI.', 'error');
      return;
    }

    setIsRefining(true);
    try {
      const res = await AdminApiService.refineContent({
        proposalId: inspectingProposal.id,
        currentContent: inspectingProposal.contentData,
        instruction: refineInstruction.trim()
      });

      if (res.success && res.refinedContent) {
        setInspectingProposal({
          ...inspectingProposal,
          contentData: res.refinedContent
        });
        setRefineInstruction('');
        onShowToast('Đã cập nhật bản nháp theo yêu cầu!', 'Nội dung đã được tinh chỉnh thành công.', 'success');
        await loadProposals();
      }
    } catch (err: any) {
      onShowToast('Lỗi tinh chỉnh', err.message, 'error');
    } finally {
      setIsRefining(false);
    }
  };

  // Approve proposal
  const handleApprove = async (proposalId: string, status: 'published' | 'draft') => {
    try {
      await AdminApiService.approveProposal(proposalId, status);
      onShowToast(
        'Phê duyệt thành công!',
        `Nội dung đã được đưa vào hệ thống đào tạo (${status === 'published' ? 'Đã xuất bản' : 'Lưu bản nháp'}).`,
        'success'
      );
      setInspectingProposal(null);
      await loadProposals();
      await onRefreshAll();
    } catch (err: any) {
      onShowToast('Lỗi phê duyệt', err.message, 'error');
    }
  };

  // Reject proposal
  const handleReject = async () => {
    if (!inspectingProposal || !rejectReason.trim()) {
      onShowToast('Thiếu lý do', 'Vui lòng ghi rõ lý do từ chối để làm căn cứ.', 'error');
      return;
    }

    try {
      await AdminApiService.rejectProposal(inspectingProposal.id, rejectReason.trim());
      onShowToast('Đã từ chối bản đề xuất', 'Trạng thái đã được cập nhật.', 'info');
      setShowRejectModal(false);
      setRejectReason('');
      setInspectingProposal(null);
      await loadProposals();
    } catch (err: any) {
      onShowToast('Lỗi từ chối', err.message, 'error');
    }
  };

  const pendingCount = proposals.filter((p) => p.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      {/* Studio Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>AI Content Studio</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                  Gemini 3.8 Flash
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Phân tích tài liệu đa ngôn ngữ, tự động đề xuất bài học, tình huống và quy trình kiểm duyệt
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={() => setActiveStudioTab('moderation-queue')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{pendingCount} nội dung AI chờ duyệt</span>
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveStudioTab('analyze')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'analyze'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>1. Phân tích tài liệu đa ngôn ngữ</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('generate-lesson')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'generate-lesson'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Tạo bài học AI</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('generate-scenario')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'generate-scenario'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>3. Tạo tình huống thực hành AI</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('generate-quiz')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'generate-quiz'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>4. Tạo trắc nghiệm AI</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('moderation-queue')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer relative ${
              activeStudioTab === 'moderation-queue'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>5. Hàng đợi duyệt nội dung ({proposals.length})</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PHÂN TÍCH TÀI LIỆU ĐA NGÔN NGỮ                         */}
      {/* ============================================================== */}
      {activeStudioTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input selection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Nguồn tài liệu cần phân tích</span>
            </h2>

            {documents.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn từ Kho tài liệu đã lưu ({documents.length}):
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    const doc = documents.find((d) => d.id === e.target.value);
                    if (doc?.analysisResult) {
                      setAnalysisResult(doc.analysisResult);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-900 font-medium"
                >
                  <option value="">-- Dán văn bản trực tiếp bên dưới --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.sourceLanguage}] {d.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!selectedDocId && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Dán nội dung bài viết cần phân tích:
                </label>
                <textarea
                  rows={8}
                  value={rawTextToAnalyze}
                  onChange={(e) => setRawTextToAnalyze(e.target.value)}
                  placeholder="Dán bài viết tiếng Anh, Trung, Nhật, Hàn hoặc tiếng Việt tại đây..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                />
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngôn ngữ nguồn
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Tự động phát hiện">Tự động phát hiện ngôn ngữ</option>
                  <option value="English">Tiếng Anh (English)</option>
                  <option value="中文 (Chinese)">Tiếng Trung (Chinese)</option>
                  <option value="日本語 (Japanese)">Tiếng Nhật (Japanese)</option>
                  <option value="한국어 (Korean)">Tiếng Hàn (Korean)</option>
                  <option value="Tiếng Việt">Tiếng Việt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đối tượng đào tạo hướng tới
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI đang phân tích tài liệu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Chạy AI Phân Tích Chuyên Sâu</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: 9-Point Analysis Report */}
          <div className="lg:col-span-2 space-y-4">
            {analysisResult ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-blue-900 uppercase">
                      Báo cáo phân tích chuyên môn
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      Kết Quả Đánh Giá & Đề Xuất Phát Triển Nội Dung
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shrink-0">
                    Ngôn ngữ gốc: {('detectedLanguage' in analysisResult && analysisResult.detectedLanguage) || ('sourceLanguage' in analysisResult && analysisResult.sourceLanguage) || 'Tự động phát hiện'}
                  </span>
                </div>

                {/* 1. Tóm tắt tiếng Việt */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>1. Tóm tắt nội dung bằng tiếng Việt</span>
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                    {analysisResult.vietnameseSummary}
                  </div>
                </div>

                {/* 2. Chủ đề & Vấn đề giải quyết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      2. Chủ đề văn hoá công sở liên quan
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {analysisResult.identifiedTopics?.map((top, i) => (
                        <li key={i} className="flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{top}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      3. Vấn đề thực tế tại nơi làm việc giúp giải quyết
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {analysisResult.practicalProblemsSolved?.map((prob, i) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{prob}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Khái niệm cốt lõi & Nguyên tắc */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    4. Khái niệm cốt lõi & Nguyên tắc thực thi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysisResult.coreConcepts?.map((concept, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                        <span className="font-bold text-slate-900 text-blue-950 block">
                          {concept.term}
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {concept.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Khác biệt văn hóa & Rủi ro thiên kiến */}
                {analysisResult.culturalNuancesAndRisks?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>5. Cảnh báo khác biệt văn hóa & Rủi ro áp dụng tại Việt Nam</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-amber-950 leading-relaxed">
                      {analysisResult.culturalNuancesAndRisks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Đề xuất bài học & tình huống mới */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>6. Đề xuất nội dung học tập mới (Tránh trùng lặp)</span>
                    </h3>
                    <span className="text-[11px] text-slate-500">Bấm để tạo ngay</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysisResult.novelCurriculumProposals?.map((item, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-900 px-2 py-0.5 rounded bg-blue-50">
                              {item.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {item.suggestedType}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                          {item.suggestedType === 'scenario' ? (
                            <button
                              onClick={() => handleStartGenerateScenarioFromTopic(item)}
                              className="text-xs font-bold text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Tạo kịch bản tình huống</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartGenerateLessonFromTopic(item)}
                              className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Tạo bài học chi tiết</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 mx-auto flex items-center justify-center">
                  <Languages className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Chưa có kết quả phân tích tài liệu
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Hãy chọn một tài liệu từ kho lưu trữ hoặc dán văn bản bài viết bất kỳ (tiếng Anh,
                  tiếng Trung, Nhật, Hàn, Việt) và bấm nút "Chạy AI Phân Tích Chuyên Sâu".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TẠO BÀI HỌC AI                                         */}
      {/* ============================================================== */}
      {activeStudioTab === 'generate-lesson' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span>Thiết lập tạo bài học từ tài liệu</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chủ đề bài học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                placeholder="Ví dụ: Kỹ năng đàm phán đôi bên cùng có lợi (Win-Win) trong doanh nghiệp"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đoạn trích căn cứ hoặc ý tưởng chính
              </label>
              <textarea
                rows={4}
                value={lessonExcerpt}
                onChange={(e) => setLessonExcerpt(e.target.value)}
                placeholder="Trích dẫn nội dung từ tài liệu nguồn làm cơ sở..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhóm người học
                </label>
                <input
                  type="text"
                  value={lessonAudience}
                  onChange={(e) => setLessonAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chỉ đạo phong cách (Directives)
                </label>
                <input
                  type="text"
                  value={lessonDirectives}
                  onChange={(e) => setLessonDirectives(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateLesson}
              disabled={isGeneratingLesson}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingLesson ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang biên soạn bài học hoàn chỉnh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Biên Soạn Bản Nháp Bài Học</span>
                </>
              )}
            </button>
          </div>

          {/* Result preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Bản xem trước bài học vừa tạo</span>
              {generatedLessonProposal && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  Trạng thái: Chờ duyệt (Draft)
                </span>
              )}
            </h2>

            {generatedLessonProposal ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-blue-900 px-2 py-0.5 bg-blue-100 rounded">
                    {generatedLessonProposal.contentData?.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {generatedLessonProposal.contentData?.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {generatedLessonProposal.contentData?.summary}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span>Bài học đã được lưu an toàn vào Hàng đợi kiểm duyệt.</span>
                  <button
                    onClick={() => {
                      setInspectingProposal(generatedLessonProposal);
                      setActiveStudioTab('moderation-queue');
                    }}
                    className="font-bold underline text-emerald-900 cursor-pointer"
                  >
                    Xem & Duyệt ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có bài học nào được tạo trong phiên này. Hãy thiết lập chủ đề và bấm "Biên Soạn
                Bản Nháp Bài Học".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: TẠO TÌNH HUỐNG THỰC HÀNH AI                            */}
      {/* ============================================================== */}
      {activeStudioTab === 'generate-scenario' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-700" />
              <span>Thiết lập tạo kịch bản tình huống thực tế</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chủ đề tình huống <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={scenarioTopic}
                onChange={(e) => setScenarioTopic(e.target.value)}
                placeholder="Ví dụ: Xử lý email chỉ trích gay gắt từ khách hàng VIP"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bối cảnh gợi ý từ tài liệu
              </label>
              <textarea
                rows={4}
                value={scenarioExcerpt}
                onChange={(e) => setScenarioExcerpt(e.target.value)}
                placeholder="Nêu vắn tắt sự việc gây căng thẳng hoặc mâu thuẫn..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò người học
                </label>
                <input
                  type="text"
                  value={scenarioAudience}
                  onChange={(e) => setScenarioAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yêu cầu thiết kế
                </label>
                <input
                  type="text"
                  value={scenarioDirectives}
                  onChange={(e) => setScenarioDirectives(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateScenario}
              disabled={isGeneratingScenario}
              className="w-full py-3 bg-indigo-900 hover:bg-indigo-800 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingScenario ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang xây dựng kịch bản mô phỏng...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Kịch Bản Tình Huống Giả Lập</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Bản xem trước tình huống vừa tạo</span>
              {generatedScenarioProposal && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  Trạng thái: Chờ duyệt (Draft)
                </span>
              )}
            </h2>

            {generatedScenarioProposal ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {generatedScenarioProposal.contentData?.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {generatedScenarioProposal.contentData?.context}
                  </p>
                  <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-amber-950 font-medium">
                    {generatedScenarioProposal.contentData?.problemStatement}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span>Kịch bản tình huống đã sẵn sàng trong hàng đợi.</span>
                  <button
                    onClick={() => {
                      setInspectingProposal(generatedScenarioProposal);
                      setActiveStudioTab('moderation-queue');
                    }}
                    className="font-bold underline text-emerald-900 cursor-pointer"
                  >
                    Xem & Duyệt ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có tình huống nào được tạo. Hãy điền thông tin và bấm nút tạo tình huống.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: TẠO TRẮC NGHIỆM AI                                      */}
      {/* ============================================================== */}
      {activeStudioTab === 'generate-quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-blue-700" />
              <span>Thiết lập tạo câu hỏi trắc nghiệm</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chủ đề câu hỏi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="Ví dụ: Quy tắc phản hồi theo mô hình SBI và BLUF"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tài liệu căn cứ
              </label>
              <textarea
                rows={4}
                value={quizExcerpt}
                onChange={(e) => setQuizExcerpt(e.target.value)}
                placeholder="Dán đoạn trích hoặc quy chuẩn cần kiểm tra..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số lượng câu hỏi cần tạo
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={quizCount}
                onChange={(e) => setQuizCount(Number(e.target.value))}
                className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingQuiz ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang tạo bộ câu hỏi kiểm tra...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo {quizCount} Câu Hỏi Trắc Nghiệm</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Bản xem trước câu hỏi vừa tạo</span>
              {generatedQuizProposal && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  Trạng thái: Chờ duyệt (Draft)
                </span>
              )}
            </h2>

            {generatedQuizProposal ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">{generatedQuizProposal.title}</h3>
                  <ul className="space-y-2">
                    {generatedQuizProposal.contentData?.questions?.map((q: any, i: number) => (
                      <li key={i} className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px]">
                        <strong>Câu {i + 1}: </strong> {q.question}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span>Bộ câu hỏi đã được lưu vào hàng đợi duyệt.</span>
                  <button
                    onClick={() => {
                      setInspectingProposal(generatedQuizProposal);
                      setActiveStudioTab('moderation-queue');
                    }}
                    className="font-bold underline text-emerald-900 cursor-pointer"
                  >
                    Xem & Duyệt ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có câu hỏi nào được tạo. Hãy điền thông tin và bấm nút tạo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: HÀNG ĐỢI DUYỆT NỘI DUNG AI (MODERATION QUEUE)          */}
      {/* ============================================================== */}
      {activeStudioTab === 'moderation-queue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-800" />
                <span>Quy trình Kiểm Duyệt & Xuất Bản Nội Dung AI</span>
              </h2>
              <p className="text-xs text-slate-500">
                Toàn bộ nội dung do AI tạo ra đều ở trạng thái bản nháp. Chỉ khi Admin kiểm tra và
                duyệt, nội dung mới xuất hiện trên trang học tập của học viên.
              </p>
            </div>

            <button
              onClick={loadProposals}
              disabled={isLoadingProposals}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProposals ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Proposals List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposals.length === 0 ? (
              <div className="col-span-3 bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Chưa có bản đề xuất AI nào trong hàng đợi.
              </div>
            ) : (
              proposals.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setInspectingProposal(item)}
                  className={`bg-white rounded-2xl border p-5 space-y-3 cursor-pointer transition-all flex flex-col justify-between ${
                    inspectingProposal?.id === item.id
                      ? 'border-blue-900 ring-2 ring-blue-900/10 shadow-md'
                      : 'border-slate-200/90 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {item.type === 'lesson'
                          ? 'Bài học'
                          : item.type === 'scenario'
                          ? 'Tình huống'
                          : 'Trắc nghiệm'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status === 'approved'
                          ? 'Đã duyệt'
                          : item.status === 'rejected'
                          ? 'Đã từ chối'
                          : 'Chờ duyệt'}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {item.documentTitle && (
                      <p className="text-[11px] text-slate-500 truncate">
                        Nguồn: {item.documentTitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{item.createdAt}</span>
                    <span className="font-semibold text-blue-900 flex items-center gap-1">
                      Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Side-by-Side Review & Refinement Drawer / View */}
          {inspectingProposal && (
            <div className="bg-white rounded-2xl border-2 border-blue-900 shadow-xl overflow-hidden animate-in fade-in duration-200">
              {/* Header */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono text-blue-300 font-bold">
                      Kiểm duyệt song song ({inspectingProposal.type})
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-300">
                      Mã: {inspectingProposal.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {inspectingProposal.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(inspectingProposal.id, 'published')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Duyệt & Xuất bản ngay</span>
                  </button>
                  <button
                    onClick={() => handleApprove(inspectingProposal.id, 'draft')}
                    className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Lưu bản nháp
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-3.5 py-2 bg-rose-900/70 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => setInspectingProposal(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Side-by-side Layout: Left: Source Excerpt | Right: AI Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Left: Original Reference Document */}
                <div className="p-5 space-y-3 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>Căn cứ tài liệu gốc / Đoạn trích tham chiếu</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Đối chiếu dữ liệu</span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono max-h-[350px] overflow-y-auto">
                    {inspectingProposal.originalSnippet || (
                      <span className="text-slate-400 italic">
                        Không có đoạn trích trực tiếp. Được xây dựng dựa trên nguyên lý văn hóa công sở chuẩn mực.
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                    <strong>Nguyên tắc kiểm duyệt:</strong> Đối chiếu xem nội dung do AI tạo ra có bám sát nguyên tắc trong tài liệu gốc không, và có phát sinh thông tin sai lệch hoặc thiên kiến văn hóa hay không.
                  </div>
                </div>

                {/* Right: Generated Content & Refinement Form */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                      <span>Nội dung AI biên soạn (Bản nháp)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Có thể tinh chỉnh</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 max-h-[350px] overflow-y-auto space-y-3">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {JSON.stringify(inspectingProposal.contentData, null, 2)}
                    </pre>
                  </div>

                  {/* Refinement input */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Yêu cầu AI tinh chỉnh lại nội dung này:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        placeholder="Ví dụ: Viết ngắn gọn hơn, bổ sung thêm ví dụ trong cơ quan hành chính..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
                      />
                      <button
                        onClick={handleRefineProposal}
                        disabled={isRefining}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {isRefining ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Gửi lệnh sửa</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900">Từ chối nội dung AI</h3>
                <p className="text-xs text-slate-600">
                  Vui lòng nêu rõ lý do từ chối để lưu vào nhật ký kiểm duyệt:
                </p>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Ví dụ chưa thực tế, có nguy cơ gây hiểu lầm trong quy trình phối hợp..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
