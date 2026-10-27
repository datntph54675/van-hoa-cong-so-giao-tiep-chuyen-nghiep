import React, { useState } from 'react';
import { AdminLesson, ContentStatus } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  X,
  Save,
  Archive,
  AlertTriangle,
  FileText,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface AdminLessonsViewProps {
  lessons: AdminLesson[];
  onSaveLesson: (lesson: Partial<AdminLesson>, isNew: boolean) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminLessonsView: React.FC<AdminLessonsViewProps> = ({
  lessons,
  onSaveLesson,
  onDeleteLesson,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<AdminLesson> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories
  const categories = Array.from(new Set(lessons.map((l) => l.category)));

  // Filtered List
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || lesson.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingLesson({
      id: 'lesson-' + (lessons.length + 1),
      order: lessons.length + 1,
      title: '',
      category: categories[0] || 'Tác phong & Kỷ luật',
      summary: '',
      estimatedMinutes: 15,
      objectives: ['Hiểu rõ khái niệm và tầm quan trọng', 'Ứng dụng vào thực tế môi trường làm việc'],
      sections: [
        {
          title: '1. Nội dung trọng tâm',
          content: 'Trình bày chi tiết nguyên tắc và phương pháp thực hiện...',
          bulletPoints: ['Điểm lưu ý số 1', 'Điểm lưu ý số 2'],
          example: {
            situation: 'Bối cảnh phát sinh trong phòng ban',
            goodApproach: 'Cách xử lý văn minh, chuẩn mực',
            badApproach: 'Cách làm cảm tính, thiếu chuyên nghiệp'
          }
        }
      ],
      dos: ['Chủ động chuẩn bị trước cuộc hẹn', 'Giao tiếp rõ ràng, có căn cứ'],
      donts: ['Đổ lỗi cho hoàn cảnh hoặc người khác', 'Để cảm xúc cá nhân chi phối'],
      keyTakeaway: 'Tác phong chuyên nghiệp bắt đầu từ sự tôn trọng và cam kết đúng hẹn.',
      reviewQuestion: {
        question: 'Quy tắc nào sau đây là quan trọng nhất khi báo cáo cho cấp trên?',
        options: [
          'Trình bày kết luận và phương án khả thi trước (BLUF)',
          'Chỉ kể lại khó khăn và xin chỉ thị',
          'Chờ đến hạn chót mới thông báo',
          'Bỏ qua các bước xác nhận bằng văn bản'
        ],
        correctIndex: 0,
        explanation: 'Mô hình BLUF (Bottom Line Up Front) giúp tiết kiệm thời gian và thể hiện tư duy hướng đến giải pháp.'
      },
      status: 'draft',
      sourceReference: 'Chuẩn mực Văn hóa Công sở & Đạo đức Công vụ 2026',
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lesson: AdminLesson) => {
    setIsNew(false);
    setEditingLesson(JSON.parse(JSON.stringify(lesson)));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson?.title?.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập tiêu đề bài học.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveLesson(editingLesson, isNew);
      setIsModalOpen(false);
      setEditingLesson(null);
    } catch (err: any) {
      onShowToast('Lỗi lưu bài học', err.message || 'Không thể lưu bài học.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài học "${title}"?`)) {
      try {
        await onDeleteLesson(id);
      } catch (err: any) {
        onShowToast('Lỗi xóa bài học', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Lý Chương Trình & Bài Học
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: {lessons.length} bài học · {lessons.filter((l) => l.status === 'published').length} đang xuất bản
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm bài học mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, từ khóa..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản (Công khai)</option>
            <option value="draft">Bản nháp (Nội bộ)</option>
            <option value="pending">Chờ kiểm duyệt</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
          >
            <option value="all">Tất cả chuyên đề ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Tiêu đề bài học</th>
                <th className="py-3 px-4">Chuyên đề</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Nguồn tham chiếu</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLessons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy bài học nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                      {lesson.order}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                      <div className="truncate">{lesson.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                        {lesson.summary}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{lesson.category}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {lesson.estimatedMinutes} phút
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          lesson.status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : lesson.status === 'draft'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : lesson.status === 'pending'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {lesson.status === 'published'
                          ? 'Đã xuất bản'
                          : lesson.status === 'draft'
                          ? 'Bản nháp'
                          : lesson.status === 'pending'
                          ? 'Chờ duyệt'
                          : 'Đã lưu trữ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-[160px] truncate">
                      {lesson.sourceReference || 'Nội bộ'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(lesson)}
                        className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa bài học"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id, lesson.title)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa bài học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isNew ? 'Thêm bài học đào tạo mới' : `Chỉnh sửa bài học #${editingLesson.order}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cập nhật chuẩn mực nội dung và trạng thái hiển thị cho học viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu đề bài học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingLesson.title || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    placeholder="Ví dụ: Kỹ năng lắng nghe tích cực và thấu cảm"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:bg-white focus:border-blue-900 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái xuất bản</label>
                  <select
                    value={editingLesson.status || 'draft'}
                    onChange={(e) =>
                      setEditingLesson({ ...editingLesson, status: e.target.value as ContentStatus })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:bg-white focus:border-blue-900 font-semibold text-blue-950"
                  >
                    <option value="draft">Bản nháp (Nội bộ)</option>
                    <option value="published">Đã xuất bản (Học viên thấy)</option>
                    <option value="pending">Chờ thẩm định</option>
                    <option value="archived">Đã lưu trữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyên đề</label>
                  <input
                    type="text"
                    value={editingLesson.category || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thứ tự hiển thị (Order)</label>
                  <input
                    type="number"
                    value={editingLesson.order || 1}
                    onChange={(e) => setEditingLesson({ ...editingLesson, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời lượng ước tính (Phút)</label>
                  <input
                    type="number"
                    value={editingLesson.estimatedMinutes || 15}
                    onChange={(e) =>
                      setEditingLesson({ ...editingLesson, estimatedMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    min={5}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả tóm tắt (Summary)
                </label>
                <textarea
                  rows={2}
                  value={editingLesson.summary || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, summary: e.target.value })}
                  placeholder="Mô tả súc tích lợi ích và thông điệp của bài học..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
                />
              </div>

              {/* Source Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nguồn tài liệu tham khảo căn cứ
                </label>
                <input
                  type="text"
                  value={editingLesson.sourceReference || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, sourceReference: e.target.value })}
                  placeholder="Ví dụ: Cẩm nang Đạo đức Công vụ Quốc gia 2026 / Harvard PON"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Key Takeaway */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thông điệp cốt lõi (Key Takeaway)
                </label>
                <input
                  type="text"
                  value={editingLesson.keyTakeaway || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, keyTakeaway: e.target.value })}
                  placeholder="Ghi nhớ quan trọng nhất..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Actions in Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu bài học vào hệ thống'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
