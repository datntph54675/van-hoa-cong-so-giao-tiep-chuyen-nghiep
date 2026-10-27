import React, { useState, useEffect } from 'react';
import {
  NavTab,
  Lesson,
  Scenario,
  QuizQuestion,
  QuizResult,
  UserProfile,
  UserAccount
} from './types';
import { StorageService, RecentActivity } from './services/storage';
import { AdminApiService } from './services/adminApi';
import { Header } from './components/layout/Header';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { PolicyModal } from './components/common/PolicyModal';
import { LandingView } from './components/landing/LandingView';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { OverviewView } from './components/dashboard/OverviewView';
import { LessonsView } from './components/lessons/LessonsView';
import { LessonDetailView } from './components/lessons/LessonDetailView';
import { ScenariosView } from './components/scenarios/ScenariosView';
import { QuizzesView } from './components/quizzes/QuizzesView';
import { LeaderboardView } from './components/gamification/LeaderboardView';
import { AiChatView } from './components/chat/AiChatView';
import { ProgressView } from './components/progress/ProgressView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminView } from './components/admin/AdminView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('landing');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-1');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    StorageService.getCurrentUser()
  );
  // Strict backend-verified admin status (never solely trusts client state or localStorage)
  const [isServerVerifiedAdmin, setIsServerVerifiedAdmin] = useState<boolean>(false);

  // Policy Modal state
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<'terms' | 'privacy'>('terms');

  // Core data states loaded from StorageService
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [lessons, setLessons] = useState<Lesson[]>(() => StorageService.getLessons());
  const [scenarios, setScenarios] = useState<Scenario[]>(() => StorageService.getScenarios());
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() =>
    StorageService.getQuizQuestions()
  );

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() =>
    StorageService.getCompletedLessons()
  );
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, any>>(() =>
    StorageService.getCompletedScenarios()
  );
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>(() =>
    StorageService.getQuizHistory()
  );
  const [points, setPoints] = useState<number>(() => StorageService.getPoints());
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() =>
    StorageService.getUnlockedBadges()
  );
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(() =>
    StorageService.getRecentActivities()
  );

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'info' | 'error' = 'info'
  ) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newToast: ToastMessage = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reload user-scoped data when user session changes
  const reloadUserData = () => {
    setProfile(StorageService.getProfile());
    setCompletedLessonIds(StorageService.getCompletedLessons());
    setCompletedScenarios(StorageService.getCompletedScenarios());
    setQuizHistory(StorageService.getQuizHistory());
    setPoints(StorageService.getPoints());
    setUnlockedBadges(StorageService.getUnlockedBadges());
    setRecentActivities(StorageService.getRecentActivities());
  };

  // Sync published content from backend database
  const syncPublishedDataFromBackend = async () => {
    try {
      const [lRes, sRes, qRes] = await Promise.all([
        fetch('/api/public/lessons').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/public/scenarios').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/public/quizzes').then((r) => (r.ok ? r.json() : null))
      ]);
      if (Array.isArray(lRes) && lRes.length > 0) {
        setLessons(lRes);
        StorageService.saveLessons(lRes);
      }
      if (Array.isArray(sRes) && sRes.length > 0) {
        setScenarios(sRes);
        StorageService.saveScenarios(sRes);
      }
      if (Array.isArray(qRes) && qRes.length > 0) {
        setQuizQuestions(qRes);
        StorageService.saveQuizQuestions(qRes);
      }
    } catch (err) {
      console.warn('Backend sync warning, using local storage cache:', err);
    }
  };

  // Strictly verify admin role against backend session token
  const checkAdminAccess = async () => {
    try {
      const token = AdminApiService.getToken();
      if (!token) {
        setIsServerVerifiedAdmin(false);
        return false;
      }
      const res = await AdminApiService.checkStatus();
      const verified = !!res.isLoggedInAdmin;
      setIsServerVerifiedAdmin(verified);
      return verified;
    } catch {
      setIsServerVerifiedAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    syncPublishedDataFromBackend();
    checkAdminAccess();
  }, [currentUser]);

  // Intercept direct hash routing (e.g. #admin)
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'admin') {
        const hasAccess = await checkAdminAccess();
        if (!hasAccess) {
          showToast(
            'Không có quyền truy cập',
            'Bạn không có quyền truy cập chức năng này. Vui lòng liên hệ Quản trị viên nếu cần cấp quyền.',
            'error'
          );
          window.location.hash = '';
          setCurrentTab(currentUser ? 'overview' : 'landing');
        } else {
          setCurrentTab('admin');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  // Synchronize badges on state changes
  const refreshGamificationState = () => {
    const newBadges = StorageService.evaluateBadges();
    setUnlockedBadges(newBadges);
    setPoints(StorageService.getPoints());
    setRecentActivities(StorageService.getRecentActivities());
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    reloadUserData();
    checkAdminAccess();
    setCurrentTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      'Đăng nhập thành công!',
      `Chào mừng ${user.name} quay trở lại nền tảng học tập.`,
      'success'
    );
  };

  const handleRegisterSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    reloadUserData();
    setIsServerVerifiedAdmin(false);
    setCurrentTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      'Đăng ký tài khoản thành công!',
      `Chào mừng bạn gia nhập chương trình Văn hóa Công sở 2026.`,
      'success'
    );
  };

  const handleLogout = async () => {
    try {
      await AdminApiService.logout();
    } catch {
      // ignore
    }
    StorageService.logout();
    setIsServerVerifiedAdmin(false);
    setCurrentUser(null);
    reloadUserData();
    setCurrentTab('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Đã đăng xuất', 'Hẹn gặp lại bạn trong các bài học tiếp theo!', 'info');
  };

  const handleOpenPolicyModal = (tab: 'terms' | 'privacy') => {
    setPolicyModalTab(tab);
    setPolicyModalOpen(true);
  };

  // Toggle complete lesson
  const handleToggleCompleteLesson = (lessonId: string) => {
    if (!currentUser) {
      showToast(
        'Vui lòng đăng nhập',
        'Hãy đăng nhập tài khoản để lưu tiến độ và nhận điểm kinh nghiệm (XP).',
        'info'
      );
      return;
    }
    const { completed, pointsEarned } = StorageService.toggleCompleteLesson(lessonId);
    setCompletedLessonIds(StorageService.getCompletedLessons());
    refreshGamificationState();

    if (completed) {
      showToast(
        'Đã hoàn thành bài học!',
        `Bạn nhận được +${pointsEarned} điểm kinh nghiệm (XP).`,
        'success'
      );
    } else {
      showToast('Đã bỏ đánh dấu hoàn thành', undefined, 'info');
    }
  };

  // Complete scenario
  const handleCompleteScenario = (scenarioId: string, optionId: string, score: number) => {
    if (!currentUser) {
      showToast(
        'Cần đăng nhập để lưu kết quả',
        'Bạn đang ở chế độ xem thử. Đăng nhập để tích lũy điểm kinh nghiệm và mở khóa huy hiệu.',
        'info'
      );
    }
    StorageService.saveCompletedScenario(scenarioId, optionId, score);
    setCompletedScenarios(StorageService.getCompletedScenarios());
    refreshGamificationState();
    showToast(
      'Đã hoàn thành tình huống!',
      `Phương án của bạn đã được ghi nhận (+${score} XP).`,
      'success'
    );
  };

  // Save quiz result
  const handleSaveQuizResult = (result: QuizResult): number => {
    const pts = StorageService.saveQuizResult(result);
    setQuizHistory(StorageService.getQuizHistory());
    refreshGamificationState();
    showToast(
      'Đã nộp bài kiểm tra!',
      `Kết quả: ${result.score}/${result.totalQuestions} câu đúng (+${pts} XP).`,
      result.passed ? 'success' : 'info'
    );
    return pts;
  };

  // Reset all data
  const handleResetData = () => {
    setProfile(StorageService.getProfile());
    setLessons(StorageService.getLessons());
    setScenarios(StorageService.getScenarios());
    setQuizQuestions(StorageService.getQuizQuestions());
    setCompletedLessonIds(StorageService.getCompletedLessons());
    setCompletedScenarios(StorageService.getCompletedScenarios());
    setQuizHistory(StorageService.getQuizHistory());
    setPoints(StorageService.getPoints());
    setUnlockedBadges(StorageService.getUnlockedBadges());
    setRecentActivities(StorageService.getRecentActivities());
    setCurrentTab('overview');
  };

  // Navigation router helper
  const handleNavigate = (tab: NavTab, detailId?: string) => {
    if (detailId) {
      setSelectedLessonId(detailId);
      setCurrentTab('lesson-detail');
    } else {
      // Guard admin tab: strictly requires backend verification
      if (tab === 'admin') {
        if (!isServerVerifiedAdmin) {
          showToast(
            'Không có quyền truy cập',
            'Bạn không có quyền truy cập chức năng này. Vui lòng liên hệ Quản trị viên nếu cần cấp quyền.',
            'error'
          );
          setCurrentTab(currentUser ? 'overview' : 'landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // Guard profile if not logged in
      if (tab === 'profile' && !currentUser) {
        showToast('Vui lòng đăng nhập', 'Bạn cần đăng nhập để quản lý hồ sơ cá nhân.', 'info');
        setCurrentTab('login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setCurrentTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find active lesson for detail view
  const activeLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Terms & Privacy Policy Modal */}
      <PolicyModal
        isOpen={policyModalOpen}
        initialTab={policyModalTab}
        onClose={() => setPolicyModalOpen(false)}
      />

      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        currentUser={currentUser}
        points={points}
        unlockedBadgeCount={unlockedBadges.length}
        onLogout={handleLogout}
        isAdmin={isServerVerifiedAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'landing' && (
          <LandingView
            currentUser={currentUser}
            lessons={lessons}
            scenarios={scenarios}
            onNavigateLogin={() => handleNavigate('login')}
            onNavigateRegister={() => handleNavigate('register')}
            onNavigateLessons={() => handleNavigate('lessons')}
            onNavigateScenarios={(scenarioId) => handleNavigate('scenarios', scenarioId)}
            onNavigateOverview={() => handleNavigate('overview')}
            onPreviewLesson={(lessonId) => handleNavigate('lesson-detail', lessonId)}
            onOpenPolicyModal={handleOpenPolicyModal}
          />
        )}

        {currentTab === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => handleNavigate('register')}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'register' && (
          <RegisterView
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateLogin={() => handleNavigate('login')}
            onShowToast={showToast}
            onOpenPolicyModal={handleOpenPolicyModal}
          />
        )}

        {currentTab === 'overview' && (
          <OverviewView
            profile={profile}
            lessons={lessons}
            scenarios={scenarios}
            completedLessonIds={completedLessonIds}
            completedScenarios={completedScenarios}
            quizHistory={quizHistory}
            points={points}
            unlockedBadges={unlockedBadges}
            recentActivities={recentActivities}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'lessons' && (
          <LessonsView
            lessons={lessons}
            completedLessonIds={completedLessonIds}
            onSelectLesson={(lessonId) => {
              setSelectedLessonId(lessonId);
              setCurrentTab('lesson-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'lesson-detail' && activeLesson && (
          <LessonDetailView
            lesson={activeLesson}
            isCompleted={completedLessonIds.includes(activeLesson.id)}
            onToggleComplete={handleToggleCompleteLesson}
            onBack={() => setCurrentTab('lessons')}
            onNavigateLesson={(id) => {
              setSelectedLessonId(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            allLessons={lessons}
          />
        )}

        {currentTab === 'scenarios' && (
          <ScenariosView
            scenarios={scenarios}
            completedScenarios={completedScenarios}
            onCompleteScenario={handleCompleteScenario}
          />
        )}

        {currentTab === 'quizzes' && (
          <QuizzesView
            quizQuestions={quizQuestions}
            quizHistory={quizHistory}
            onSaveQuizResult={handleSaveQuizResult}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            profile={profile}
            points={points}
            completedLessonsCount={completedLessonIds.length}
            quizzesTakenCount={quizHistory.length}
            unlockedBadgeIds={unlockedBadges}
          />
        )}

        {currentTab === 'ai-tutor' && <AiChatView onShowToast={showToast} />}

        {currentTab === 'progress' && (
          <ProgressView
            lessons={lessons}
            scenarios={scenarios}
            completedLessonIds={completedLessonIds}
            completedScenarios={completedScenarios}
            quizHistory={quizHistory}
            points={points}
            unlockedBadgeIds={unlockedBadges}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={currentUser || profile}
            points={points}
            unlockedBadgeCount={unlockedBadges.length}
            completedLessonsCount={completedLessonIds.length}
            quizzesTakenCount={quizHistory.length}
            onUpdateProfile={(updated) => {
              setCurrentUser(updated);
              setProfile(updated);
            }}
            onLogout={handleLogout}
            onResetData={handleResetData}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'admin' && isServerVerifiedAdmin && (
          <AdminView
            currentUser={currentUser}
            onExitAdmin={() => handleNavigate('overview')}
            onSyncPublicData={syncPublishedDataFromBackend}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Global Footer for Internal Views (When not on landing) */}
      {currentTab !== 'landing' && (
        <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2 text-center sm:text-left">
              <span className="font-bold text-slate-800">
                Văn hoá công sở & Giao tiếp chuyên nghiệp
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span>
                © 2026 Bản quyền thuộc về tác giả{' '}
                <strong className="text-slate-700">Nguyễn Tuấn Đạt</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600">
              <button
                onClick={() => handleNavigate('landing')}
                className="hover:text-blue-900 transition-colors cursor-pointer"
              >
                Trang chủ
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => handleNavigate('overview')}
                className="hover:text-blue-900 transition-colors cursor-pointer"
              >
                Tổng quan
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => handleNavigate('lessons')}
                className="hover:text-blue-900 transition-colors cursor-pointer"
              >
                Bài học
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => handleOpenPolicyModal('terms')}
                className="hover:text-blue-900 transition-colors cursor-pointer"
              >
                Điều khoản
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => handleOpenPolicyModal('privacy')}
                className="hover:text-blue-900 transition-colors cursor-pointer"
              >
                Quyền riêng tư
              </button>
              {isServerVerifiedAdmin && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={() => handleNavigate('admin')}
                    className="hover:text-blue-900 transition-colors font-semibold text-blue-900 cursor-pointer"
                  >
                    Quản trị
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
