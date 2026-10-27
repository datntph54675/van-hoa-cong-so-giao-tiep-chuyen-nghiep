import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { UserAccount, OrganizationType, LearningGoal } from '../../types';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface RegisterViewProps {
  onRegisterSuccess: (user: UserAccount) => void;
  onNavigateLogin: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
  onOpenPolicyModal?: (tab: 'terms' | 'privacy') => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onShowToast,
  onOpenPolicyModal
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Personal & Professional details
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác' | 'Không muốn cung cấp'>('Không muốn cung cấp');
  const [role, setRole] = useState('Chuyên viên');
  const [customRole, setCustomRole] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('Doanh nghiệp tư nhân');
  const [organizationName, setOrganizationName] = useState('');
  const [department, setDepartment] = useState('Khối Vận hành');
  const [subUnit, setSubUnit] = useState('');
  const [workplaceAddress, setWorkplaceAddress] = useState('');
  const [city, setCity] = useState('Hà Nội');
  const [experienceYears, setExperienceYears] = useState('1 - 3 năm');
  const [learningGoal, setLearningGoal] = useState<LearningGoal>('Nâng cao kỹ năng giao tiếp');

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên của bạn.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Định dạng email không hợp lệ (ví dụ: name@company.vn).';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    if (!agreedTerms) {
      errors.agreedTerms = 'Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    if (validateStep1()) {
      // Check if email already exists
      const users = StorageService.getUsers();
      const duplicate = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (duplicate) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'
        }));
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = async (skipOptional = false) => {
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      const finalRole = role === 'Khác' && customRole.trim() ? customRole.trim() : role;

      const accountPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        birthDate: skipOptional ? undefined : birthDate || undefined,
        phone: skipOptional ? undefined : phone.trim() || undefined,
        gender: skipOptional ? 'Không muốn cung cấp' : gender,
        role: finalRole,
        organizationType: skipOptional ? 'Doanh nghiệp tư nhân' : organizationType,
        organizationName: skipOptional ? undefined : organizationName.trim() || undefined,
        department: skipOptional ? 'Văn phòng chung' : department.trim() || 'Văn phòng chung',
        subUnit: skipOptional ? undefined : subUnit.trim() || undefined,
        workplaceAddress: skipOptional ? undefined : workplaceAddress.trim() || undefined,
        city: skipOptional ? 'Hà Nội' : city,
        experienceYears: skipOptional ? undefined : experienceYears,
        learningGoal: skipOptional ? 'Nâng cao kỹ năng giao tiếp' : learningGoal,
        avatarSeed: name.trim().toLowerCase().replace(/\s+/g, '_')
      };

      const result = await StorageService.register(accountPayload, password);
      if (result.success && result.user) {
        onShowToast(
          'Đăng ký tài khoản thành công!',
          `Chào mừng ${result.user.name} đến với chương trình đào tạo văn hóa công sở!`,
          'success'
        );
        onRegisterSuccess(result.user);
      } else {
        setGlobalError(result.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      setGlobalError('Đã có lỗi xảy ra trong quá trình khởi tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
          CS
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Đăng ký Tài khoản Học viên
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Gia nhập nền tảng chuẩn mực văn hóa doanh nghiệp và giao tiếp chuyên nghiệp
        </p>
      </div>

      {/* Step Wizard Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 1
                ? 'bg-blue-900 text-white ring-4 ring-blue-100'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {step === 2 ? '✓' : '1'}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Bước 1: Thông tin tài khoản</div>
            <div className="text-[11px] text-slate-500">Tên, email và mật khẩu đăng nhập</div>
          </div>
        </div>

        <div className="hidden sm:block w-12 h-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 2
                ? 'bg-blue-900 text-white ring-4 ring-blue-100'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            2
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Bước 2: Hồ sơ công tác</div>
            <div className="text-[11px] text-slate-500">Cơ quan, chức vụ và mục tiêu</div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {globalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{globalError}</div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* STEP 1: ACCOUNT CREDENTIALS */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Thông tin đăng nhập bắt buộc
            </h2>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên của bạn <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-colors ${
                    fieldErrors.name
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:ring-blue-800/20 focus:border-blue-800'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email công tác hoặc Email cá nhân <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="name@company.vn"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:ring-blue-800/20 focus:border-blue-800'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-colors ${
                    fieldErrors.password
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:ring-blue-800/20 focus:border-blue-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhập lại mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Xác nhận lại mật khẩu trên"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-colors ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:ring-blue-800/20 focus:border-blue-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => {
                    setAgreedTerms(e.target.checked);
                    if (fieldErrors.agreedTerms) setFieldErrors((prev) => ({ ...prev, agreedTerms: '' }));
                  }}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-800 mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  Tôi đồng ý với{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPolicyModal?.('terms');
                    }}
                    className="text-blue-900 font-semibold underline hover:text-blue-700 cursor-pointer"
                  >
                    Điều khoản sử dụng
                  </button>{' '}
                  và{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPolicyModal?.('privacy');
                    }}
                    className="text-blue-900 font-semibold underline hover:text-blue-700 cursor-pointer"
                  >
                    Chính sách bảo mật quyền riêng tư
                  </button>{' '}
                  của chương trình đào tạo chuẩn mực công sở.
                </span>
              </label>
              {fieldErrors.agreedTerms && (
                <p className="text-[11px] text-rose-600 mt-1 pl-6.5">{fieldErrors.agreedTerms}</p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Đã có tài khoản? Đăng nhập
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Tiếp tục sang Bước 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PERSONAL & WORKPLACE PROFILE */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Thông tin Cá nhân & Nơi công tác (Tùy chọn)
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Các thông tin này giúp hệ thống gợi ý chuyên đề bài học và ghi nhận chức danh chính xác trên chứng nhận đào tạo. Bạn có thể bổ sung ngay hoặc hoàn tất sau.
              </p>
            </div>

            <div className="space-y-4">
              {/* Row: Birthdate & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh (Không bắt buộc)
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
                    Giới tính (Không bắt buộc)
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

              {/* Row: Phone & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ (Không bắt buộc)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chức vụ / Vị trí công tác
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
              </div>

              {role === 'Khác' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhập chức vụ cụ thể của bạn:
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Ví dụ: Kiểm toán viên nội bộ"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Row: Organization Type & Organization Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên cơ quan / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Ví dụ: Công ty Cổ phần Alpha"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                  />
                </div>
              </div>

              {/* Row: Department & SubUnit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phòng ban / Bộ phận
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ví dụ: Phòng Dự án & Đổi mới sáng tạo"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị trực thuộc (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={subUnit}
                    onChange={(e) => setSubUnit(e.target.value)}
                    placeholder="Ví dụ: Trung tâm Hà Nội"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Row: Workplace Address & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa chỉ nơi làm việc
                  </label>
                  <input
                    type="text"
                    value={workplaceAddress}
                    onChange={(e) => setWorkplaceAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, quận/huyện..."
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

              {/* Row: Experience & Learning Goal */}
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
            </div>

            {/* Actions Row */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5 order-3 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Bước 1</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Bỏ qua & Hoàn tất
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Đang khởi tạo...</span>
                  ) : (
                    <>
                      <span>Hoàn tất đăng ký</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
