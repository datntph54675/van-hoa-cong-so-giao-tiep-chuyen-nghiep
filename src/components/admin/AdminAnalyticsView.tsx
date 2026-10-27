import React from 'react';
import { AdminDashboardStats, AdminLesson } from '../../types';
import { BarChart3, TrendingUp, Users, BookOpen, Target, Award, CheckCircle2 } from 'lucide-react';

interface AdminAnalyticsViewProps {
  stats: AdminDashboardStats;
  lessons: AdminLesson[];
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ stats, lessons }) => {
  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const l of lessons) {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Thống Kê Học Tập & Hiệu Quả Đào Tạo
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi mức độ tương tác, số liệu hoàn thành bài học và kết quả kiểm tra định kỳ
        </p>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tỷ lệ hoàn thành trung bình</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">76.4%</div>
          <p className="text-[11px] text-emerald-700 font-medium">Tăng 8.2% so với tháng trước</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Điểm kiểm tra trung bình</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">84 / 100</div>
          <p className="text-[11px] text-blue-700 font-medium">92% học viên đạt điểm trên 70</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng điểm XP đã tích lũy</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {stats.totalXPGranted.toLocaleString()} XP
          </div>
          <p className="text-[11px] text-purple-700 font-medium">Động lực thi đua và nâng cao cấp bậc</p>
        </div>
      </div>

      {/* Category breakdown bar charts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          Phân Bổ Chương Trình Theo Nhóm Chuyên Đề
        </h2>

        <div className="space-y-3">
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const pct = Math.round((count / lessons.length) * 100);
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="font-mono text-slate-500">
                    {count} bài ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-900 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Training Impact Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Top 3 Bài Học Có Lượng Học Viên Đông Nhất</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-semibold">1. Bản chất & Tầm quan trọng của Văn hóa Doanh nghiệp</span>
              <span className="font-mono text-blue-900 font-bold">142 lượt học</span>
            </li>
            <li className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-semibold">2. Kỹ năng Viết Email Công sở Chuẩn Mực</span>
              <span className="font-mono text-blue-900 font-bold">128 lượt học</span>
            </li>
            <li className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-semibold">3. Giải Quyết Xung Đột Theo Mô Hình SBI</span>
              <span className="font-mono text-blue-900 font-bold">115 lượt học</span>
            </li>
          </ul>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <span>Tình Huống Có Tỷ Lệ Giải Quyết Tối Ưu Cao Nhất</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-semibold">Từ chối khéo khi sếp giao thêm việc lúc quá tải</span>
              <span className="font-mono text-emerald-700 font-bold">88% chọn đúng</span>
            </li>
            <li className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-semibold">Góp ý đồng nghiệp trễ hạn dự án theo mô hình SBI</span>
              <span className="font-mono text-emerald-700 font-bold">79% chọn đúng</span>
            </li>
            <li className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-semibold">Bất đồng ý kiến gay gắt trong cuộc họp chiến lược</span>
              <span className="font-mono text-amber-700 font-bold">64% chọn đúng</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
