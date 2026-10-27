import React from 'react';
import { AdminDashboardStats, AuditLog } from '../../types';
import {
  BookOpen,
  Target,
  FileQuestion,
  Files,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface AdminOverviewViewProps {
  stats: AdminDashboardStats;
  auditLogs: AuditLog[];
  onNavigateTab: (tab: any) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  stats,
  auditLogs,
  onNavigateTab
}) => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Trung tâm Điều hành & Quản trị Nội dung</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bảng Điều Khiển Hệ Thống Đào Tạo
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Quản lý toàn bộ 10 chuyên đề bài học, 8 tình huống thực tế, kho tài liệu tham khảo và
            khu vực AI Content Studio phân tích đa ngôn ngữ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => onNavigateTab('ai-studio')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mở AI Content Studio</span>
          </button>
          <button
            onClick={() => onNavigateTab('documents')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            Nhập tài liệu mới
          </button>
        </div>
      </div>

      {/* Pending Moderation Alert */}
      {stats.pendingAiProposals > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950">
                Có {stats.pendingAiProposals} nội dung do AI đề xuất đang chờ kiểm duyệt
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Theo quy chuẩn an toàn, mọi nội dung bài học, tình huống do AI tạo ra đều ở trạng thái
                bản nháp cho đến khi Quản trị viên duyệt.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ai-studio')}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            Vào hàng đợi duyệt ngay
          </button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bài học đào tạo</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalLessons}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="text-emerald-700 font-semibold">{stats.publishedLessons} đã xuất bản</span>
              <span>·</span>
              <span>{stats.draftLessons} bản nháp</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tình huống thực tế</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-900 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-700" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalScenarios}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="text-emerald-700 font-semibold">{stats.publishedScenarios} đã mở cho học viên</span>
              <span>·</span>
              <span>Đầy đủ phản hồi</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kho tài liệu tham khảo</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-900 flex items-center justify-center">
              <Files className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalDocuments}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="text-teal-700 font-semibold">{stats.analyzedDocuments} đã phân tích AI</span>
              <span>·</span>
              <span>Đa ngôn ngữ</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Học viên hoạt động</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-900 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-700" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalUsers}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="text-purple-700 font-semibold">
                {stats.activeLearnersLast7Days} tích cực tuần này
              </span>
              <span>·</span>
              <span>{stats.totalQuestions} câu hỏi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions & Workflow Guide */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Thao tác Quản trị Nhanh</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                onClick={() => onNavigateTab('ai-studio')}
                className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all text-left space-y-1.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Phân tích tài liệu đa ngôn ngữ</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nhập văn bản tiếng Anh, Trung, Nhật, Hàn hoặc dán link bài viết để AI phân tích và
                  đề xuất bài học.
                </p>
              </button>

              <button
                onClick={() => onNavigateTab('lessons')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all text-left space-y-1.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <BookOpen className="w-4 h-4 text-slate-600" />
                    <span>Quản lý danh sách bài học</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Thêm mới, sửa nội dung, phân loại chủ đề, bật/tắt trạng thái xuất bản cho học viên.
                </p>
              </button>

              <button
                onClick={() => onNavigateTab('scenarios')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all text-left space-y-1.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span>Quản lý tình huống thực hành</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Điều chỉnh kịch bản xử lý, phân bổ điểm số, giải thích tâm lý và mẫu câu khuyến
                  nghị.
                </p>
              </button>

              <button
                onClick={() => onNavigateTab('documents')}
                className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-slate-50 transition-all text-left space-y-1.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Files className="w-4 h-4 text-teal-600" />
                    <span>Kho tài liệu & Nguồn gốc</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lưu trữ các nguồn tài liệu uy tín, quản lý liên kết bài học và kiểm tra trùng lặp.
                </p>
              </button>
            </div>
          </div>

          {/* 7-Step Content Lifecycle Diagram */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Quy Trình Kiểm Duyệt Nội Dung AI Khép Kín
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 text-center font-medium">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-blue-700 font-bold">BƯỚC 1</div>
                  <div className="text-slate-900 font-semibold mt-1">Nhập tài liệu</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-blue-700 font-bold">BƯỚC 2</div>
                  <div className="text-slate-900 font-semibold mt-1">Phân tích AI</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-blue-700 font-bold">BƯỚC 3</div>
                  <div className="text-slate-900 font-semibold mt-1">Đề xuất ý tưởng</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-blue-700 font-bold">BƯỚC 4</div>
                  <div className="text-slate-900 font-semibold mt-1">Tạo bản nháp</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-blue-700 font-bold">BƯỚC 5</div>
                  <div className="text-slate-900 font-semibold mt-1">Admin chỉnh sửa</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-blue-700 font-bold">BƯỚC 6</div>
                  <div className="text-slate-900 font-semibold mt-1">Phê duyệt</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] text-emerald-700 font-bold">BƯỚC 7</div>
                  <div className="text-emerald-900 font-semibold mt-1">Xuất bản</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Audit Activities */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Nhật Ký Quản Trị</h2>
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs text-blue-900 font-semibold hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3.5">
            {auditLogs.slice(0, 7).map((log) => (
              <div key={log.id} className="text-xs pb-3 border-b border-slate-100 last:border-b-0 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold text-slate-800">{log.adminName}</span>
                  <span className="text-[10px] font-mono">
                    {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="text-slate-700 font-medium">
                  {log.action}: <span className="text-slate-900 font-semibold">{log.targetTitle}</span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-slate-500 leading-normal">{log.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
