import {
  Lesson,
  Scenario,
  QuizQuestion,
  QuizResult,
  UserProfile,
  UserAccount,
  UserProgressData,
  ChatMessage,
  ChatFeedback
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_LESSONS,
  INITIAL_SCENARIOS,
  INITIAL_QUIZ_QUESTIONS,
  INITIAL_BADGES
} from '../data/seedData';
import { hashPassword, verifyPassword, generateSalt } from '../utils/crypto';
import { AdminApiService } from './adminApi';

const KEYS = {
  USERS_LIST: 'vccs_users_list_v2',
  CURRENT_USER_ID: 'vccs_current_user_id_v2',
  REMEMBER_ME: 'vccs_remember_me_v2',
  LESSONS: 'vccs_lessons_v1',
  SCENARIOS: 'vccs_scenarios_v1',
  QUIZ_QUESTIONS: 'vccs_quiz_questions_v1',
  CHAT_MESSAGES: 'vccs_chat_messages_v1',
  CHAT_FEEDBACK: 'vccs_chat_feedback_v1',
  // Per-user progress prefix: `vccs_user_progress_${userId}`
};

export interface RecentActivity {
  id: string;
  type: 'lesson' | 'scenario' | 'quiz' | 'badge';
  title: string;
  timestamp: number;
  pointsEarned: number;
}

