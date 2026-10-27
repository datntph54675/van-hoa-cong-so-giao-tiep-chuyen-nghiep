import React, { useState } from 'react';
import { NavTab, UserAccount } from '../../types';
import {
  Sparkles,
  Trophy,
  BookOpen,
  ShieldCheck,
  User,
  Compass,
  Menu,
  X,
  LogOut,
  Target,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab, detailId?: string) => void;
  currentUser: UserAccount | null;
  points: number;
  unlockedBadgeCount: number;
  onLogout: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  points,
  unlockedBadgeCount,
  onLogout,
  isAdmin = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab, sectionId?: string) => {
    setMobileMenuOpen(false);
    if (tab === 'landing' && sectionId) {
      if (currentTab === 'landing') {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } else {
        onSelectTab('landing');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
        return;
      }
    }
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleNavClick(currentUser ? 'overview' : 'landing')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-hidden group whitespace-nowrap shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-blue-800 transition-colors">
            CS
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block group-hover:text-blue-900 transition-colors">
              Văn Hoá Công Sở
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block font-medium">
              & Giao Tiếp Chuyên Nghiệp
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
          {currentUser ? (
            // Logged-in navigation
            <>
              <button
                onClick={() => handleNavClick('landing')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'landing'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Trang chủ
              </button>
              <button
                onClick={() => handleNavClick('overview')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'overview'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => handleNavClick('lessons')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'lessons' || currentTab === 'lesson-detail'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Bài học
              </button>
              <button
                onClick={() => handleNavClick('scenarios')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'scenarios'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Tình huống
              </button>
              <button
                onClick={() => handleNavClick('quizzes')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'quizzes'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Trắc nghiệm
              </button>
              <button
                onClick={() => handleNavClick('leaderboard')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'leaderboard'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Bảng xếp hạng
              </button>
              <button
                onClick={() => handleNavClick('progress')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'progress'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Tiến độ
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`py-1.5 transition-colors border-b-2 cursor-pointer flex items-center gap-1 ${
                    currentTab === 'admin'
                      ? 'text-blue-900 border-blue-900 font-bold'
                      : 'border-transparent text-slate-700 hover:text-blue-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Quản trị</span>
                </button>
              )}
            </>
          ) : (
            // Landing navigation (Guest)
            <>
              <button
                onClick={() => handleNavClick('landing', 'trang-chu')}
                className={`py-1.5 transition-colors border-b-2 cursor-pointer ${
                  currentTab === 'landing'
                    ? 'text-blue-900 border-blue-900 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Trang chủ
              </button>
              <button
                onClick={() => handleNavClick('landing', 'gioi-thieu')}
                className="py-1.5 transition-colors border-b-2 border-transparent hover:text-slate-900 cursor-pointer"
              >
                Giới thiệu
              </button>
              <button
                onClick={() => handleNavClick('landing', 'bai-hoc')}
                className="py-1.5 transition-colors border-b-2 border-transparent hover:text-slate-900 cursor-pointer"
              >
                Bài học
              </button>
              <button
                onClick={() => handleNavClick('landing', 'ky-nang')}
                className="py-1.5 transition-colors border-b-2 border-transparent hover:text-slate-900 cursor-pointer"
              >
                Kỹ năng giao tiếp
              </button>
              <button
                onClick={() => handleNavClick('landing', 'tinh-huong')}
                className="py-1.5 transition-colors border-b-2 border-transparent hover:text-slate-900 cursor-pointer"
              >
                Thực hành tình huống
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Actions (Desktop) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {currentUser ? (
            <>
              {/* AI Coach Button */}
              <button
                onClick={() => handleNavClick('ai-tutor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs whitespace-nowrap cursor-pointer ${
                  currentTab === 'ai-tutor'
                    ? 'bg-blue-900 text-white'
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Trợ lý AI</span>
              </button>

              {/* User Profile Trigger */}
              <button
                onClick={() => handleNavClick('profile')}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl transition-colors text-left cursor-pointer ${
                  currentTab === 'profile'
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-100 border border-transparent'
                }`}
                title="Hồ sơ cá nhân"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-blue-700 font-semibold">
                    {points} XP
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('login')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => handleNavClick('register')}
                className="px-4.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Đăng ký ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          {currentUser && (
            <button
              onClick={() => handleNavClick('profile')}
              className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold uppercase cursor-pointer"
            >
              {currentUser.name.charAt(0)}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Mở thực đơn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          {currentUser ? (
            <div className="space-y-1">
              <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.role}</div>
                  <div className="text-[11px] font-mono text-blue-700 font-semibold mt-0.5">
                    {points} XP · {unlockedBadgeCount} huy hiệu
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Thoát</span>
                </button>
              </div>

              <button
                onClick={() => handleNavClick('landing')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Trang chủ giới thiệu
              </button>
              <button
                onClick={() => handleNavClick('overview')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tổng quan học tập
              </button>
              <button
                onClick={() => handleNavClick('lessons')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Thư viện 10 bài học
              </button>
              <button
                onClick={() => handleNavClick('scenarios')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Thực hành 8 tình huống
              </button>
              <button
                onClick={() => handleNavClick('quizzes')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kiểm tra kiến thức trắc nghiệm
              </button>
              <button
                onClick={() => handleNavClick('leaderboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bảng xếp hạng thi đua
              </button>
              <button
                onClick={() => handleNavClick('progress')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tiến độ & Báo cáo
              </button>
              <button
                onClick={() => handleNavClick('ai-tutor')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-blue-900 bg-blue-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Trợ lý AI Cố vấn 24/7</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Khu vực Quản trị Hệ thống</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('landing', 'trang-chu')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Trang chủ
              </button>
              <button
                onClick={() => handleNavClick('landing', 'gioi-thieu')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Giới thiệu nền tảng
              </button>
              <button
                onClick={() => handleNavClick('landing', 'bai-hoc')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bài học tiêu biểu
              </button>
              <button
                onClick={() => handleNavClick('landing', 'ky-nang')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kỹ năng giao tiếp
              </button>
              <button
                onClick={() => handleNavClick('landing', 'tinh-huong')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Thực hành tình huống
              </button>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-blue-900 rounded-xl shadow-xs"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
