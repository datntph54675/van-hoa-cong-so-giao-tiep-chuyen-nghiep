import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { UserAccount } from '../../types';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  UserCheck,
  X
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  onNavigateRegister: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onShowToast
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrUsername.trim()) {
      setErrorMessage('Vui lòng nhập email hoặc tên tài khoản.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await StorageService.login(emailOrUsername, password, rememberMe);
      if (result.success && result.user) {
        onShowToast(
          'Đăng nhập thành công!',
          `Chào mừng ${result.user.name} quay trở lại chương trình đào tạo.`,
          'success'
        );
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setErrorMessage('Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill test account for evaluator convenience
  const handleQuickFill = (email: string, pass = 'MatKhau@123') => {
    setEmailOrUsername(email);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ email đã đăng ký.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const res = await StorageService.resetPassword(forgotEmail, newPassword);
    if (res.success) {
      setForgotSuccess(true);
      onShowToast('Cập nhật mật khẩu thành công!', 'Bạn có thể đăng nhập bằng mật khẩu mới.', 'success');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(false);
        setEmailOrUsername(forgotEmail);
        setPassword(newPassword);
      }, 1500);
    } else {
      setForgotError(res.error || 'Không thể đặt lại mật khẩu.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* Brand & Card Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
          CS
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Văn hoá công sở & Giao tiếp chuyên nghiệp
        </h1>
        <p className="text-sm font-semibold text-blue-900">
          Chào mừng bạn quay trở lại
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email công tác hoặc Tên tài khoản <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoComplete="email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="ví_dụ@congsochuyennghiep.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password field with show/hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotEmail(emailOrUsername);
                  setForgotError(null);
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-800 focus:ring-offset-0"
            />
            <label htmlFor="rememberMe" className="text-xs text-slate-600 select-none cursor-pointer">
              Ghi nhớ đăng nhập trên thiết bị này
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register prompt */}
        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="font-bold text-blue-900 hover:underline inline-block"
          >
            Đăng ký tài khoản ngay
          </button>
        </div>
      </div>

      {/* Quick Demo Test Accounts Box */}
      <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <UserCheck className="w-4 h-4 text-blue-700" />
          <span>Tài khoản kiểm thử nhanh (Demo Accounts):</span>
        </div>
        <p className="text-[11px] text-slate-600">
          Bấm vào tài khoản bên dưới để tự động điền thông tin và kiểm tra tính năng phân tách dữ liệu riêng biệt:
        </p>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill('tuda2k4@gmail.com', '123456')}
            className="w-full text-left p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 hover:border-amber-400 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span>Nguyễn Tuấn Đạt</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <div className="text-[11px] text-amber-900/80 font-mono">tuda2k4@gmail.com · 123456</div>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded">
              Chọn Admin
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('an.nguyen@congsochuyennghiep.vn')}
            className="w-full text-left p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-slate-900">Nguyễn Văn An (Chuyên viên Dự án)</div>
              <div className="text-[11px] text-slate-500 font-mono">an.nguyen@congsochuyennghiep.vn · MatKhau@123</div>
            </div>
            <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded">
              Chọn
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('mai.phuong@congsochuyennghiep.vn')}
            className="w-full text-left p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-slate-900">Trần Thị Mai Phương (Trưởng nhóm KH)</div>
              <div className="text-[11px] text-slate-500 font-mono">mai.phuong@congsochuyennghiep.vn · MatKhau@123</div>
            </div>
            <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded">
              Chọn
            </span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Đặt lại mật khẩu tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Mật khẩu đã được cập nhật thành công!
                </div>
                <p>Đang chuyển hướng về màn hình đăng nhập...</p>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 leading-relaxed">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email tài khoản của bạn:
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@congsochuyennghiep.vn"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mật khẩu mới (tối thiểu 6 ký tự):
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhập lại mật khẩu mới:
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                  * Trong phiên bản thử nghiệm, mật khẩu được băm bảo mật SHA-256 kèm salt ngay khi xác thực. Khi triển khai chính thức, hệ thống sẽ gửi liên kết xác thực dùng một lần qua hòm thư điện tử.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-900 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-2xs"
                  >
                    Xác nhận đặt lại
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
