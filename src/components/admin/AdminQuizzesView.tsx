import React, { useState } from 'react';
import { AdminQuizQuestion, ContentStatus } from '../../types';
import {
  FileQuestion,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Save,
  HelpCircle,
  Award
} from 'lucide-react';

interface AdminQuizzesViewProps {
  quizQuestions: AdminQuizQuestion[];
  onSaveQuiz: (question: Partial<AdminQuizQuestion>, isNew: boolean) => Promise<void>;
  onDeleteQuiz: (id: string) => Promise<void>;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminQuizzesView: React.FC<AdminQuizzesViewProps> = ({
  quizQuestions,
  onSaveQuiz,
  onDeleteQuiz,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<AdminQuizQuestion> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredQuestions = quizQuestions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingQuestion({
      id: 'q-' + Date.now(),
      topicId: 'topic-culture',
      question: '',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswerIndex: 0,
      explanation: 'Giải thích vì sao phương án này là chuẩn mực nhất...',
      difficulty: 'Trung bình',
      scoreAwarded: 20,
      status: 'draft',
      sourceReference: 'Ngân hàng đề thi đánh giá',
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: AdminQuizQuestion) => {
    setIsNew(false);
    setEditingQuestion(JSON.parse(JSON.stringify(q)));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.question?.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập nội dung câu hỏi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveQuiz(editingQuestion, isNew);
      setIsModalOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      onShowToast('Lỗi lưu câu hỏi', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, text: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa câu hỏi này?`)) {
      try {
        await onDeleteQuiz(id);
      } catch (err: any) {
        onShowToast('Lỗi xóa câu hỏi', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Lý Ngân Hàng Câu Hỏi Trắc Nghiệm
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: {quizQuestions.length} câu hỏi · {quizQuestions.filter((q) => q.status === 'published').length} đang áp dụng thi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm câu hỏi hoặc giải thích..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản (Học viên thi)</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ kiểm duyệt</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3 hover:border-blue-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                    Câu hỏi #{idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      q.status === 'published'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {q.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    +{q.scoreAwarded || 20} điểm
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 pt-1 leading-snug">{q.question}</h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa câu hỏi"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(q.id, q.question)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {q.options?.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    optIdx === q.correctAnswerIndex
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                  {optIdx === q.correctAnswerIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {q.explanation && (
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Giải thích chi tiết: </strong>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isNew ? 'Thêm câu hỏi trắc nghiệm mới' : 'Chỉnh sửa câu hỏi'}
                  </h2>
                  <p className="text-xs text-slate-500">Thiết lập câu hỏi, đáp án và điểm thưởng</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung câu hỏi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editingQuestion.question || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  placeholder="Ví dụ: Khi đồng nghiệp tranh luận gay gắt trong cuộc họp, giải pháp tối ưu là..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editingQuestion.status || 'draft'}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, status: e.target.value as ContentStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Đã xuất bản (Học viên thi)</option>
                    <option value="pending">Chờ thẩm định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm số (XP)</label>
                  <input
                    type="number"
                    value={editingQuestion.scoreAwarded || 20}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, scoreAwarded: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    min={5}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án đúng</label>
                  <select
                    value={editingQuestion.correctAnswerIndex ?? 0}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, correctAnswerIndex: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold rounded-xl text-xs"
                  >
                    {editingQuestion.options?.map((_, i) => (
                      <option key={i} value={i}>
                        Phương án {String.fromCharCode(65 + i)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Các phương án lựa chọn:</label>
                {editingQuestion.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(editingQuestion.options || [])];
                        newOpts[i] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giải thích cặn kẽ đáp án đúng
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu câu hỏi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
