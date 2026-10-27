import React, { useState } from 'react';
import { UserAccount, OrganizationType, LearningGoal } from '../../types';
import { StorageService } from '../../services/storage';
import {
  User,
  Building,
  Briefcase,
  Calendar,
  Phone,
  MapPin,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  BookOpen,
  Target
} from 'lucide-react';

interface ProfileViewProps {
  user: UserAccount;
  points: number;
  unlockedBadgeCount: number;
  completedLessonsCount: number;
  quizzesTakenCount: number;
  onUpdateProfile: (updated: UserAccount) => void;
  onLogout: () => void;
  onResetData: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  points,
  unlockedBadgeCount,
  completedLessonsCount,
  quizzesTakenCount,
  onUpdateProfile,
  onLogout,
  onResetData,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'work' | 'security' | 'stats'>('personal');

  // Personal Info Form
  const [name, setName] = useState(user.name);
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [gender, setGender] = useState(user.gender || 'Không muốn cung cấp');

  // Work Info Form
  const [role, setRole] = useState(user.role);
  const [customRole, setCustomRole] = useState(user.customRole || '');
  const [organizationType, setOrganizationType] = useState<OrganizationType>(
    user.organizationType || 'Doanh nghiệp tư nhân'
  );
  const [organizationName, setOrganizationName] = useState(user.organizationName || '');
  const [department, setDepartment] = useState(user.department || '');
  const [subUnit, setSubUnit] = useState(user.subUnit || '');
  const [workplaceAddress, setWorkplaceAddress] = useState(user.workplaceAddress || '');
  const [city, setCity] = useState(user.city || 'Hà Nội');
  const [experienceYears, setExperienceYears] = useState(user.experienceYears || '1 - 3 năm');
  const [learningGoal, setLearningGoal] = useState<LearningGoal>(
    user.learningGoal || 'Nâng cao kỹ năng giao tiếp'
  );

