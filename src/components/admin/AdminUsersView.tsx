import React, { useState } from 'react';
import { Users, Search, ShieldCheck, ShieldAlert, Award, Calendar, Building, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AdminApiService } from '../../services/adminApi';

interface AdminUsersViewProps {
  users: any[];
  onRefresh: () => Promise<void>;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ users, onRefresh, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleAdminRole = async (user: any) => {
    const newStatus = !user.isAdmin;
    const actionName = newStatus ? 'cấp quyền Quản trị viên' : 'hạ xuống quyền Người học';

    if (confirm(`Bạn có chắc chắn muốn ${actionName} cho tài khoản "${user.name}"?`)) {
      setIsUpdating(user.id);
      try {
        await AdminApiService.updateUserRole(
          user.id,
          newStatus,
          newStatus ? 'Quản trị viên Hệ thống' : 'Chuyên viên'
        );
        onShowToast('Cập nhật quyền thành công!', `Tài khoản ${user.name} đã được cập nhật.`, 'success');
        await onRefresh();
      } catch (err: any) {
        onShowToast('Lỗi cập nhật quyền', err.message, 'error');
      } finally {
        setIsUpdating(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Lý Tài Khoản & Phân Quyền
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: {users.length} tài khoản · {users.filter((u) => u.isAdmin).length} Quản trị viên
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học viên, email hoặc phòng ban..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-900"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Cơ quan / Tổ chức</th>
                <th className="py-3 px-4">Chức vụ & Đơn vị</th>
                <th className="py-3 px-4">Ngày đăng ký</th>
                <th className="py-3 px-4 text-center">Phân quyền</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{u.organizationName || 'Chưa cung cấp'}</div>
                      <div className="text-[11px] text-slate-500">{u.organizationType || 'Doanh nghiệp'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{u.role}</div>
                      <div className="text-[11px] text-slate-500">{u.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {u.createdAt || '2026-10-01'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          <ShieldCheck className="w-3 h-3 text-blue-700" /> Quản trị viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Người học
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleAdminRole(u)}
                        disabled={isUpdating === u.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          u.isAdmin
                            ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                            : 'text-blue-900 hover:bg-blue-50 border border-blue-200'
                        }`}
                      >
                        {u.isAdmin ? 'Hạ quyền người học' : 'Nâng làm Admin'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
