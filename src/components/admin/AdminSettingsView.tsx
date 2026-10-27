import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { AdminApiService } from '../../services/adminApi';
import {
  Settings,
  ShieldCheck,
  Download,
  Sparkles,
  Server,
  Lock,
  Save,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';

interface AdminSettingsViewProps {
  auditLogs: AuditLog[];
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ auditLogs, onShowToast }) => {
  const [appName, setAppName] = useState('Văn hoá công sở & Giao tiếp chuyên nghiệp');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireVerification, setRequireVerification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await AdminApiService.updateSettings({
        appName,
        allowRegistration,
        requireDocumentVerification: requireVerification
      });
      onShowToast('Đã lưu cấu hình!', 'Cài đặt hệ thống đã được đồng bộ hóa thành công.', 'success');
    } catch (err: any) {
      onShowToast('Lỗi lưu cài đặt', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              appName,
              logsCount: auditLogs.length
            },
            null,
            2
          )
        );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `vccs_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('Đã xuất bản sao lưu!', 'Tệp JSON đã được tải xuống thiết bị.', 'success');
    } catch (err: any) {
      onShowToast('Lỗi xuất sao lưu', err.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Cài Đặt Hệ Thống & Nhật Ký Kiểm Tra
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cấu hình kết nối AI, chính sách tài khoản và theo dõi lịch sử thao tác của Quản trị viên
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-800" />
            <span>Cấu Hình Nền Tảng</span>
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên nền tảng đào tạo
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-800">
                  Cho phép người học tự đăng ký tài khoản mới qua Landing Page
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireVerification}
                  onChange={(e) => setRequireVerification(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-800">
                  Yêu cầu xác thực tài liệu tham khảo trước khi cho phép AI phân tích
                </span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi cài đặt'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI & Security Info */}
        <div className="space-y-6">
          {/* AI Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-700" />
              <span>Trạng Thái Mô Hình AI Máy Chủ</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600">Mô hình AI:</span>
                <span className="font-mono font-bold text-blue-950">gemini-3.8-flash</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600">Vị trí xử lý API:</span>
                <span className="font-semibold text-slate-800">Server-Side Proxy (Bảo mật tuyệt đối)</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-emerald-950">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  API Key không bao giờ lộ ra trình duyệt frontend
                </span>
                <span className="font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  AN TOÀN
                </span>
              </div>
            </div>
          </div>

          {/* Backup card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-slate-700" />
              <span>Sao Lưu & Đồng Bộ Dữ Liệu</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tải xuống bản sao lưu toàn bộ bài học, tình huống và kho tài liệu định dạng JSON để lưu trữ ngoại tuyến.
            </p>
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống bản sao lưu (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <span>Toàn Bộ Nhật Ký Hoạt Động Quản Trị ({auditLogs.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Quản trị viên</th>
                <th className="py-2.5 px-3">Hành động</th>
                <th className="py-2.5 px-3">Đối tượng</th>
                <th className="py-2.5 px-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{log.adminName}</td>
                  <td className="py-2.5 px-3 text-blue-900 font-medium">{log.action}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{log.targetTitle}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