export const StorageService = {
  // ==========================================
  // USERS & AUTHENTICATION
  // ==========================================
  getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(KEYS.USERS_LIST);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Seed with initial accounts
      localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: UserAccount[]): void {
    localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
  },

  getCurrentUser(): UserAccount | null {
    try {
      // Check session storage first if rememberMe is false, else localStorage
      let userId = localStorage.getItem(KEYS.CURRENT_USER_ID);
      if (!userId && typeof sessionStorage !== 'undefined') {
        userId = sessionStorage.getItem(KEYS.CURRENT_USER_ID);
      }
      if (!userId) {
        return null;
      }
      const users = this.getUsers();
      return users.find((u) => u.id === userId) || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null, rememberMe = true): void {
    if (!user) {
      localStorage.removeItem(KEYS.CURRENT_USER_ID);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(KEYS.CURRENT_USER_ID);
      }
    } else {
      if (rememberMe) {
        localStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
        localStorage.setItem(KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(KEYS.CURRENT_USER_ID);
        localStorage.removeItem(KEYS.REMEMBER_ME);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
        }
      }
    }
  },

  async login(
    emailOrUsername: string,
    passwordPlain: string,
    rememberMe = true
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const trimmed = emailOrUsername.trim().toLowerCase();

    // 1. Primary path: Authenticate directly with backend server
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: trimmed, password: passwordPlain })
      });
      const data = await response.json();
      if (response.ok && data.success && data.user) {
        // If server issued an admin token, persist it securely
        if (data.token) {
          AdminApiService.setToken(data.token, rememberMe);
        } else {
          AdminApiService.setToken(null);
        }

        // Cache user in local users list for offline resilience
        const users = this.getUsers();
        const existingIdx = users.findIndex(
          (u) => u.id === data.user.id || u.email.toLowerCase() === data.user.email.toLowerCase()
        );
        if (existingIdx >= 0) {
          users[existingIdx] = { ...users[existingIdx], ...data.user };
        } else {
          users.push(data.user);
        }
        this.saveUsers(users);

        this.setCurrentUser(data.user, rememberMe);
        return { success: true, user: data.user };
      } else if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: data.error || 'Tài khoản hoặc mật khẩu không chính xác.'
        };
      }
    } catch (netErr) {
      console.warn('Backend authentication endpoint unavailable, attempting local cache fallback:', netErr);
    }

    // 2. Offline fallback
    const users = this.getUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        u.name.toLowerCase() === trimmed ||
        u.id.toLowerCase() === trimmed
    );

    if (!user) {
      return {
        success: false,
        error: 'Tài khoản không tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc đăng ký mới.'
      };
    }

    // Check special demo seed passwords or verify hash
    let isValid = false;
    if (
      user.passwordHash.startsWith('demo_hash_') &&
      passwordPlain === 'MatKhau@123'
    ) {
      isValid = true;
    } else {
      isValid = await verifyPassword(passwordPlain, user.passwordSalt, user.passwordHash);
    }

    if (!isValid) {
      return {
        success: false,
        error: 'Mật khẩu không chính xác. Vui lòng thử lại hoặc sử dụng tính năng Quên mật khẩu.'
      };
    }

    this.setCurrentUser(user, rememberMe);
    return { success: true, user };
  },

  async register(
    accountData: Omit<UserAccount, 'id' | 'passwordHash' | 'passwordSalt' | 'createdAt'>,
    passwordPlain: string
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const normalizedEmail = accountData.email.trim().toLowerCase();
    const users = this.getUsers();

    // Check uniqueness
    const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return {
        success: false,
        error: 'Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.'
      };
    }

    const salt = generateSalt();
    const hash = await hashPassword(passwordPlain, salt);

    const newUser: UserAccount = {
      ...accountData,
      id: 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      email: normalizedEmail,
      name: accountData.name.trim(),
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString().split('T')[0],
      joinedDate: 'Tháng ' + (new Date().getMonth() + 1) + ', ' + new Date().getFullYear(),
      avatarSeed: accountData.avatarSeed || accountData.name.trim().toLowerCase().replace(/\s+/g, '_'),
      isAdmin: false // Bắt buộc: tài khoản học viên mới đăng ký luôn luôn có quyền isAdmin: false
    };

    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);

    // Initialize fresh empty progress for new user
    const initialUserProgress: UserProgressData = {
      completedLessonIds: [],
      completedScenarios: {},
      quizHistory: [],
      points: 0,
      unlockedBadges: [],
      recentActivities: [
        {
          id: 'act_reg_' + Date.now(),
          type: 'badge',
          title: 'Chào mừng bạn gia nhập nền tảng Văn hóa Công sở!',
          timestamp: Date.now(),
          pointsEarned: 0
        }
      ]
    };
    this.saveUserProgress(newUser.id, initialUserProgress);

    this.setCurrentUser(newUser, true);
    return { success: true, user: newUser };
  },

  async changePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; error?: string }> {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Không tìm thấy thông tin tài khoản.' };
    }

    const user = users[userIndex];
    let isCurrentValid = false;
    if (user.passwordHash.startsWith('demo_hash_') && currentPasswordPlain === 'MatKhau@123') {
      isCurrentValid = true;
    } else {
      isCurrentValid = await verifyPassword(currentPasswordPlain, user.passwordSalt, user.passwordHash);
    }

    if (!isCurrentValid) {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPasswordPlain, newSalt);

    users[userIndex] = {
      ...user,
      passwordSalt: newSalt,
      passwordHash: newHash
    };

    this.saveUsers(users);
    return { success: true };
  },

  async resetPassword(
    email: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; error?: string }> {
    const users = this.getUsers();
    const normalized = email.trim().toLowerCase();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalized);

    if (userIndex === -1) {
      return {
        success: false,
        error: 'Không tìm thấy tài khoản với email này trong hệ thống.'
      };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPasswordPlain, newSalt);

    users[userIndex] = {
      ...users[userIndex],
      passwordSalt: newSalt,
      passwordHash: newHash
    };

    this.saveUsers(users);
    return { success: true };
  },

  updateProfile(userId: string, updates: Partial<UserAccount>): UserAccount {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...users[userIndex],
      ...updates
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);

    const currentUser = this.getCurrentUser();
    if (currentUser?.id === userId) {
      this.setCurrentUser(updatedUser, true);
    }

    return updatedUser;
  },

  logout(): void {
    try {
      AdminApiService.setToken(null);
    } catch {
      // ignore
    }
    this.setCurrentUser(null);
  },

  // Backward compatibility alias for single-user profile getter
  getProfile(): UserProfile {
    const current = this.getCurrentUser();
    return current || INITIAL_USERS[0];
  },

  saveProfile(profile: UserProfile): void {
    if (profile.id) {
      this.updateProfile(profile.id, profile);
    }
  },

  // ==========================================
  // USER-SCOPED PROGRESS (MULTI-USER ISOLATION)
  // ==========================================
  getProgressStorageKey(userId?: string): string {
    const uId = userId || this.getCurrentUser()?.id || 'usr_an_nguyen';
    return `vccs_user_progress_${uId}`;
  },

  getUserProgress(userId?: string): UserProgressData {
    const key = this.getProgressStorageKey(userId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);

      // Default sample progress for seed users
      const currentId = userId || this.getCurrentUser()?.id;
      if (currentId === 'usr_an_nguyen') {
        const sampleData: UserProgressData = {
          completedLessonIds: ['lesson-1', 'lesson-2'],
          completedScenarios: {
            'scenario-1': { selectedOptionId: 'sc1-opt-c', timestamp: Date.now() - 86400000 * 2, score: 40 }
          },
          quizHistory: [
            {
              id: 'res-sample-1',
              quizId: 'topic-culture',
              quizTitle: 'Văn hóa, Kỷ luật & Tác phong Công sở',
              score: 5,
              totalQuestions: 5,
              percentage: 100,
              passed: true,
              timestamp: Date.now() - 86400000 * 3,
              userAnswers: { 'q-1': 2, 'q-2': 1, 'q-3': 2, 'q-4': 1, 'q-5': 2 }
            }
          ],
          points: 190,
          unlockedBadges: ['badge-starter', 'badge-perfect'],
          recentActivities: [
            {
              id: 'act-1',
              type: 'quiz',
              title: 'Đạt điểm tối đa Bài thi Văn hóa, Kỷ luật & Tác phong',
              timestamp: Date.now() - 86400000 * 3,
              pointsEarned: 100
            },
            {
              id: 'act-2',
              type: 'scenario',
              title: 'Thực hành giải quyết: Đồng nghiệp trễ hạn dự án',
              timestamp: Date.now() - 86400000 * 2,
              pointsEarned: 40
            },
            {
              id: 'act-3',
              type: 'lesson',
              title: 'Hoàn thành bài học: Tính tự chịu trách nhiệm (Accountability)',
              timestamp: Date.now() - 86400000 * 1,
              pointsEarned: 50
            }
          ]
        };
        localStorage.setItem(key, JSON.stringify(sampleData));
        return sampleData;
      }

      // Mai Phuong progress
      if (currentId === 'usr_mai_phuong') {
        const sampleData: UserProgressData = {
          completedLessonIds: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5', 'lesson-6'],
          completedScenarios: {
            'scenario-1': { selectedOptionId: 'sc1-opt-c', timestamp: Date.now() - 86400000 * 5, score: 40 },
            'scenario-3': { selectedOptionId: 'sc3-opt-b', timestamp: Date.now() - 86400000 * 4, score: 40 }
          },
          quizHistory: [
            {
              id: 'res-mp-1',
              quizId: 'topic-interpersonal',
              quizTitle: 'Giao tiếp Cấp trên, Đồng nghiệp & Lắng nghe',
              score: 5,
              totalQuestions: 5,
              percentage: 100,
              passed: true,
              timestamp: Date.now() - 86400000 * 4,
              userAnswers: { 'q-6': 1, 'q-7': 2, 'q-8': 1, 'q-9': 1, 'q-10': 1 }
            }
          ],
          points: 420,
          unlockedBadges: ['badge-starter', 'badge-communicator', 'badge-perfect'],
          recentActivities: [
            {
              id: 'act-mp-1',
              type: 'lesson',
              title: 'Hoàn thành bài học: Giao tiếp với khách hàng và đối tác',
              timestamp: Date.now() - 86400000 * 2,
              pointsEarned: 50
            }
          ]
        };
        localStorage.setItem(key, JSON.stringify(sampleData));
        return sampleData;
      }

      // Default blank progress for newly created users
      const emptyData: UserProgressData = {
        completedLessonIds: [],
        completedScenarios: {},
        quizHistory: [],
        points: 0,
        unlockedBadges: [],
        recentActivities: []
      };
      localStorage.setItem(key, JSON.stringify(emptyData));
      return emptyData;
    } catch {
      return {
        completedLessonIds: [],
        completedScenarios: {},
        quizHistory: [],
        points: 0,
        unlockedBadges: [],
        recentActivities: []
      };
    }
  },

  saveUserProgress(userId: string, data: Partial<UserProgressData>): void {
    const current = this.getUserProgress(userId);
    const updated = { ...current, ...data };
    localStorage.setItem(`vccs_user_progress_${userId}`, JSON.stringify(updated));
  },

  // Scoped getters
  getCompletedLessons(userId?: string): string[] {
    return this.getUserProgress(userId).completedLessonIds;
  },

  getCompletedScenarios(userId?: string): Record<string, { selectedOptionId: string; timestamp: number; score: number }> {
    return this.getUserProgress(userId).completedScenarios;
  },

  getQuizHistory(userId?: string): QuizResult[] {
    return this.getUserProgress(userId).quizHistory;
  },

  getPoints(userId?: string): number {
    return this.getUserProgress(userId).points;
  },

  getUnlockedBadges(userId?: string): string[] {
    return this.getUserProgress(userId).unlockedBadges;
  },

  getRecentActivities(userId?: string): RecentActivity[] {
    return this.getUserProgress(userId).recentActivities;
  },

  toggleCompleteLesson(lessonId: string, userId?: string): { completed: boolean; pointsEarned: number } {
    const uId = userId || this.getCurrentUser()?.id;
    if (!uId) return { completed: false, pointsEarned: 0 };

    const progress = this.getUserProgress(uId);
    const isCompleted = progress.completedLessonIds.includes(lessonId);
    let pointsEarned = 0;

    let updatedLessons: string[];
    let newPoints = progress.points;

    if (isCompleted) {
      updatedLessons = progress.completedLessonIds.filter((id) => id !== lessonId);
    } else {
      updatedLessons = [...progress.completedLessonIds, lessonId];
      pointsEarned = 50;
      newPoints += pointsEarned;
    }

    const lesson = this.getLessons().find((l) => l.id === lessonId);
    const updatedActivities = isCompleted
      ? progress.recentActivities
      : [
          {
            id: 'act-' + Date.now(),
            type: 'lesson' as const,
            title: `Đã hoàn thành bài học: ${lesson?.title || lessonId}`,
            timestamp: Date.now(),
            pointsEarned: 50
          },
          ...progress.recentActivities
        ].slice(0, 15);

    this.saveUserProgress(uId, {
      completedLessonIds: updatedLessons,
      points: newPoints,
      recentActivities: updatedActivities
    });

    this.evaluateBadges(uId);
    return { completed: !isCompleted, pointsEarned };
  },

  saveCompletedScenario(scenarioId: string, optionId: string, score: number, userId?: string): void {
    const uId = userId || this.getCurrentUser()?.id;
    if (!uId) return;

    const progress = this.getUserProgress(uId);
    const isFirstTime = !progress.completedScenarios[scenarioId];

    const updatedScenarios = {
      ...progress.completedScenarios,
      [scenarioId]: { selectedOptionId: optionId, timestamp: Date.now(), score }
    };

    let newPoints = progress.points;
    let updatedActivities = progress.recentActivities;

    if (isFirstTime) {
      newPoints += score;
      const scenario = this.getScenarios().find((s) => s.id === scenarioId);
      updatedActivities = [
        {
          id: 'act-' + Date.now(),
          type: 'scenario' as const,
          title: `Hoàn thành thực hành: ${scenario?.title || scenarioId}`,
          timestamp: Date.now(),
          pointsEarned: score
        },
        ...progress.recentActivities
      ].slice(0, 15);
    }

    this.saveUserProgress(uId, {
      completedScenarios: updatedScenarios,
      points: newPoints,
      recentActivities: updatedActivities
    });

    this.evaluateBadges(uId);
  },

  saveQuizResult(result: QuizResult, userId?: string): number {
    const uId = userId || this.getCurrentUser()?.id;
    if (!uId) return 0;

    const progress = this.getUserProgress(uId);
    const updatedHistory = [result, ...progress.quizHistory];

    let pointsEarned = result.score * 15;
    if (result.percentage === 100) pointsEarned += 25;

    const newPoints = progress.points + pointsEarned;
    const updatedActivities = [
      {
        id: 'act-' + Date.now(),
        type: 'quiz' as const,
        title: `Làm bài kiểm tra: ${result.quizTitle} (${result.score}/${result.totalQuestions})`,
        timestamp: Date.now(),
        pointsEarned
      },
      ...progress.recentActivities
    ].slice(0, 15);

    this.saveUserProgress(uId, {
      quizHistory: updatedHistory,
      points: newPoints,
      recentActivities: updatedActivities
    });

    this.evaluateBadges(uId);
    return pointsEarned;
  },

  evaluateBadges(userId?: string): string[] {
    const uId = userId || this.getCurrentUser()?.id;
    if (!uId) return [];

    const progress = this.getUserProgress(uId);
    const completedLessons = progress.completedLessonIds;
    const completedScenarios = Object.keys(progress.completedScenarios);
    const quizHistory = progress.quizHistory;
    const points = progress.points;

    const newUnlocked = new Set<string>(progress.unlockedBadges);

    // badge-starter: 1+ lesson
    if (completedLessons.length >= 1) newUnlocked.add('badge-starter');

    // badge-communicator: 4+ lessons and 3+ scenarios
    if (completedLessons.length >= 4 && completedScenarios.length >= 3) {
      newUnlocked.add('badge-communicator');
    }

    // badge-champion: all lessons
    const totalLessons = this.getLessons().length;
    if (completedLessons.length >= totalLessons && totalLessons > 0) {
      newUnlocked.add('badge-champion');
    }

    // badge-solver: 5+ scenarios
    if (completedScenarios.length >= 5) newUnlocked.add('badge-solver');

    // badge-perfect: 100% quiz
    if (quizHistory.some((q) => q.percentage === 100)) newUnlocked.add('badge-perfect');

    // badge-scholar: 500+ XP
    if (points >= 500) newUnlocked.add('badge-scholar');

    const badgeArray = Array.from(newUnlocked);
    this.saveUserProgress(uId, { unlockedBadges: badgeArray });
    return badgeArray;
  },

  // ==========================================
  // SHARED COURSE CONTENT (LESSONS, SCENARIOS, QUIZZES)
  // ==========================================
  getLessons(): Lesson[] {
    try {
      const data = localStorage.getItem(KEYS.LESSONS);
      return data ? JSON.parse(data) : INITIAL_LESSONS;
    } catch {
      return INITIAL_LESSONS;
    }
  },

  saveLessons(lessons: Lesson[]): void {
    localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
  },

  getScenarios(): Scenario[] {
    try {
      const data = localStorage.getItem(KEYS.SCENARIOS);
      return data ? JSON.parse(data) : INITIAL_SCENARIOS;
    } catch {
      return INITIAL_SCENARIOS;
    }
  },

  saveScenarios(scenarios: Scenario[]): void {
    localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios));
  },

  getQuizQuestions(): QuizQuestion[] {
    try {
      const data = localStorage.getItem(KEYS.QUIZ_QUESTIONS);
      return data ? JSON.parse(data) : INITIAL_QUIZ_QUESTIONS;
    } catch {
      return INITIAL_QUIZ_QUESTIONS;
    }
  },

  saveQuizQuestions(questions: QuizQuestion[]): void {
    localStorage.setItem(KEYS.QUIZ_QUESTIONS, JSON.stringify(questions));
  },

  // ==========================================
  // CHATBOT & FEEDBACK
  // ==========================================
  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(KEYS.CHAT_MESSAGES);
      if (data) return JSON.parse(data);
      return [
        {
          id: 'msg-welcome',
          sender: 'assistant',
          text: 'Xin chào bạn! Tôi là Trợ lý AI Cố vấn Văn hóa & Giao tiếp Công sở. Bạn có thể hỏi tôi về cách ứng xử với cấp trên, đồng nghiệp, khách hàng, mẫu email chuẩn hoặc cách xử lý các tình huống khó khăn trong công việc.',
          timestamp: Date.now()
        }
      ];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: ChatMessage[]): void {
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  getChatFeedback(): ChatFeedback[] {
    try {
      const data = localStorage.getItem(KEYS.CHAT_FEEDBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChatFeedback(feedback: ChatFeedback): void {
    const list = this.getChatFeedback();
    const updated = [feedback, ...list];
    localStorage.setItem(KEYS.CHAT_FEEDBACK, JSON.stringify(updated));
  },

  // Reset demo data for current user only
  resetCurrentUserData(userId?: string): void {
    const uId = userId || this.getCurrentUser()?.id;
    if (uId) {
      localStorage.removeItem(`vccs_user_progress_${uId}`);
    }
  },

  // Reset everything back to factory demo
  resetAllDemoData(): void {
    localStorage.clear();
    sessionStorage?.clear();
  }
};
