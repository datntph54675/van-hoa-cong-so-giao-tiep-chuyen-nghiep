import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[88vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              {activeTab === 'terms' ? (
                <FileText className="w-5 h-5 text-blue-800" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-800" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeTab === 'terms'
                  ? 'Điều khoản sử dụng nền tảng'
                  : 'Chính sách quyền riêng tư & Bảo mật'}
              </h2>
              <p className="text-xs text-slate-500">
                Văn hoá công sở & Giao tiếp chuyên nghiệp · Cập nhật 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Điều khoản sử dụng</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Chính sách quyền riêng tư</span>
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  1. Mục đích và Phạm vi Áp dụng
                </h3>
                <p>
                  Nền tảng <strong>“Văn hoá công sở và Giao tiếp chuyên nghiệp”</strong> (do tác giả{' '}
                  <strong>Nguyễn Tuấn Đạt</strong> phát triển) được thiết kế nhằm cung cấp kiến
                  thức, rèn luyện kỹ năng ứng xử, chuẩn mực đạo đức công vụ và giao tiếp cho cán
                  bộ, công chức, viên chức, nhân viên doanh nghiệp và sinh viên. Khi sử dụng nền
                  tảng, người dùng cam kết tuân thủ đầy đủ các điều khoản dưới đây.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  2. Trách nhiệm của Học viên
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Cung cấp thông tin tài khoản trung thực và bảo mật mật khẩu cá nhân.</li>
                  <li>
                    Không sử dụng ứng dụng vào mục đích phát tán thông tin sai lệch, xâm phạm danh
                    dự hoặc chia sẻ bí mật nội bộ cơ quan, doanh nghiệp.
                  </li>
                  <li>
                    Tích cực, trung thực khi làm bài kiểm tra và xử lý tình huống thực tế để nhận kết
                    quả đánh giá năng lực chính xác nhất.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  3. Quyền sở hữu trí tuệ
                </h3>
                <p>
                  Toàn bộ tài liệu, cấu trúc bài học, câu hỏi trắc nghiệm, kịch bản tình huống và mã
                  nguồn thuộc bản quyền © 2026 của tác giả <strong>Nguyễn Tuấn Đạt</strong>. Người
                  dùng chỉ được phép sử dụng cho mục đích tự học hoặc đào tạo nội bộ hợp pháp, không
                  sao chép thương mại khi chưa có sự đồng ý bằng văn bản.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  4. Thay đổi và Điều chỉnh
                </h3>
                <p>
                  Ban quản trị có quyền cập nhật các bài học, bài tập tình huống hoặc tính năng hệ
                  thống nhằm nâng cao chất lượng đào tạo mà không cần thông báo trước từng cá nhân.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Cam kết Bảo vệ Dữ liệu Cá nhân
                </h3>
                <p>
                  Chúng tôi tôn trọng tuyệt đối quyền riêng tư của mọi học viên. Dữ liệu cá nhân bao
                  gồm họ tên, địa chỉ email, cơ quan công tác, vị trí việc làm và tiến độ học tập
                  được quản lý nghiêm ngặt theo các tiêu chuẩn bảo mật hiện đại.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. Cơ chế Mã hóa & Bảo vệ Mật khẩu
                </h3>
                <p>
                  Hệ thống áp dụng thuật toán mã hóa mật khẩu một chiều có muối (Salted SHA-256) thông
                  qua Web Crypto API chuẩn quốc tế. Mật khẩu thuần (plain-text) không bao giờ được
                  lưu trữ hoặc truyền tải ra ngoài thiết bị của bạn.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  3. Thu thập và Mục đích Sử dụng Dữ liệu
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Thông tin tài khoản:</strong> Dùng để xác thực đăng nhập và hiển thị tên
                    trên chứng chỉ hoàn thành khóa học.
                  </li>
                  <li>
                    <strong>Tiến độ học tập:</strong> Lưu trữ số bài đã học, điểm số trắc nghiệm, huy
                    hiệu và điểm kinh nghiệm (XP) nhằm hiển thị biểu đồ thống kê cá nhân.
                  </li>
                  <li>
                    <strong>Tương tác Trợ lý AI:</strong> Câu hỏi gửi đến Trợ lý AI được xử lý an toàn
                    để đưa ra lời khuyên ứng xử phù hợp, không sử dụng cho quảng cáo thương mại.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  4. Quyền của Người dùng
                </h3>
                <p>
                  Bạn có toàn quyền xem, chỉnh sửa thông tin hồ sơ cá nhân hoặc yêu cầu làm mới toàn
                  bộ lịch sử học tập tại mục <em>Hồ sơ người dùng</em> bất cứ lúc nào.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Tác giả: Nguyễn Tuấn Đạt · © 2026
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Đã hiểu và Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
