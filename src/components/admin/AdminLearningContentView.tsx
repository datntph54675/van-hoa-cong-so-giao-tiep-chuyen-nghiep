import React, { useState, useEffect, useMemo } from 'react';
import { AdminApiService } from '../../services/adminApi';
import {
  Layers,
  Search,
  Filter,
  BookOpen,
  Target,
  FileQuestion,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  Archive,
  XCircle,
  Copy,
  Edit3,
  Trash2,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  History,
  Check,
  Split
} from 'lucide-react';

interface LearningContentItem {
  id: string;
  type: 'lesson' | 'scenario' | 'quiz' | 'analysis';
  title: string;
  summaryOrContext?: string;
  categoryOrTopic?: string;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  sourceAnalysisId?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  createdBy?: string;
  approvedBy?: string;
  editHistory?: Array<{ editedAt: string; editedBy: string; summary: string }>;
  rawData: any;
}

interface AdminLearningContentViewProps {
  initialDocumentFilter?: string;
  onNavigateToDocument: (docId: string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
  onDataChanged?: () => Promise<void>;
}

export const AdminLearningContentView: React.FC<AdminLearningContentViewProps> = ({
  initialDocumentFilter,
  onNavigateToDocument,
  onShowToast,
  onDataChanged
}) => {
  const [items, setItems] = useState<LearningContentItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    lessons: 0,
    scenarios: 0,
    quizzes: 0,
    analyses: 0,
    drafts: 0,
    pending: 0,
    published: 0,
    archived: 0
  });
  const [availableDocuments, setAvailableDocuments] = useState<Array<{ id: string; title: string; linkedCount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentFilter || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Drawers
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<LearningContentItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<LearningContentItem | null>(null);
  const [compareSourceDoc, setCompareSourceDoc] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editNote, setEditNote] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Load data
  const loadContent = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiService.getLearningContent({
        type: selectedType !== 'all' ? selectedType : undefined,
        sourceDocumentId: selectedDocId !== 'all' ? selectedDocId : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm.trim() || undefined
      });
      setItems(res.items as any);
      setCounts(res.counts);
      setAvailableDocuments(res.availableDocuments);
    } catch (err: any) {
      onShowToast('Lỗi tải dữ liệu', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [selectedType, selectedDocId, selectedStatus]);

  // Handle immediate search on enter or debounced
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadContent();
  };

  // Open edit modal
  const openEditModal = (item: LearningContentItem) => {
    setSelectedItemForEdit(item);
    setEditTitle(item.title);
    setEditSummary(item.summaryOrContext || '');
    setEditStatus(item.status);
    setEditNote('');
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;

    setIsSavingEdit(true);
    try {
      const payload: any = {
        status: editStatus,
        editNote: editNote.trim() || `Cập nhật thông tin và trạng thái: ${editStatus}`
      };

      if (selectedItemForEdit.type === 'lesson') {
        payload.title = editTitle.trim();
        payload.summary = editSummary.trim();
      } else if (selectedItemForEdit.type === 'scenario') {
        payload.title = editTitle.trim();
        payload.problemStatement = editSummary.trim();
      } else if (selectedItemForEdit.type === 'quiz') {
        payload.question = editTitle.trim();
        payload.explanation = editSummary.trim();
      } else if (selectedItemForEdit.type === 'analysis') {
        payload.vietnameseSummary = editSummary.trim();
      }

      await AdminApiService.updateLearningContent(selectedItemForEdit.type, selectedItemForEdit.id, payload);
      onShowToast('Đã lưu thay đổi!', `Nội dung đã được cập nhật thành công (Trạng thái: ${editStatus}).`, 'success');
      setSelectedItemForEdit(null);
      if (selectedItemForDetail && selectedItemForDetail.id === selectedItemForEdit.id) {
        setSelectedItemForDetail(null);
      }
      await loadContent();
      if (onDataChanged) await onDataChanged();
    } catch (err: any) {
      onShowToast('Lỗi cập nhật', err.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Change status directly
  const handleQuickStatusChange = async (item: LearningContentItem, newStatus: string) => {
    try {
      await AdminApiService.updateLearningContent(item.type, item.id, {
        status: newStatus,
        editNote: `Chuyển nhanh trạng thái sang: "${newStatus === 'published' ? 'Đã xuất bản' : newStatus === 'draft' ? 'Bản nháp' : 'Đã lưu trữ'}"`
      });
      onShowToast(
        'Đã đổi trạng thái!',
        `"${item.title.slice(0, 30)}..." chuyển thành: ${newStatus === 'published' ? 'Đã xuất bản' : newStatus === 'draft' ? 'Bản nháp' : 'Đã lưu trữ'}`,
        'success'
      );
      await loadContent();
      if (onDataChanged) await onDataChanged();
      if (selectedItemForDetail && selectedItemForDetail.id === item.id) {
        setSelectedItemForDetail({
          ...selectedItemForDetail,
          status: newStatus
        });
      }
    } catch (err: any) {
      onShowToast('Lỗi đổi trạng thái', err.message, 'error');
    }
  };

  // Duplicate
  const handleDuplicate = async (item: LearningContentItem) => {
    try {
      await AdminApiService.duplicateLearningContent(item.type, item.id);
      onShowToast('Đã nhân bản nội dung!', 'Bản sao mới đã được tạo ở trạng thái Bản nháp.', 'success');
      await loadContent();
      if (onDataChanged) await onDataChanged();
    } catch (err: any) {
      onShowToast('Lỗi nhân bản', err.message, 'error');
    }
  };

  // Delete
  const handleDelete = async (item: LearningContentItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa "${item.title}"? Thao tác này không thể hoàn tác.`)) {
      try {
        await AdminApiService.deleteLearningContent(item.type, item.id);
        onShowToast('Đã xóa nội dung', '', 'info');
        if (selectedItemForDetail?.id === item.id) setSelectedItemForDetail(null);
        await loadContent();
        if (onDataChanged) await onDataChanged();
      } catch (err: any) {
        onShowToast('Lỗi xóa nội dung', err.message, 'error');
      }
    }
  };

  // Compare with source document
  const handleOpenCompare = async (item: LearningContentItem) => {
    if (!item.sourceDocumentId) {
      onShowToast('Không có tài liệu gốc', 'Nội dung này không được tạo từ tài liệu nguồn.', 'info');
      return;
    }
    try {
      const details = await AdminApiService.getDocumentDetails(item.sourceDocumentId);
      setCompareSourceDoc(details);
      setIsComparing(true);
    } catch (err: any) {
      onShowToast('Không thể tải tài liệu gốc', err.message, 'error');
    }
  };

  // Render Type Badge
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'lesson':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <BookOpen className="w-3 h-3 text-blue-600" /> Bài học
          </span>
        );
      case 'scenario':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Target className="w-3 h-3 text-purple-600" /> Tình huống
          </span>
        );
      case 'quiz':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <FileQuestion className="w-3 h-3 text-amber-600" /> Câu hỏi trắc nghiệm
          </span>
        );
      case 'analysis':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Sparkles className="w-3 h-3 text-teal-600" /> Báo cáo phân tích AI
          </span>
        );
      default:
        return null;
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xuất bản
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Bản nháp
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" /> Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Bị từ chối
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Archive className="w-3 h-3 text-slate-500" /> Đã lưu trữ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Kho Nội Dung Học Tập Được Tạo Từ AI
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
              {counts.total} nội dung
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị tập trung toàn bộ bài học, tình huống thực hành, câu hỏi trắc nghiệm và báo cáo phân tích liên kết với tài liệu tham khảo.
          </p>
        </div>

        <button
          onClick={loadContent}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới kho</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        {/* Type switcher tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: 'all', label: 'Tất cả loại', count: counts.total },
            { id: 'lesson', label: 'Bài học', count: counts.lessons },
            { id: 'scenario', label: 'Tình huống', count: counts.scenarios },
            { id: 'quiz', label: 'Câu hỏi trắc nghiệm', count: counts.quizzes },
            { id: 'analysis', label: 'Báo cáo AI', count: counts.analyses }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === tab.id
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedType === tab.id ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, chủ đề hoặc nội dung..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-teal-800"
            />
          </form>

          {/* Source Document Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:bg-white focus:border-teal-800"
            >
              <option value="all">Tất cả tài liệu tham khảo nguồn ({availableDocuments.length})</option>
              {availableDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title.slice(0, 45)}... ({doc.linkedCount} nội dung)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:bg-white focus:border-teal-800"
            >
              <option value="all">Tất cả trạng thái ({counts.total})</option>
              <option value="draft">Bản nháp ({counts.drafts})</option>
              <option value="pending">Chờ duyệt ({counts.pending})</option>
              <option value="published">Đã xuất bản ({counts.published})</option>
              <option value="archived">Đã lưu trữ ({counts.archived})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-teal-800 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Đang nạp kho nội dung học tập...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Không tìm thấy nội dung phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Thử điều chỉnh lại bộ lọc tìm kiếm hoặc quay lại Kho tài liệu tham khảo để chạy AI phân tích tạo nội dung mới.
          </p>
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedDocId('all');
              setSelectedStatus('all');
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400/80 shadow-2xs hover:shadow-xs p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Item Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {renderTypeBadge(item.type)}
                  {renderStatusBadge(item.status)}
                  {item.categoryOrTopic && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.categoryOrTopic}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono ml-auto md:ml-0">
                    {item.updatedAt}
                  </span>
                </div>

                <h3
                  onClick={() => setSelectedItemForDetail(item)}
                  className="text-sm sm:text-base font-bold text-slate-900 hover:text-teal-900 cursor-pointer transition-colors line-clamp-2"
                >
                  {item.title}
                </h3>

                {item.summaryOrContext && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.summaryOrContext}
                  </p>
                )}

                {/* Source Document Provenance Link */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                  {item.sourceDocumentTitle ? (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">Tài liệu gốc:</span>
                      <button
                        onClick={() => item.sourceDocumentId && onNavigateToDocument(item.sourceDocumentId)}
                        className="text-teal-900 hover:text-teal-700 font-bold underline cursor-pointer flex items-center gap-1"
                        title="Mở xem chi tiết tài liệu gốc này"
                      >
                        <span>{item.sourceDocumentTitle.slice(0, 45)}...</span>
                        <ExternalLink className="w-3 h-3 text-teal-800 shrink-0" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Không có tài liệu nguồn trực tiếp</span>
                  )}

                  {item.sourceAnalysisId && (
                    <span className="text-[10px] text-slate-500 font-mono bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded-md">
                      Lần phân tích: {item.sourceAnalysisId.slice(0, 15)}...
                    </span>
                  )}

                  {item.createdBy && (
                    <span className="text-slate-400">
                      Tạo bởi: <strong className="text-slate-600 font-medium">{item.createdBy}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                <button
                  onClick={() => setSelectedItemForDetail(item)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Xem chi tiết đầy đủ nội dung"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>Chi tiết</span>
                </button>

                <button
                  onClick={() => openEditModal(item)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Chỉnh sửa nội dung và trạng thái"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Sửa</span>
                </button>

                {item.status === 'draft' ? (
                  <button
                    onClick={() => handleQuickStatusChange(item, 'published')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Duyệt và xuất bản ngay nội dung này"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Duyệt & Xuất bản</span>
                  </button>
                ) : item.status === 'published' ? (
                  <button
                    onClick={() => handleQuickStatusChange(item, 'draft')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Chuyển về trạng thái Bản nháp để chỉnh sửa thêm"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Về bản nháp</span>
                  </button>
                ) : null}

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicate(item)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Nhân bản nội dung này"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Xóa nội dung này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {renderTypeBadge(selectedItemForDetail.type)}
                  {renderStatusBadge(selectedItemForDetail.status)}
                  <span className="text-xs font-mono text-slate-400">ID: {selectedItemForDetail.id}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                  {selectedItemForDetail.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedItemForDetail)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  onClick={() => setSelectedItemForDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              {/* Provenance & Bidirectional link banner */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-800 shrink-0" />
                    <span className="font-bold text-teal-950">Nguồn gốc nội dung:</span>
                    {selectedItemForDetail.sourceDocumentTitle ? (
                      <span className="text-teal-900 font-medium">
                        "{selectedItemForDetail.sourceDocumentTitle}"
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Không có tài liệu nguồn trực tiếp</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedItemForDetail.sourceDocumentId && (
                      <button
                        onClick={() => {
                          onNavigateToDocument(selectedItemForDetail.sourceDocumentId!);
                          setSelectedItemForDetail(null);
                        }}
                        className="px-3 py-1 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>Mở tài liệu gốc</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {selectedItemForDetail.sourceDocumentId && (
                      <button
                        onClick={() => handleOpenCompare(selectedItemForDetail)}
                        className="px-3 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Split className="w-3.5 h-3.5 text-teal-800" />
                        <span>Đối chiếu nguồn</span>
                      </button>
                    )}
                  </div>
                </div>

                {selectedItemForDetail.sourceAnalysisId && (
                  <div className="text-[11px] text-teal-800/80 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>
                      Được tạo từ phiên phân tích AI: <strong className="font-mono">{selectedItemForDetail.sourceAnalysisId}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Render Full Content Depending on Type */}
              {selectedItemForDetail.type === 'lesson' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tóm tắt bài học</h3>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-medium">
                      {selectedItemForDetail.rawData.summary}
                    </p>
                  </div>

                  {Array.isArray(selectedItemForDetail.rawData.objectives) && selectedItemForDetail.rawData.objectives.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mục tiêu học tập</h3>
                      <ul className="space-y-1.5 pl-4 list-disc text-slate-700">
                        {selectedItemForDetail.rawData.objectives.map((obj: string, i: number) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(selectedItemForDetail.rawData.sections) && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Các phần nội dung chi tiết</h3>
                      {selectedItemForDetail.rawData.sections.map((sec: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                          <h4 className="font-bold text-slate-900 text-sm">{sec.title}</h4>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{sec.content}</p>

                          {Array.isArray(sec.bulletPoints) && (
                            <ul className="space-y-1 pl-4 list-disc text-slate-600 text-xs">
                              {sec.bulletPoints.map((bp: string, bpi: number) => (
                                <li key={bpi}>{bp}</li>
                              ))}
                            </ul>
                          )}

                          {sec.example && (
                            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-xs">
                              <span className="font-bold text-amber-900">Ví dụ thực tế:</span>
                              <p className="text-amber-950 font-medium">{sec.example.situation}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                                  <strong>Nên làm:</strong> {sec.example.goodApproach}
                                </div>
                                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                                  <strong>Nên tránh:</strong> {sec.example.badApproach}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dos & Donts */}
                  {(selectedItemForDetail.rawData.dos || selectedItemForDetail.rawData.donts) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1 text-xs">
                        <strong className="text-emerald-900 font-bold block mb-1">Nên làm (Dos):</strong>
                        <ul className="space-y-1 list-disc pl-4 text-emerald-950">
                          {(selectedItemForDetail.rawData.dos || []).map((d: string, i: number) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1 text-xs">
                        <strong className="text-rose-900 font-bold block mb-1">Nên tránh (Donts):</strong>
                        <ul className="space-y-1 list-disc pl-4 text-rose-950">
                          {(selectedItemForDetail.rawData.donts || []).map((d: string, i: number) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedItemForDetail.type === 'scenario' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold text-xs uppercase">Vai trò người học:</span>
                    <p className="font-bold text-slate-800">{selectedItemForDetail.rawData.characterRole}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-xs uppercase">Bối cảnh tình huống:</span>
                    <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-medium">
                      {selectedItemForDetail.rawData.context}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-xs uppercase">Vấn đề đặt ra:</span>
                    <p className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 font-bold">
                      {selectedItemForDetail.rawData.problemStatement}
                    </p>
                  </div>

                  {Array.isArray(selectedItemForDetail.rawData.options) && (
                    <div className="space-y-3">
                      <span className="text-slate-400 font-bold text-xs uppercase">Các phương án lựa chọn và phản hồi:</span>
                      {selectedItemForDetail.rawData.options.map((opt: any, i: number) => (
                        <div
                          key={opt.id || i}
                          className={`p-4 rounded-2xl border space-y-2 text-xs ${
                            opt.quality === 'best'
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : opt.quality === 'poor'
                              ? 'bg-rose-50/70 border-rose-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">Phương án {i + 1}: {opt.text}</span>
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-white border">
                              +{opt.scoreAwarded || 0} điểm
                            </span>
                          </div>
                          {opt.feedbackTitle && (
                            <div className="font-semibold text-slate-700">{opt.feedbackTitle}</div>
                          )}
                          {opt.feedbackDescription && (
                            <p className="text-slate-600">{opt.feedbackDescription}</p>
                          )}
                          {opt.recommendedPhrasing && (
                            <div className="text-[11px] italic bg-white/80 p-2 rounded-lg border border-slate-200/60">
                              Câu khuyên dùng: "{opt.recommendedPhrasing}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedItemForDetail.type === 'quiz' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-400 font-bold text-xs uppercase">Nội dung câu hỏi:</span>
                    <h3 className="text-base font-bold text-slate-900">{selectedItemForDetail.rawData.question}</h3>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold text-xs uppercase">Các phương án trả lời:</span>
                    {(selectedItemForDetail.rawData.options || []).map((opt: string, i: number) => {
                      const isCorrect = i === selectedItemForDetail.rawData.correctAnswerIndex;
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + i)}. {opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                              Đáp án chính xác
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                    <strong className="font-bold block text-blue-900">Giải thích chi tiết:</strong>
                    <p>{selectedItemForDetail.rawData.explanation}</p>
                  </div>
                </div>
              )}

              {selectedItemForDetail.type === 'analysis' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-400 font-bold text-xs uppercase">Bản tóm tắt tiếng Việt:</span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {selectedItemForDetail.rawData.vietnameseSummary}
                    </p>
                  </div>

                  {Array.isArray(selectedItemForDetail.rawData.coreConcepts) && selectedItemForDetail.rawData.coreConcepts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-slate-400 font-bold text-xs uppercase">Khái niệm cốt lõi:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedItemForDetail.rawData.coreConcepts.map((c: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                            <strong className="text-teal-900 block font-bold">{c.term}</strong>
                            <p className="text-slate-600 mt-0.5">{c.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit History Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Lịch sử chỉnh sửa và kiểm duyệt ({selectedItemForDetail.editHistory?.length || 0} lần ghi nhận)
                  </h4>
                </div>

                {selectedItemForDetail.editHistory && selectedItemForDetail.editHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItemForDetail.editHistory.map((hist, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">{hist.summary}</span>
                          <div className="text-[11px] text-slate-400">
                            Thực hiện bởi: <strong className="text-slate-600">{hist.editedBy}</strong>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{hist.editedAt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa có bản ghi chỉnh sửa nào được lưu.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Trạng thái: <strong>{selectedItemForDetail.status}</strong>
              </div>

              <div className="flex items-center gap-2">
                {selectedItemForDetail.status === 'draft' ? (
                  <button
                    onClick={() => handleQuickStatusChange(selectedItemForDetail, 'published')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt & Xuất bản ngay</span>
                  </button>
                ) : selectedItemForDetail.status === 'published' ? (
                  <button
                    onClick={() => handleQuickStatusChange(selectedItemForDetail, 'draft')}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Chuyển về bản nháp</span>
                  </button>
                ) : null}

                <button
                  onClick={() => setSelectedItemForDetail(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {selectedItemForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Chỉnh Sửa Nội Dung Học Tập ({selectedItemForEdit.type.toUpperCase()})
                </h3>
                <p className="text-xs text-slate-500">Mọi chỉnh sửa đều được ghi lại trong lịch sử kiểm duyệt.</p>
              </div>
              <button
                onClick={() => setSelectedItemForEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề / Câu hỏi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tóm tắt / Giải thích / Vấn đề tình huống
                </label>
                <textarea
                  rows={4}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái kiểm duyệt
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="pending">Chờ thẩm định (Pending)</option>
                    <option value="published">Đã xuất bản (Published)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú chỉnh sửa (Audit Log)
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Ví dụ: Bổ sung ví dụ thực tế..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForEdit(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-Side Compare Source Document Modal */}
      {isComparing && compareSourceDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Split className="w-4 h-4 text-teal-800" />
                  Đối Chiếu Với Tài Liệu Tham Khảo Gốc
                </h3>
                <p className="text-xs text-slate-500">
                  So sánh nội dung học tập đã tạo với văn bản nguyên bản đã trích xuất
                </p>
              </div>
              <button
                onClick={() => setIsComparing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              {/* Left Column: Original Document */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">VĂN BẢN NGUYÊN BẢN GỐC</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {compareSourceDoc.document.sourceLanguage} | {compareSourceDoc.originalContent.length} ký tự
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs line-clamp-2">
                  {compareSourceDoc.document.title}
                </h4>
                <div className="overflow-y-auto max-h-[50vh] p-3 bg-white rounded-xl border border-slate-100 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                  {compareSourceDoc.originalContent}
                </div>
              </div>

              {/* Right Column: AI Analysis or Selected Item */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                  <span className="font-bold text-teal-950">NỘI DUNG HỌC TẬP TỰ ĐỘNG SINH</span>
                  <span className="text-[10px] font-bold text-teal-800 uppercase">
                    {selectedItemForDetail?.type || 'Nội dung'}
                  </span>
                </div>
                <h4 className="font-bold text-teal-900 text-xs line-clamp-2">
                  {selectedItemForDetail?.title}
                </h4>
                <div className="overflow-y-auto max-h-[50vh] p-3 bg-white rounded-xl border border-teal-100 text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedItemForDetail?.summaryOrContext || JSON.stringify(selectedItemForDetail?.rawData, null, 2)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsComparing(false)}
                className="px-4 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng đối chiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