  // Security Form (Change Password)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Reset modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const organizationTypes: OrganizationType[] = [
    'Cơ quan nhà nước',
    'Đơn vị sự nghiệp công lập',
    'Doanh nghiệp nhà nước',
    'Doanh nghiệp tư nhân',
    'Tổ chức xã hội',
    'Sinh viên/thực tập sinh',
    'Khác'
  ];

  const learningGoals: LearningGoal[] = [
    'Nâng cao kỹ năng giao tiếp',
    'Cải thiện văn hoá ứng xử',
    'Nâng cao kỹ năng quản lý',
    'Chuẩn bị đi làm hoặc thực tập',
    'Đào tạo nhân viên',
    'Khác'
  ];

  const standardRoles = [
    'Chuyên viên',
    'Nhân viên',
    'Trưởng nhóm / Team Leader',
    'Phó Trưởng phòng',
    'Trưởng phòng / Quản lý',
    'Giám đốc / Lãnh đạo',
    'Sinh viên / Thực tập sinh',
    'Khác'
  ];

  const majorCities = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Bình Dương',
    'Đồng Nai',
    'Quảng Ninh',
    'Khác'
  ];

  // Save personal or work updates
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Lỗi nhập liệu', 'Vui lòng nhập họ và tên của bạn.', 'error');
      return;
    }

    const finalRole = role === 'Khác' && customRole.trim() ? customRole.trim() : role;

    const updated = StorageService.updateProfile(user.id, {
      name: name.trim(),
      birthDate: birthDate || undefined,
      phone: phone.trim() || undefined,
      gender: gender as any,
      role: finalRole,
      customRole: role === 'Khác' ? customRole.trim() : undefined,
      organizationType,
      organizationName: organizationName.trim() || undefined,
      department: department.trim() || 'Văn phòng chung',
      subUnit: subUnit.trim() || undefined,
      workplaceAddress: workplaceAddress.trim() || undefined,
      city,
      experienceYears,
      learningGoal
    });

    onUpdateProfile(updated);
    onShowToast('Lưu thành công!', 'Hồ sơ cá nhân và công tác đã được cập nhật.', 'success');
  };

  // Change password submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    if (!currentPassword) {
      setSecurityError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSecurityError('Mật khẩu mới xác nhận không khớp.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await StorageService.changePassword(user.id, currentPassword, newPassword);
      if (res.success) {
        onShowToast(
          'Đổi mật khẩu thành công!',
          'Mật khẩu mới của bạn đã được cập nhật và mã hóa an toàn.',
          'success'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setSecurityError(res.error || 'Đổi mật khẩu không thành công.');
      }
    } catch {
      setSecurityError('Đã có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleConfirmReset = () => {
    StorageService.resetCurrentUserData(user.id);
    setShowResetConfirm(false);
    onResetData();
    onShowToast('Đã đặt lại tiến độ!', 'Dữ liệu học tập của tài khoản này đã được đưa về ban đầu.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-3xl font-extrabold uppercase shrink-0 shadow-sm">
            {user.name.charAt(0)}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {user.name}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200/60 inline-block self-center sm:self-auto">
                {user.role}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {user.department} {user.organizationName ? `· ${user.organizationName}` : ''}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-700">
              <span className="font-mono tabular-nums font-bold text-blue-900">{points} XP</span>
              <span aria-hidden="true">·</span>
              <span>{unlockedBadgeCount} huy hiệu</span>
              <span aria-hidden="true">·</span>
              <span>{completedLessonsCount}/10 bài học</span>
              <span aria-hidden="true">·</span>
              <span>Gia nhập: {user.joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Logout CTA */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'personal'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Thông tin cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('work')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'work'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Thông tin công tác</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Bảo mật tài khoản</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'stats'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Kết quả học tập</span>
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CÁ NHÂN */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Thông tin cá nhân</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Thông tin nhận diện tài khoản học viên trong cơ sở dữ liệu.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên hiển thị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ Email tài khoản
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-700 mt-1 block">
                Email dùng để đăng nhập và không thể tự ý thay đổi.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                >
                  <option value="Không muốn cung cấp">Không muốn cung cấp</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi cá nhân</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: THÔNG TIN CÔNG TÁC */}
      {activeTab === 'work' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Thông tin cơ quan & Công việc</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Cập nhật tổ chức, chức danh và mục tiêu học tập để tùy biến lộ trình chuẩn mực văn hóa.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ hiện tại
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                >
                  {standardRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loại hình công tác
                </label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                >
                  {organizationTypes.map((ot) => (
                    <option key={ot} value={ot}>
                      {ot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role === 'Khác' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập chức danh cụ thể
                </label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Chức danh..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên cơ quan / Doanh nghiệp
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ví dụ: Tập đoàn Bưu chính Viễn thông..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng ban / Bộ phận
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ví dụ: Khối Vận hành & Dự án..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ nơi làm việc
                </label>
                <input
                  type="text"
                  value={workplaceAddress}
                  onChange={(e) => setWorkplaceAddress(e.target.value)}
                  placeholder="Số nhà, tên phố, quận..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  {majorCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thâm niên công tác
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Dưới 1 năm">Dưới 1 năm (Mới đi làm / thực tập)</option>
                  <option value="1 - 3 năm">1 - 3 năm</option>
                  <option value="3 - 5 năm">3 - 5 năm</option>
                  <option value="5 - 10 năm">5 - 10 năm</option>
                  <option value="Trên 10 năm">Trên 10 năm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu học tập ưu tiên
                </label>
                <select
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value as LearningGoal)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  {learningGoals.map((lg) => (
                    <option key={lg} value={lg}>
                      {lg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thông tin công tác</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: BẢO MẬT TÀI KHOẢN */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Bảo mật & Đổi mật khẩu</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Mật khẩu được mã hóa băm một chiều (Salted SHA-256) trên thiết bị, không lưu trữ văn bản thuần.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-900">Thông tin tài khoản:</div>
            <div className="text-slate-600">Email: <span className="font-mono text-slate-900">{user.email}</span></div>
            <div className="text-slate-600">Ngày khởi tạo tài khoản: <span className="font-mono text-slate-900">{user.createdAt}</span></div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {securityError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {securityError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu hiện tại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhập lại mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50"
            >
              {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
            </button>
          </form>

          {/* Danger Zone: Reset demo data for this account */}
          <div className="pt-6 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Khôi phục tiến độ học tập của tài khoản
            </h3>
            <p className="text-xs text-slate-600">
              Xóa lịch sử hoàn thành bài học, tình huống và kết quả thi chỉ riêng cho tài khoản {user.name}.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors mt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại tiến độ tài khoản này</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: KẾT QUẢ & TIẾN ĐỘ HỌC TẬP */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Tiến độ & Thành tích cá nhân</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Dữ liệu học tập thực tế thuộc riêng tài khoản <strong className="text-slate-900">{user.email}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-xs text-slate-500 font-medium">Điểm tích lũy</div>
              <div className="text-2xl font-bold text-blue-900 font-mono tabular-nums mt-1">
                {points} XP
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-xs text-slate-500 font-medium">Bài học xong</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {completedLessonsCount}/10
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-xs text-slate-500 font-medium">Huy hiệu mở khóa</div>
              <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                {unlockedBadgeCount}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-xs text-slate-500 font-medium">Lượt kiểm tra</div>
              <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                {quizzesTakenCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Xác nhận đặt lại tiến độ?
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Thao tác này sẽ xóa điểm số và bài thi của tài khoản <strong>{user.name}</strong> mà không ảnh hưởng đến người dùng khác.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                Đồng ý đặt lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Đăng xuất tài khoản
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{user.name}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                Xác nhận đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
