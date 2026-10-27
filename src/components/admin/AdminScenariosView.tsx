import React, { useState } from 'react';
import { AdminScenario, ContentStatus } from '../../types';
import {
  Target,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  HelpCircle,
  Award
} from 'lucide-react';

interface AdminScenariosViewProps {
  scenarios: AdminScenario[];
  onSaveScenario: (scenario: Partial<AdminScenario>, isNew: boolean) => Promise<void>;
  onDeleteScenario: (id: string) => Promise<void>;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminScenariosView: React.FC<AdminScenariosViewProps> = ({
  scenarios,
  onSaveScenario,
  onDeleteScenario,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Partial<AdminScenario> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredScenarios = scenarios.filter((sc) => {
    const matchesSearch =
      sc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.problemStatement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingScenario({
      id: 'scenario-' + (scenarios.length + 1),
      order: scenarios.length + 1,
      title: '',
      category: 'Giao tiếp & Ứng xử công sở',
      characterRole: 'Chuyên viên xử lý tình huống',
      context: 'Mô tả bối cảnh tình huống tại nơi làm việc...',
      problemStatement: 'Vấn đề hóc búa cần giải quyết ngay?',
      difficulty: 'Trung bình',
      skillTrained: 'Kỹ năng giao tiếp và kiềm chế cảm xúc',
      status: 'draft',
      sourceReference: 'Tình huống mô phỏng thực tế',
      options: [
        {
          id: 'opt-a',
          text: 'Phương án A (cảm tính hoặc sai lầm phổ biến)',
          quality: 'poor',
          feedbackTitle: 'Phản ứng thiếu chuẩn mực',
          feedbackDescription: 'Giải thích tại sao cách làm này gây xung đột hoặc làm trầm trọng vấn đề...',
          recommendedPhrasing: 'Nên bình tĩnh và điều chỉnh câu từ...',
          scoreAwarded: 10
        },
        {
          id: 'opt-b',
          text: 'Phương án B (tối ưu, chuẩn mực, thấu cảm)',
          quality: 'best',
          feedbackTitle: 'Phương án xuất sắc',
          feedbackDescription: 'Giải thích vì sao cách tiếp cận này giải quyết thấu đáo vấn đề...',
          recommendedPhrasing: '"Mẫu câu khuyến nghị cụ thể..."',
          scoreAwarded: 40
        },
        {
          id: 'opt-c',
          text: 'Phương án C (chấp nhận được nhưng chưa triệt để)',
          quality: 'acceptable',
          feedbackTitle: 'Chấp nhận được',
          feedbackDescription: 'Đánh giá điểm tích cực và điểm còn hạn chế...',
          recommendedPhrasing: 'Cần bổ sung thêm cam kết...',
          scoreAwarded: 25
        }
      ],
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sc: AdminScenario) => {
    setIsNew(false);
    setEditingScenario(JSON.parse(JSON.stringify(sc)));
    setIsModalOpen(true);
  };

  const handleDuplicate = async (sc: AdminScenario) => {
    const duplicated: Partial<AdminScenario> = {
      ...JSON.parse(JSON.stringify(sc)),
      id: 'scenario-' + Date.now(),
      title: `${sc.title} (Bản sao)`,
      status: 'draft',
      order: scenarios.length + 1,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    try {
      await onSaveScenario(duplicated, true);
      onShowToast('Đã nhân bản tình huống!', 'Bản sao đã được lưu ở trạng thái Bản nháp.', 'success');
    } catch (err: any) {
      onShowToast('Lỗi nhân bản', err.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScenario?.title?.trim() || !editingScenario?.problemStatement?.trim()) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập tiêu đề và vấn đề cần giải quyết.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveScenario(editingScenario, isNew);
      setIsModalOpen(false);
      setEditingScenario(null);
    } catch (err: any) {
      onShowToast('Lỗi lưu tình huống', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tình huống "${title}"?`)) {
      try {
        await onDeleteScenario(id);
      } catch (err: any) {
        onShowToast('Lỗi xóa tình huống', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Lý Tình Huống Thực Hành
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: {scenarios.length} tình huống mô phỏng · {scenarios.filter((s) => s.status === 'published').length} đang hoạt động
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4.5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm tình huống mới</span>
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
            placeholder="Tìm theo tiêu đề, vấn đề..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-900"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-900"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản (Học viên thấy)</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ kiểm duyệt</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScenarios.map((sc) => (
          <div
            key={sc.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-indigo-700 uppercase">
                  Tình huống #{sc.order}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    sc.status === 'published'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {sc.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{sc.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {sc.context}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <span className="font-semibold text-slate-900 block mb-0.5">Vấn đề:</span>
                <p className="line-clamp-2 leading-relaxed text-[11px]">{sc.problemStatement}</p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                  {sc.difficulty || 'Trung bình'}
                </span>
                <span>·</span>
                <span>{sc.options?.length || 0} phương án lựa chọn</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {sc.sourceReference || 'Nội bộ'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDuplicate(sc)}
                  className="p-1.5 text-slate-500 hover:text-indigo-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Nhân bản tình huống"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(sc)}
                  className="p-1.5 text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa tình huống"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sc.id, sc.title)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa tình huống"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingScenario && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-800" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isNew ? 'Thêm tình huống thực hành mới' : `Chỉnh sửa tình huống #${editingScenario.order}`}
                  </h2>
                  <p className="text-xs text-slate-500">Mô phỏng bối cảnh và các phương án xử lý</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu đề tình huống <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingScenario.title || ''}
                    onChange={(e) => setEditingScenario({ ...editingScenario, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái xuất bản</label>
                  <select
                    value={editingScenario.status || 'draft'}
                    onChange={(e) =>
                      setEditingScenario({ ...editingScenario, status: e.target.value as ContentStatus })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Đã xuất bản (Học viên thấy)</option>
                    <option value="pending">Chờ thẩm định</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò người học (Role)</label>
                  <input
                    type="text"
                    value={editingScenario.characterRole || ''}
                    onChange={(e) => setEditingScenario({ ...editingScenario, characterRole: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ khó</label>
                  <select
                    value={editingScenario.difficulty || 'Trung bình'}
                    onChange={(e) =>
                      setEditingScenario({ ...editingScenario, difficulty: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bối cảnh tình huống (Context)</label>
                <textarea
                  rows={3}
                  value={editingScenario.context || ''}
                  onChange={(e) => setEditingScenario({ ...editingScenario, context: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vấn đề cần giải quyết (Problem Statement) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editingScenario.problemStatement || ''}
                  onChange={(e) => setEditingScenario({ ...editingScenario, problemStatement: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed font-medium"
                  required
                />
              </div>

              {/* Options Preview / Note */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block mb-1">
                  Các phương án lựa chọn ({editingScenario.options?.length || 0}):
                </span>
                <ul className="space-y-1">
                  {editingScenario.options?.map((opt, i) => (
                    <li key={opt.id || i} className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-slate-900">{String.fromCharCode(65 + i)}.</span>
                      <span className="truncate flex-1">{opt.text}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          opt.quality === 'best'
                            ? 'bg-emerald-100 text-emerald-800'
                            : opt.quality === 'acceptable'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {opt.quality === 'best' ? 'Tối ưu (+40)' : opt.quality === 'acceptable' ? 'Khá (+25)' : 'Chưa tốt'}
                      </span>
                    </li>
                  ))}
                </ul>
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
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu tình huống'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
