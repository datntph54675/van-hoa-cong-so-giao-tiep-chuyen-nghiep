import React, { useState, useEffect } from 'react';
import { DocumentItem, DocumentAnalysisRecord, AdminLesson, AdminScenario, AdminQuizQuestion } from '../../types';
import { AdminApiService } from '../../services/adminApi';
import {
  Files,
  Plus,
  Search,
  Globe,
  FileText,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Languages,
  Edit3,
  Copy,
  Layers,
  Clock,
  ArrowRight,
  RefreshCw,
  FileCode,
  Tag,
  Check,
  Filter
} from 'lucide-react';

interface AdminDocumentsViewProps {
  documents: DocumentItem[];
  onDocumentAdded: () => Promise<void>;
  onNavigateToAiStudio: (docId: string) => void;
  onNavigateToLearningContent: (docId: string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminDocumentsView: React.FC<AdminDocumentsViewProps> = ({
  documents,
  onDocumentAdded,
  onNavigateToAiStudio,
  onNavigateToLearningContent,
  onShowToast
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');

  // New Document Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'paste' | 'url' | 'file'>('paste');
  const [title, setTitle] = useState('');
  const [authorOrOrg, setAuthorOrOrg] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [fileFormat, setFileFormat] = useState<'PDF' | 'DOCX' | 'TXT' | 'URL' | 'Khác'>('TXT');
  const [description, setDescription] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('Tự động phát hiện');
  const [targetAudienceNote, setTargetAudienceNote] = useState('Cán bộ, nhân viên văn phòng và sinh viên');
  const [topic, setTopic] = useState('Văn hoá công sở & Kỹ năng giao tiếp');
  const [isVerified, setIsVerified] = useState(true);

  // Edit Document Modal
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthorOrOrg, setEditAuthorOrOrg] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editFormat, setEditFormat] = useState<'PDF' | 'DOCX' | 'TXT' | 'URL' | 'Khác'>('TXT');
  const [editDescription, setEditDescription] = useState('');
  const [editKeywordsInput, setEditKeywordsInput] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Document Details Modal / Drawer
  const [activeDetailDocId, setActiveDetailDocId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    document: DocumentItem;
    originalContent: string;
    analyses: DocumentAnalysisRecord[];
    linkedLessons: AdminLesson[];
    linkedScenarios: AdminScenario[];
    linkedQuizzes: AdminQuizQuestion[];
    linkedCount: number;
  } | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'reader' | 'ai-history' | 'linked-content'>('info');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Reader text search & copy
  const [readerSearchTerm, setReaderSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Missing content update within reader
  const [newExtractedText, setNewExtractedText] = useState('');
  const [isUpdatingOriginalContent, setIsUpdatingOriginalContent] = useState(false);

  // Re-analysis state
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Safe Delete Modal
  const [docToDelete, setDocToDelete] = useState<{
    id: string;
    title: string;
    linkedCount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch URL loading
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered & Sorted documents
  const filteredDocs = documents
    .filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.authorOrOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.sourceLanguage && d.sourceLanguage.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(d.keywords) && d.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchFormat =
        formatFilter === 'all' ||
        (d.fileFormat ? d.fileFormat.toLowerCase() === formatFilter.toLowerCase() : formatFilter === 'url' && !!d.url);

      const matchLang =
        languageFilter === 'all' ||
        d.sourceLanguage.toLowerCase().includes(languageFilter.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'analyzed' && d.status === 'analyzed') ||
        (statusFilter === 'raw' && d.status === 'raw') ||
        (statusFilter === 'archived' && d.status === 'archived');

      return matchSearch && matchFormat && matchLang && matchStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || a.accessDate).getTime();
      const timeB = new Date(b.createdAt || b.accessDate).getTime();
      return dateSort === 'newest' ? timeB - timeA : timeA - timeB;
    });

