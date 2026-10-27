import React, { useState, useEffect } from 'react';
import {
  AdminLesson,
  AdminScenario,
  AdminQuizQuestion,
  DocumentItem,
  AuditLog,
  AdminDashboardStats,
  UserAccount
} from '../../types';
import { AdminApiService } from '../../services/adminApi';
import { AdminAuthModal } from './AdminAuthModal';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminLessonsView } from './AdminLessonsView';
import { AdminScenariosView } from './AdminScenariosView';
import { AdminQuizzesView } from './AdminQuizzesView';
import { AdminDocumentsView } from './AdminDocumentsView';
import { AdminAiStudioView } from './AdminAiStudioView';
import { AdminLearningContentView } from './AdminLearningContentView';
import { AdminUsersView } from './AdminUsersView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminSettingsView } from './AdminSettingsView';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  FileQuestion,
  Files,
  Sparkles,
  Layers,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Menu,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export type AdminSubTab =
  | 'overview'
  | 'lessons'
  | 'scenarios'
  | 'quizzes'
  | 'documents'
  | 'learning-content'
  | 'ai-studio'
  | 'users'
  | 'analytics'
  | 'settings';

interface AdminViewProps {
  currentUser: UserAccount | null;
  onExitAdmin: () => void;
  onSyncPublicData: () => Promise<void>;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onExitAdmin,
  onSyncPublicData,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [preselectedDocIdForAi, setPreselectedDocIdForAi] = useState<string | undefined>();
  const [filterDocIdForLearningContent, setFilterDocIdForLearningContent] = useState<string | undefined>();

  // Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Core Data
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalLessons: 10,
    publishedLessons: 10,
    draftLessons: 0,
    pendingLessons: 0,
    totalScenarios: 8,
    publishedScenarios: 8,
    totalQuestions: 20,
    totalDocuments: 1,
    analyzedDocuments: 1,
    pendingAiProposals: 0,
    totalUsers: 2,
    activeLearnersLast7Days: 2,
    totalXPGranted: 14850
  });

  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [scenarios, setScenarios] = useState<AdminScenario[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<AdminQuizQuestion[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Check auth session
  const verifyAdminSession = async () => {
    setIsCheckingAuth(true);
    try {
      const status = await AdminApiService.checkStatus();
      if (status.isLoggedInAdmin && status.adminUser) {
        setIsAdminAuthenticated(true);
        setAdminUser(status.adminUser);
        await loadAllAdminData();
      } else {
        // If currentUser in client has isAdmin flag, attempt auto-prompt
        setIsAdminAuthenticated(false);
        setShowAuthModal(true);
      }
    } catch (err) {
      console.warn('Error checking admin status:', err);
      setIsAdminAuthenticated(false);
      setShowAuthModal(true);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadAllAdminData = async () => {
    try {
      const [statsData, lessonsData, scenariosData, quizzesData, docsData, usersData, logsData] =
        await Promise.all([
          AdminApiService.getStats().catch(() => stats),
          AdminApiService.getLessons().catch(() => []),
          AdminApiService.getScenarios().catch(() => []),
          AdminApiService.getQuizzes().catch(() => []),
          AdminApiService.getDocuments().catch(() => []),
          AdminApiService.getUsers().catch(() => []),
          AdminApiService.getLogs().catch(() => [])
        ]);

      if (statsData) setStats(statsData);
      if (lessonsData) setLessons(lessonsData);
      if (scenariosData) setScenarios(scenariosData);
      if (quizzesData) setQuizQuestions(quizzesData);
      if (docsData) setDocuments(docsData);
      if (usersData) setUsersList(usersData);
      if (logsData) setAuditLogs(logsData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    verifyAdminSession();
  }, []);

  // Handlers
  const handleAuthSuccess = async (user: any) => {
    setIsAdminAuthenticated(true);
    setAdminUser(user);
    setShowAuthModal(false);
    await loadAllAdminData();
  };

  const handleAdminLogout = async () => {
    await AdminApiService.logout();
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    onShowToast('Đã đăng xuất Quản trị', 'Bạn đã quay về chế độ người học.', 'info');
    onExitAdmin();
  };

  // Lesson CRUD
  const handleSaveLesson = async (lesson: Partial<AdminLesson>, isNew: boolean) => {
    if (isNew) {
      await AdminApiService.createLesson(lesson);
      onShowToast('Thêm bài học thành công!', 'Bài học đã được lưu vào hệ thống.', 'success');
    } else {
      await AdminApiService.updateLesson(lesson.id!, lesson);
      onShowToast('Cập nhật thành công!', 'Nội dung bài học đã được cập nhật.', 'success');
    }
    await loadAllAdminData();
    await onSyncPublicData();
  };

  const handleDeleteLesson = async (id: string) => {
    await AdminApiService.deleteLesson(id);
    onShowToast('Đã xóa bài học', 'Dữ liệu đã được gỡ khỏi hệ thống.', 'info');
    await loadAllAdminData();
    await onSyncPublicData();
  };

  // Scenario CRUD
  const handleSaveScenario = async (scenario: Partial<AdminScenario>, isNew: boolean) => {
    if (isNew) {
      await AdminApiService.createScenario(scenario);
      onShowToast('Thêm tình huống thành công!', '', 'success');
    } else {
      await AdminApiService.updateScenario(scenario.id!, scenario);
      onShowToast('Cập nhật tình huống thành công!', '', 'success');
    }
    await loadAllAdminData();
    await onSyncPublicData();
  };

  const handleDeleteScenario = async (id: string) => {
    await AdminApiService.deleteScenario(id);
    onShowToast('Đã xóa tình huống', '', 'info');
    await loadAllAdminData();
    await onSyncPublicData();
  };

  // Quiz CRUD
  const handleSaveQuiz = async (question: Partial<AdminQuizQuestion>, isNew: boolean) => {
    if (isNew) {
      await AdminApiService.createQuiz(question);
      onShowToast('Thêm câu hỏi thành công!', '', 'success');
    } else {
      await AdminApiService.updateQuiz(question.id!, question);
      onShowToast('Cập nhật câu hỏi thành công!', '', 'success');
    }
    await loadAllAdminData();
    await onSyncPublicData();
  };

  const handleDeleteQuiz = async (id: string) => {
    await AdminApiService.deleteQuiz(id);
    onShowToast('Đã xóa câu hỏi', '', 'info');
    await loadAllAdminData();
    await onSyncPublicData();
  };

  const handleNavigateToAiStudioWithDoc = (docId: string) => {
    setPreselectedDocIdForAi(docId);
    setActiveTab('ai-studio');
  };

  // Navigation Items for Sidebar
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'lessons', label: 'Quản lý bài học', icon: BookOpen, count: lessons.length },
    { id: 'scenarios', label: 'Quản lý tình huống', icon: Target, count: scenarios.length },
    { id: 'quizzes', label: 'Quản lý bài kiểm tra', icon: FileQuestion, count: quizQuestions.length },
    { id: 'documents', label: 'Kho tài liệu tham khảo', icon: Files, count: documents.length },
    {
      id: 'learning-content',
      label: 'Kho nội dung học tập',
      icon: Layers,
      count: lessons.filter((l) => l.sourceDocumentId).length + scenarios.filter((s) => s.sourceDocumentId).length
    },
    {
      id: 'ai-studio',
      label: 'AI phân tích & tạo nội dung',
      icon: Sparkles,
      highlight: stats.pendingAiProposals > 0
    },
    { id: 'users', label: 'Quản lý người dùng', icon: Users, count: usersList.length },
    { id: 'analytics', label: 'Thống kê học tập', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings }
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs font-semibold text-slate-600">
          Đang kiểm tra phân quyền Quản trị viên tại máy chủ...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[750px] bg-slate-50 flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8">
      {/* Auth Modal Guard */}
      <AdminAuthModal
        isOpen={showAuthModal && !isAdminAuthenticated}
        onClose={() => {
          setShowAuthModal(false);
          if (!isAdminAuthenticated) onExitAdmin();
        }}
        onAuthSuccess={handleAuthSuccess}
        onShowToast={onShowToast}
      />

      {/* Main Admin Workspace Shell with Left Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar (Desktop) */}
        <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex flex-col justify-between p-4 border-r border-slate-800">
          <div className="space-y-6">
            {/* Brand in Sidebar */}
            <div className="flex items-center gap-2.5 px-2 pt-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                CS
              </div>
              <div>
                <span className="font-extrabold text-sm text-white block">Quản Trị Hệ Thống</span>
                <span className="text-[10px] text-blue-300 font-mono">Bản quyền 2026</span>
              </div>
            </div>

            {/* Nav List */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as AdminSubTab)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>

                    {item.highlight ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ) : item.count !== undefined ? (
                      <span className="text-[10px] font-mono text-slate-400">{item.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile & exit in Sidebar footer */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="px-3 py-2 rounded-xl bg-slate-800/60 flex items-center justify-between text-xs">
              <div className="truncate">
                <div className="font-bold text-white truncate max-w-[130px]">
                  {adminUser?.name || 'Quản trị viên'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {adminUser?.email || 'admin@hethong.vn'}
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onExitAdmin}
                className="flex-1 py-2 px-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về trang học</span>
              </button>
              <button
                onClick={handleAdminLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Đăng xuất Quản trị"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Top Header for Admin */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              CS
            </div>
            <span className="font-bold text-xs">Admin Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitAdmin}
              className="text-xs px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300"
            >
              Về trang học
            </button>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 text-slate-300 hover:text-white"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileSidebarOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 border-b border-slate-800 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as AdminSubTab);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                {item.count !== undefined && <span className="font-mono text-[10px]">{item.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Main Admin Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <AdminOverviewView
              stats={stats}
              auditLogs={auditLogs}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'lessons' && (
            <AdminLessonsView
              lessons={lessons}
              onSaveLesson={handleSaveLesson}
              onDeleteLesson={handleDeleteLesson}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'scenarios' && (
            <AdminScenariosView
              scenarios={scenarios}
              onSaveScenario={handleSaveScenario}
              onDeleteScenario={handleDeleteScenario}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'quizzes' && (
            <AdminQuizzesView
              quizQuestions={quizQuestions}
              onSaveQuiz={handleSaveQuiz}
              onDeleteQuiz={handleDeleteQuiz}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'documents' && (
            <AdminDocumentsView
              documents={documents}
              onDocumentAdded={loadAllAdminData}
              onNavigateToAiStudio={handleNavigateToAiStudioWithDoc}
              onNavigateToLearningContent={(docId) => {
                setFilterDocIdForLearningContent(docId);
                setActiveTab('learning-content');
              }}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'learning-content' && (
            <AdminLearningContentView
              initialDocumentFilter={filterDocIdForLearningContent}
              onNavigateToDocument={(docId) => {
                setActiveTab('documents');
              }}
              onShowToast={onShowToast}
              onDataChanged={async () => {
                await loadAllAdminData();
                await onSyncPublicData();
              }}
            />
          )}

          {activeTab === 'ai-studio' && (
            <AdminAiStudioView
              documents={documents}
              preselectedDocId={preselectedDocIdForAi}
              onRefreshAll={loadAllAdminData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsersView
              users={usersList}
              onRefresh={loadAllAdminData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsView stats={stats} lessons={lessons} />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsView auditLogs={auditLogs} onShowToast={onShowToast} />
          )}
        </main>
      </div>
    </div>
  );
};