  // Open Document Detail
  const handleOpenDetail = async (docId: string, initialTab: 'info' | 'reader' | 'ai-history' | 'linked-content' = 'info') => {
    setActiveDetailDocId(docId);
    setDetailTab(initialTab);
    setIsLoadingDetails(true);
    setReaderSearchTerm('');
    try {
      const res = await AdminApiService.getDocumentDetails(docId);
      setDetailData(res);
      setNewExtractedText(res.originalContent || '');
    } catch (err: any) {
      onShowToast('Lỗi tải chi tiết tài liệu', err.message, 'error');
      setActiveDetailDocId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open Edit Document Modal
  const handleOpenEdit = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditAuthorOrOrg(doc.authorOrOrg || '');
    setEditUrl(doc.url || '');
    setEditFormat(doc.fileFormat || (doc.url ? 'URL' : 'TXT'));
    setEditDescription(doc.description || '');
    setEditKeywordsInput(Array.isArray(doc.keywords) ? doc.keywords.join(', ') : '');
    setEditContent(doc.originalContent || doc.sourceSnippet || '');
    setEditTopic(doc.topic || '');
  };

  // Submit Edit Document
  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsSubmittingEdit(true);
    try {
      const keywords = editKeywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await AdminApiService.updateDocument(editingDoc.id, {
        title: editTitle.trim(),
        authorOrOrg: editAuthorOrOrg.trim(),
        url: editUrl.trim() || undefined,
        fileFormat: editFormat,
        description: editDescription.trim(),
        keywords,
        originalContent: editContent.trim(),
        topic: editTopic.trim()
      });

      onShowToast('Cập nhật thành công!', 'Thông tin tài liệu đã được lưu bền vững.', 'success');
      setEditingDoc(null);
      await onDocumentAdded();
      if (activeDetailDocId === editingDoc.id) {
        await handleOpenDetail(editingDoc.id, detailTab);
      }
    } catch (err: any) {
      onShowToast('Lỗi cập nhật tài liệu', err.message, 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Re-analyze document explicitly (Creates a brand new analysis record without deleting old history)
  const handleReanalyze = async (docId: string) => {
    setIsReanalyzing(true);
    try {
      const res = await AdminApiService.reanalyzeDocument(docId);
      onShowToast(
        'Phân tích lại hoàn tất!',
        `Đã tạo bản phân tích mới và sinh ${res.createdDrafts.lessonIds.length} bài học, ${res.createdDrafts.scenarioIds.length} tình huống, ${res.createdDrafts.quizIds.length} câu hỏi.`,
        'success'
      );
      await onDocumentAdded();
      // Reload detail
      await handleOpenDetail(docId, 'ai-history');
    } catch (err: any) {
      onShowToast('Lỗi phân tích tài liệu', err.message, 'error');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Save updated original content directly from reader
  const handleUpdateOriginalContent = async () => {
    if (!detailData || !newExtractedText.trim()) return;
    setIsUpdatingOriginalContent(true);
    try {
      await AdminApiService.updateDocument(detailData.document.id, {
        originalContent: newExtractedText.trim()
      });
      onShowToast('Đã lưu nội dung gốc!', 'Văn bản đã được lưu bền vững vào kho dữ liệu.', 'success');
      await handleOpenDetail(detailData.document.id, 'reader');
      await onDocumentAdded();
    } catch (err: any) {
      onShowToast('Lỗi cập nhật nội dung gốc', err.message, 'error');
    } finally {
      setIsUpdatingOriginalContent(false);
    }
  };

  // Copy reader content
  const handleCopyReaderContent = () => {
    if (!detailData?.originalContent) return;
    navigator.clipboard.writeText(detailData.originalContent);
    setIsCopied(true);
    onShowToast('Đã sao chép!', 'Toàn bộ nội dung gốc đã được sao chép vào bộ nhớ tạm.', 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Prompt safe delete
  const promptDelete = (doc: DocumentItem) => {
    setDocToDelete({
      id: doc.id,
      title: doc.title,
      linkedCount: doc.linkedContentCount || 0
    });
  };

  // Execute safe delete with chosen strategy
  const handleConfirmDelete = async (strategy: 'disassociate' | 'cascade' | 'keep') => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const res = await AdminApiService.deleteDocument(docToDelete.id, strategy);
      onShowToast('Xóa tài liệu thành công!', res.message || '', 'success');
      setDocToDelete(null);
      if (activeDetailDocId === docToDelete.id) {
        setActiveDetailDocId(null);
      }
      await onDocumentAdded();
    } catch (err: any) {
      onShowToast('Lỗi xóa tài liệu', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch URL in add modal
  const handleFetchUrl = async () => {
    setUrlFetchError(null);
    if (!url.trim()) {
      setUrlFetchError('Vui lòng nhập địa chỉ URL bài viết.');
      return;
    }

    setIsFetchingUrl(true);
    try {
      const res = await AdminApiService.fetchUrl(url.trim());
      if (res.success) {
        if (!title.trim() && res.title) {
          setTitle(res.title);
        }
        setContent(res.extractedContent);
        setFileFormat('URL');
        onShowToast('Đã tải nội dung URL!', `Trích xuất ${res.sourceLength} ký tự văn bản sạch từ trang web.`, 'success');
      }
    } catch (err: any) {
      setUrlFetchError(err.message || 'Không thể lấy nội dung từ URL.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // File upload in add modal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (ext === 'PDF') setFileFormat('PDF');
    else if (ext === 'DOCX' || ext === 'DOC') setFileFormat('DOCX');
    else setFileFormat('TXT');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        onShowToast('Đã đọc file!', `Đã nạp file ${file.name} (${text.length} ký tự).`, 'info');
      }
    };
    reader.readAsText(file);
  };

  // Submit new document
  const handleSubmitNewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng cung cấp tiêu đề và nội dung tài liệu.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await AdminApiService.createDocument({
        title: title.trim(),
        authorOrOrg: authorOrOrg.trim() || 'Tài liệu nghiệp vụ',
        url: url.trim() || undefined,
        fileFormat,
        description: description.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        sourceLanguage,
        targetLanguage: 'Tiếng Việt',
        topic,
        targetAudienceNote,
        content: content.trim(),
        isVerified
      } as any);

      if (res.isDuplicate) {
        onShowToast('Cảnh báo trùng lặp', 'Tài liệu này có thể đã có trong hệ thống.', 'info');
      } else {
        onShowToast('Lưu tài liệu thành công!', 'Tài liệu đã được đưa vào kho tham khảo.', 'success');
      }

      await onDocumentAdded();
      setIsNewModalOpen(false);
      // Reset form
      setTitle('');
      setContent('');
      setUrl('');
      setAuthorOrOrg('');
      setDescription('');
      setKeywordsInput('');
    } catch (err: any) {
      onShowToast('Lỗi lưu tài liệu', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Kho Tài Liệu Tham Khảo Đa Ngôn Ngữ
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
              {documents.length} tài liệu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ nguyên bản tài liệu nghiên cứu, trích xuất nội dung văn bản và theo dõi lịch sử phân tích AI đa phiên bản.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4.5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nhập tài liệu mới</span>
        </button>
      </div>

      {/* 1.1: Comprehensive Search & Multi-criteria Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tài liệu, tác giả/tổ chức, chủ đề, ngôn ngữ hoặc từ khóa..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-teal-800"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Format Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Định dạng:</label>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:bg-white focus:border-teal-800"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="TXT">Văn bản TXT</option>
              <option value="URL">Trang web (URL)</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Ngôn ngữ nguồn:</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:bg-white focus:border-teal-800"
            >
              <option value="all">Tất cả ngôn ngữ</option>
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
              <option value="Trung">Tiếng Trung</option>
              <option value="Nhật">Tiếng Nhật</option>
              <option value="Hàn">Tiếng Hàn</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trạng thái phân tích:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:bg-white focus:border-teal-800"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="analyzed">Đã phân tích AI</option>
              <option value="raw">Chưa phân tích</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>

          {/* Date Sort */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Sắp xếp theo ngày:</label>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:bg-white focus:border-teal-800"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Files className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc các điều kiện lọc định dạng, ngôn ngữ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-teal-400/80 transition-all"
            >
              <div className="space-y-3">
                {/* Top Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 text-[10px] font-bold border border-teal-200">
                      {doc.sourceLanguage}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                      {doc.fileFormat || (doc.url ? 'URL' : 'TXT')}
                    </span>
                    {doc.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Đã xác thực
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {doc.createdAt || doc.accessDate}
                  </span>
                </div>

                {/* Title & Author */}
                <div>
                  <h3
                    onClick={() => handleOpenDetail(doc.id, 'info')}
                    className="text-sm sm:text-base font-bold text-slate-900 hover:text-teal-900 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {doc.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Tác giả / Tổ chức: <strong className="text-slate-700">{doc.authorOrOrg}</strong>
                  </div>
                </div>

                {/* Snippet / Description */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {doc.description || doc.sourceSnippet}
                </div>

                {/* Analysis State Indicator */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  {doc.status === 'analyzed' ? (
                    <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Đã phân tích AI
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      Chưa phân tích AI
                    </span>
                  )}

                  <span className="text-teal-900 font-bold">
                    {doc.linkedContentCount > 0 ? (
                      <button
                        onClick={() => onNavigateToLearningContent(doc.id)}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                        title="Mở xem nội dung học tập đã tạo"
                      >
                        <Layers className="w-3.5 h-3.5 text-teal-800" />
                        <span>{doc.linkedContentCount} nội dung học tập</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa có nội dung tạo</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenDetail(doc.id, 'info')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Xem chi tiết
                  </button>

                  <button
                    onClick={() => handleOpenDetail(doc.id, 'reader')}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-teal-800" />
                    <span>Đọc văn bản</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa thông tin tài liệu"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleReanalyze(doc.id)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    title="Phân tích tài liệu bằng AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Phân tích</span>
                  </button>

                  <button
                    onClick={() => promptDelete(doc)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa tài liệu an toàn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1.2: Detailed Document Modal with 4 Tabs */}
      {activeDetailDocId && detailData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 text-[10px] font-bold">
                    {detailData.document.sourceLanguage}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-mono">
                    {detailData.document.fileFormat || 'Văn bản'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {detailData.document.id}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {detailData.document.title}
                </h2>
              </div>

              <button
                onClick={() => setActiveDetailDocId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-white px-5 gap-4 overflow-x-auto text-xs font-bold">
              {[
                { id: 'info', label: 'Thông tin tài liệu' },
                { id: 'reader', label: `Nội dung gốc (${(detailData.originalContent || '').length} ký tự)` },
                { id: 'ai-history', label: `Lịch sử AI (${detailData.analyses.length} lần)` },
                { id: 'linked-content', label: `Nội dung đã tạo (${detailData.linkedCount})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                    detailTab === tab.id
                      ? 'border-teal-800 text-teal-950 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Info (Metadata) */}
            {detailTab === 'info' && (
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tác giả / Tổ chức</span>
                    <p className="font-semibold text-slate-800">{detailData.document.authorOrOrg}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Chủ đề phân loại</span>
                    <p className="font-semibold text-slate-800">{detailData.document.topic}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Ngày thêm / Cập nhật</span>
                    <p className="font-semibold text-slate-800">
                      Thêm ngày {detailData.document.createdAt} | Cập nhật {detailData.document.updatedAt}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Đường dẫn nguồn (URL)</span>
                    {detailData.document.url ? (
                      <a
                        href={detailData.document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-800 hover:underline font-medium flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{detailData.document.url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-slate-400 italic">Dán văn bản trực tiếp (Không có link web)</p>
                    )}
                  </div>
                </div>

                {detailData.document.description && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Mô tả tài liệu</span>
                    <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-medium">
                      {detailData.document.description}
                    </p>
                  </div>
                )}

                {Array.isArray(detailData.document.keywords) && detailData.document.keywords.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Từ khóa chính</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detailData.document.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-semibold"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Trạng thái: <strong>{detailData.document.status === 'analyzed' ? 'Đã phân tích AI' : 'Chưa phân tích'}</strong>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(detailData.document)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa thông tin này</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Original Content Reader */}
            {detailTab === 'reader' && (
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                {/* Reader Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={readerSearchTerm}
                      onChange={(e) => setReaderSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm từ khóa trong nội dung gốc..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyReaderContent}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
                    </button>
                  </div>
                </div>

                {/* Reader Content Box */}
                {detailData.originalContent ? (
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 font-serif leading-relaxed text-slate-800 text-xs sm:text-sm max-h-[50vh] overflow-y-auto whitespace-pre-line space-y-2 select-text shadow-inner">
                    {readerSearchTerm ? (
                      // Search Highlighter
                      detailData.originalContent
                        .split(new RegExp(`(${readerSearchTerm})`, 'gi'))
                        .map((part, i) =>
                          part.toLowerCase() === readerSearchTerm.toLowerCase() ? (
                            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-1 rounded-xs">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )
                    ) : (
                      detailData.originalContent
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>Chưa có nội dung văn bản gốc đầy đủ</span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Tài liệu này chỉ có đường dẫn URL hoặc phần trích đoạn ngắn. Bạn có thể dán hoặc cập nhật nội dung văn bản đầy đủ vào ô bên dưới:
                    </p>
                    <textarea
                      rows={5}
                      value={newExtractedText}
                      onChange={(e) => setNewExtractedText(e.target.value)}
                      placeholder="Dán toàn bộ nội dung văn bản trích xuất tại đây..."
                      className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                    />
                    <button
                      onClick={handleUpdateOriginalContent}
                      disabled={isUpdatingOriginalContent}
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {isUpdatingOriginalContent ? 'Đang lưu...' : 'Lưu bổ sung nội dung gốc'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: AI Analysis History */}
            {detailTab === 'ai-history' && (
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">Lịch sử các phiên AI phân tích</span>
                    <p className="text-xs text-slate-500">
                      Mỗi lần phân tích được lưu trữ độc lập, không ghi đè mất kết quả trước đó.
                    </p>
                  </div>
                  <button
                    onClick={() => handleReanalyze(detailData.document.id)}
                    disabled={isReanalyzing}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                    <span>{isReanalyzing ? 'Đang phân tích...' : 'Phân tích lại (Bản mới)'}</span>
                  </button>
                </div>

                {detailData.analyses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Tài liệu này chưa từng được phân tích AI.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {detailData.analyses.map((an, i) => (
                      <div
                        key={an.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 text-[10px] font-bold font-mono">
                              Phiên #{detailData.analyses.length - i}
                            </span>
                            <span className="font-mono text-xs text-slate-500">ID: {an.id}</span>
                            <span className="text-xs font-semibold text-slate-700">{an.analyzedAt}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Bởi: <strong>{an.analyzedBy}</strong>
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Tóm tắt tiếng Việt:</span>
                          <p className="text-slate-800 leading-relaxed font-medium">{an.vietnameseSummary}</p>
                        </div>

                        {Array.isArray(an.identifiedTopics) && (
                          <div className="flex flex-wrap gap-1.5">
                            {an.identifiedTopics.map((t, ti) => (
                              <span
                                key={ti}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-semibold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                          <span className="text-teal-900 font-bold">
                            Đã tạo: {an.generatedDraftsCount?.lessons || 0} bài học, {an.generatedDraftsCount?.scenarios || 0} tình huống, {an.generatedDraftsCount?.quizzes || 0} câu hỏi
                          </span>
                          <button
                            onClick={() => onNavigateToLearningContent(detailData.document.id)}
                            className="text-teal-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem nội dung trong kho</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Linked Learning Content */}
            {detailTab === 'linked-content' && (
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">
                      Nội dung học tập được sinh ra từ tài liệu này ({detailData.linkedCount})
                    </span>
                    <p className="text-xs text-slate-500">
                      Bao gồm toàn bộ bài học, tình huống và câu hỏi trắc nghiệm đã liên kết.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateToLearningContent(detailData.document.id);
                      setActiveDetailDocId(null);
                    }}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Mở Kho nội dung học tập</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Lessons */}
                  {detailData.linkedLessons.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-teal-400 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Bài học
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {l.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{l.title}</h4>
                      </div>
                    </div>
                  ))}

                  {/* Scenarios */}
                  {detailData.linkedScenarios.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-teal-400 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            Tình huống
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {s.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{s.title}</h4>
                      </div>
                    </div>
                  ))}

                  {/* Quizzes */}
                  {detailData.linkedQuizzes.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-teal-400 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Câu hỏi trắc nghiệm
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {q.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{q.question}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chỉnh Sửa Thông Tin Tài Liệu Tham Khảo</h3>
                <p className="text-xs text-slate-500">Cập nhật tiêu đề, định dạng, từ khóa và nội dung trích xuất.</p>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDoc} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề tài liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tác giả / Tổ chức</label>
                  <input
                    type="text"
                    value={editAuthorOrOrg}
                    onChange={(e) => setEditAuthorOrOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Định dạng tài liệu</label>
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="TXT">TXT</option>
                    <option value="URL">URL</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL nguồn (nếu có)</label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Từ khóa phân loại (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editKeywordsInput}
                  onChange={(e) => setEditKeywordsInput(e.target.value)}
                  placeholder="Ví dụ: Đàm phán, BATNA, Win-Win..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung gốc đầy đủ
                </label>
                <textarea
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmittingEdit ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Tài Liệu</h3>
                <p className="text-xs text-slate-500">Bảo vệ tính toàn vẹn của dữ liệu học tập liên kết</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
              <p>
                Bạn đang chuẩn bị xóa tài liệu: <strong className="text-slate-900">"{docToDelete.title}"</strong>
              </p>
              {docToDelete.linkedCount > 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-semibold space-y-1">
                  <p>⚠️ Cảnh báo: Tài liệu này đang liên kết với {docToDelete.linkedCount} nội dung học tập.</p>
                  <p className="text-[11px] font-normal text-amber-800">
                    Vui lòng chọn cách thức xử lý nội dung liên kết:
                  </p>
                </div>
              ) : (
                <p className="text-slate-500">Tài liệu này chưa có nội dung học tập nào liên kết.</p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {docToDelete.linkedCount > 0 ? (
                <>
                  <button
                    onClick={() => handleConfirmDelete('disassociate')}
                    disabled={isDeleting}
                    className="w-full py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Gỡ liên kết & Giữ lại toàn bộ nội dung học tập (Khuyên dùng)
                  </button>
                  <button
                    onClick={() => handleConfirmDelete('cascade')}
                    disabled={isDeleting}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Xóa cả tài liệu và toàn bộ nội dung liên kết
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConfirmDelete('keep')}
                  disabled={isDeleting}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Xác nhận xóa tài liệu
                </button>
              )}

              <button
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center">
                  <Files className="w-5 h-5 text-teal-800" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Nhập Tài Liệu Tham Khảo Mới</h2>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ dán văn bản, tải link bài viết công khai hoặc nạp file PDF/DOCX/TXT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDoc} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Input mode switcher */}
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dán văn bản</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Nhập URL công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Đọc file từ máy</span>
                </button>
              </div>

              {/* Mode-specific Input */}
              {inputMode === 'url' && (
                <div className="space-y-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <label className="block text-xs font-semibold text-blue-950">
                    Nhập địa chỉ URL bài viết
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/bai-viet-van-hoa-cong-so"
                      className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleFetchUrl}
                      disabled={isFetchingUrl}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isFetchingUrl ? 'Đang đọc...' : 'Tải nội dung'}
                    </button>
                  </div>
                  {urlFetchError && (
                    <div className="text-[11px] text-rose-600 font-semibold">{urlFetchError}</div>
                  )}
                </div>
              )}

              {inputMode === 'file' && (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-600">
                    Chọn tệp tin từ máy tính (hỗ trợ .txt, .md, .pdf, .docx)
                  </div>
                  <input
                    type="file"
                    accept=".txt,.md,.json,.pdf,.docx"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-900 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu đề tài liệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Cẩm nang Đàm phán Harvard PON"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tác giả hoặc Tổ chức phát hành
                  </label>
                  <input
                    type="text"
                    value={authorOrOrg}
                    onChange={(e) => setAuthorOrOrg(e.target.value)}
                    placeholder="Ví dụ: Harvard Law School / Bộ Nội vụ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngôn ngữ gốc
                  </label>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Tự động phát hiện">Tự động phát hiện</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="English">English</option>
                    <option value="中文 (Chinese)">中文 (Tiếng Trung)</option>
                    <option value="日本語 (Japanese)">日本語 (Tiếng Nhật)</option>
                    <option value="한국어 (Korean)">한국어 (Tiếng Hàn)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Định dạng</label>
                  <select
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="TXT">TXT</option>
                    <option value="URL">URL</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Từ khóa phân loại (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Ví dụ: Đàm phán, BATNA, Mâu thuẫn..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung tài liệu nguồn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dán toàn bộ văn bản tài liệu tại đây..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                  required
                />
                <div className="text-[11px] text-slate-400 text-right mt-1 font-mono">
                  Độ dài: {content.length} ký tự
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-800 border-slate-300"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Đánh dấu nguồn tài liệu đã được xác minh tính xác thực
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu vào kho'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
