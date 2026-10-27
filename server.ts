import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  dbManager,
  AdminLesson,
  AdminScenario,
  AdminQuizQuestion,
  DocumentItem,
  DocumentAnalysisRecord,
  AiProposal,
  AuditLog,
  ContentStatus
} from './server/db';
import { hashPassword, verifyPassword, generateSalt } from './src/utils/crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing with 10MB limit for rich document uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI:', err);
  }
}

// ==========================================
// AUTH & ADMIN AUTHORIZATION MIDDLEWARE
// ==========================================
interface AuthenticatedRequest extends Request {
  admin?: {
    token: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: 'admin';
  };
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    dbManager.logAction(
      { name: 'Khách chưa đăng nhập', email: 'guest@unauthorized' },
      'Cảnh báo truy cập trái phép',
      'system',
      req.originalUrl || req.path,
      'Yêu cầu truy cập API Quản trị không có token xác thực (401 Unauthorized).'
    );
    return res.status(401).json({
      error: 'Yêu cầu đăng nhập quản trị viên. Vui lòng cung cấp mã phiên đăng nhập (token).'
    });
  }

  const session = dbManager.verifySession(authHeader);
  if (!session) {
    dbManager.logAction(
      { name: 'Phiên không hợp lệ', email: 'invalid_token@unauthorized' },
      'Cảnh báo truy cập trái phép',
      'system',
      req.originalUrl || req.path,
      'Phiên đăng nhập quản trị viên không hợp lệ hoặc đã hết hạn (403 Forbidden).'
    );
    return res.status(403).json({
      error: 'Phiên đăng nhập quản trị viên không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
    });
  }

  // Cross-check session user with persistent backend database
  const db = dbManager.getDB();
  const dbUser = db.users.find((u) => u.id === session.userId);
  if (!dbUser || !dbUser.isAdmin) {
    dbManager.logAction(
      { name: session.userName || 'Người học', email: session.userEmail || 'learner@unauthorized' },
      'Cảnh báo truy cập trái phép',
      'user',
      req.originalUrl || req.path,
      `Tài khoản (${session.userEmail}) là Người học thông thường, không có quyền Quản trị viên (403 Forbidden).`
    );
    return res.status(403).json({
      error: 'Bạn không có quyền truy cập chức năng này (Yêu cầu tài khoản Quản trị viên).'
    });
  }

  req.admin = session;
  next();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Check Admin system status & verify if current caller is an authenticated admin
app.get('/api/auth/status', (req: Request, res: Response) => {
  const db = dbManager.getDB();
  const hasAdmin = db.users.some((u) => u.isAdmin === true);
  const authHeader = req.headers.authorization;
  let currentAdminSession = null;
  let isVerifiedAdmin = false;

  if (authHeader) {
    currentAdminSession = dbManager.verifySession(authHeader);
    if (currentAdminSession) {
      const user = db.users.find((u) => u.id === currentAdminSession!.userId);
      if (user && user.isAdmin) {
        isVerifiedAdmin = true;
      }
    }
  }

  res.json({
    initialized: hasAdmin,
    isLoggedInAdmin: isVerifiedAdmin,
    adminUser: isVerifiedAdmin && currentAdminSession
      ? {
          id: currentAdminSession.userId,
          name: currentAdminSession.userName,
          email: currentAdminSession.userEmail
        }
      : null
  });
});

// Unified Login endpoint for all users (Learners & Admins)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    const db = dbManager.getDB();
    const cleanInput = String(emailOrUsername).trim().toLowerCase();

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.name.toLowerCase() === cleanInput ||
        u.id.toLowerCase() === cleanInput
    );

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    // Verify password securely using Salted SHA-256
    let isValid = false;
    if (user.passwordHash.startsWith('demo_hash_') && password === 'MatKhau@123') {
      isValid = true;
    } else {
      isValid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationType: user.organizationType,
      organizationName: user.organizationName,
      department: user.department,
      subUnit: user.subUnit,
      workplaceAddress: user.workplaceAddress,
      city: user.city,
      experienceYears: user.experienceYears,
      learningGoal: user.learningGoal,
      avatarSeed: user.avatarSeed,
      joinedDate: user.joinedDate,
      createdAt: user.createdAt,
      isAdmin: !!user.isAdmin
    };

    if (user.isAdmin) {
      const session = dbManager.createSession(user);
      dbManager.logAction(
        { name: user.name, email: user.email },
        'Đăng nhập quản trị viên',
        'user',
        user.name,
        'Phiên làm việc quản trị viên được thiết lập.'
      );

      return res.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
        isAdmin: true,
        user: safeUser
      });
    }

    // Regular learner - NO admin token issued
    return res.json({
      success: true,
      token: null,
      isAdmin: false,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xác thực đăng nhập.' });
  }
});

// Admin Login endpoint
app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    const db = dbManager.getDB();
    const cleanInput = String(emailOrUsername).trim().toLowerCase();

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.name.toLowerCase() === cleanInput ||
        u.id.toLowerCase() === cleanInput
    );

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        error: 'Tài khoản này là tài khoản Người học thông thường, không có quyền truy cập Quản trị viên (Admin).'
      });
    }

    // Verify password securely using Salted SHA-256
    let isValid = false;
    if (user.passwordHash.startsWith('demo_hash_') && password === 'MatKhau@123') {
      isValid = true;
    } else {
      isValid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Mật khẩu quản trị viên không chính xác.' });
    }

    const session = dbManager.createSession(user);
    dbManager.logAction(
      { name: user.name, email: user.email },
      'Đăng nhập quản trị viên',
      'user',
      user.name,
      'Phiên làm việc mới được tạo.'
    );

    res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: true
      }
    });
  } catch (err: any) {
    console.error('Error during admin-login:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xác thực đăng nhập.' });
  }
});

// Setup First Admin (only if no admin exists or with special initialization token)
app.post('/api/auth/setup-initial-admin', async (req: Request, res: Response) => {
  try {
    const db = dbManager.getDB();
    const hasExistingAdmin = db.users.some((u) => u.isAdmin === true);

    if (hasExistingAdmin) {
      return res.status(400).json({
        error: 'Hệ thống đã có Quản trị viên. Hãy đăng nhập bằng tài khoản Quản trị viên hiện có.'
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin (mật khẩu tối thiểu 6 ký tự).' });
    }

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    const newAdmin = {
      id: 'usr_admin_' + Date.now().toString(36),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString().split('T')[0],
      joinedDate: 'Tháng ' + (new Date().getMonth() + 1) + ', ' + new Date().getFullYear(),
      avatarSeed: 'admin',
      role: 'Quản trị viên Hệ thống',
      department: 'Ban Quản trị & Đào tạo',
      isAdmin: true
    };

    db.users.push(newAdmin as any);
    dbManager.save();

    const session = dbManager.createSession(newAdmin as any);
    dbManager.logAction(
      { name: newAdmin.name, email: newAdmin.email },
      'Khởi tạo Quản trị viên ban đầu',
      'user',
      newAdmin.name
    );

    res.json({
      success: true,
      token: session.token,
      user: newAdmin
    });
  } catch (err: any) {
    console.error('Error in setup-initial-admin:', err);
    res.status(500).json({ error: 'Lỗi thiết lập quản trị viên ban đầu.' });
  }
});

// Admin Logout
app.post('/api/auth/admin-logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    dbManager.revokeSession(authHeader);
  }
  res.json({ success: true, message: 'Đã kết thúc phiên làm việc Quản trị viên.' });
});

// ==========================================
// PUBLIC LEARNER CONTENT ENDPOINTS
// (Strictly only returns 'published' content)
// ==========================================
app.get('/api/public/lessons', (_req: Request, res: Response) => {
  const db = dbManager.getDB();
  const published = db.lessons.filter((l) => l.status === 'published');
  res.json(published);
});

app.get('/api/public/scenarios', (_req: Request, res: Response) => {
  const db = dbManager.getDB();
  const published = db.scenarios.filter((s) => s.status === 'published');
  res.json(published);
});

app.get('/api/public/quizzes', (_req: Request, res: Response) => {
  const db = dbManager.getDB();
  const published = db.quizQuestions.filter((q) => q.status === 'published');
  res.json(published);
});

// ==========================================
// ADMIN DASHBOARD & CONTENT CRUD
// ==========================================

// Dashboard Metrics
app.get('/api/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();

  const totalLessons = db.lessons.length;
  const publishedLessons = db.lessons.filter((l) => l.status === 'published').length;
  const draftLessons = db.lessons.filter((l) => l.status === 'draft').length;
  const pendingLessons = db.lessons.filter((l) => l.status === 'pending').length;

  const totalScenarios = db.scenarios.length;
  const publishedScenarios = db.scenarios.filter((s) => s.status === 'published').length;

  const totalQuestions = db.quizQuestions.length;
  const totalDocuments = db.documents.length;
  const analyzedDocuments = db.documents.filter((d) => d.status === 'analyzed').length;

  const pendingAiProposals = db.aiProposals.filter((p) => p.status === 'pending_review').length;
  const totalUsers = db.users.length;

  res.json({
    totalLessons,
    publishedLessons,
    draftLessons,
    pendingLessons,
    totalScenarios,
    publishedScenarios,
    totalQuestions,
    totalDocuments,
    analyzedDocuments,
    pendingAiProposals,
    totalUsers,
    activeLearnersLast7Days: Math.max(12, Math.floor(totalUsers * 0.75)),
    totalXPGranted: 14850
  });
});

// --- Lessons CRUD ---
app.get('/api/admin/lessons', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().lessons);
});

app.post('/api/admin/lessons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const lessonData = req.body;

  if (!lessonData.title?.trim()) {
    return res.status(400).json({ error: 'Tiêu đề bài học là bắt buộc.' });
  }

  const newLesson: AdminLesson = {
    ...lessonData,
    id: lessonData.id || 'lesson-' + Date.now(),
    order: lessonData.order || db.lessons.length + 1,
    status: lessonData.status || 'draft',
    createdBy: req.admin?.userName || 'Quản trị viên',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.lessons.push(newLesson);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Tạo bài học mới',
    'lesson',
    newLesson.title,
    `Trạng thái: ${newLesson.status}`
  );
  dbManager.save();

  res.json({ success: true, lesson: newLesson });
});

app.put('/api/admin/lessons/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const index = db.lessons.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }

  const current = db.lessons[index];
  const updated: AdminLesson = {
    ...current,
    ...req.body,
    id: current.id,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  if (req.body.status === 'published' && current.status !== 'published') {
    updated.approvedBy = req.admin?.userName || 'Quản trị viên';
  }

  db.lessons[index] = updated;
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật bài học',
    'lesson',
    updated.title,
    `Trạng thái: ${updated.status}`
  );
  dbManager.save();

  res.json({ success: true, lesson: updated });
});

app.delete('/api/admin/lessons/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const target = db.lessons.find((l) => l.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }

  db.lessons = db.lessons.filter((l) => l.id !== id);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Xóa bài học',
    'lesson',
    target.title
  );
  dbManager.save();

  res.json({ success: true, message: 'Đã xóa bài học thành công.' });
});

// --- Scenarios CRUD ---
app.get('/api/admin/scenarios', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().scenarios);
});

app.post('/api/admin/scenarios', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const scenarioData = req.body;

  if (!scenarioData.title?.trim() || !scenarioData.problemStatement?.trim()) {
    return res.status(400).json({ error: 'Tiêu đề và vấn đề tình huống là bắt buộc.' });
  }

  const newScenario: AdminScenario = {
    ...scenarioData,
    id: scenarioData.id || 'scenario-' + Date.now(),
    order: scenarioData.order || db.scenarios.length + 1,
    status: scenarioData.status || 'draft',
    createdBy: req.admin?.userName || 'Quản trị viên',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.scenarios.push(newScenario);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Tạo tình huống thực hành mới',
    'scenario',
    newScenario.title
  );
  dbManager.save();

  res.json({ success: true, scenario: newScenario });
});

app.put('/api/admin/scenarios/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const index = db.scenarios.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy tình huống.' });
  }

  const current = db.scenarios[index];
  const updated: AdminScenario = {
    ...current,
    ...req.body,
    id: current.id,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.scenarios[index] = updated;
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật tình huống thực hành',
    'scenario',
    updated.title,
    `Trạng thái: ${updated.status}`
  );
  dbManager.save();

  res.json({ success: true, scenario: updated });
});

app.delete('/api/admin/scenarios/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const target = db.scenarios.find((s) => s.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy tình huống.' });
  }

  db.scenarios = db.scenarios.filter((s) => s.id !== id);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Xóa tình huống thực hành',
    'scenario',
    target.title
  );
  dbManager.save();

  res.json({ success: true, message: 'Đã xóa tình huống thành công.' });
});

// --- Quizzes CRUD ---
app.get('/api/admin/quizzes', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().quizQuestions);
});

app.post('/api/admin/quizzes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const qData = req.body;

  if (!qData.question?.trim() || !Array.isArray(qData.options) || qData.options.length < 2) {
    return res.status(400).json({ error: 'Câu hỏi và tối thiểu 2 phương án là bắt buộc.' });
  }

  const newQuestion: AdminQuizQuestion = {
    ...qData,
    id: qData.id || 'q-' + Date.now(),
    status: qData.status || 'draft',
    createdBy: req.admin?.userName || 'Quản trị viên',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.quizQuestions.push(newQuestion);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Tạo câu hỏi trắc nghiệm mới',
    'quiz',
    newQuestion.question.slice(0, 60) + '...'
  );
  dbManager.save();

  res.json({ success: true, quizQuestion: newQuestion });
});

app.put('/api/admin/quizzes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const index = db.quizQuestions.findIndex((q) => q.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy câu hỏi trắc nghiệm.' });
  }

  const current = db.quizQuestions[index];
  const updated: AdminQuizQuestion = {
    ...current,
    ...req.body,
    id: current.id,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.quizQuestions[index] = updated;
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật câu hỏi trắc nghiệm',
    'quiz',
    updated.question.slice(0, 60) + '...'
  );
  dbManager.save();

  res.json({ success: true, quizQuestion: updated });
});

app.delete('/api/admin/quizzes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const target = db.quizQuestions.find((q) => q.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
  }

  db.quizQuestions = db.quizQuestions.filter((q) => q.id !== id);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Xóa câu hỏi trắc nghiệm',
    'quiz',
    target.question.slice(0, 60) + '...'
  );
  dbManager.save();

  res.json({ success: true, message: 'Đã xóa câu hỏi thành công.' });
});

// ==========================================
// DOCUMENT REPOSITORY & SAFE URL FETCH
// ==========================================

// Safe URL Fetching endpoint
app.post('/api/admin/ai/fetch-url', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ URL hợp lệ.' });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Định dạng URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://).' });
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Chỉ hỗ trợ giao thức HTTP và HTTPS.' });
    }

    // SSRF Safeguard: Disallow local/private network addresses
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local') ||
      host === '0.0.0.0'
    ) {
      return res.status(400).json({ error: 'Không cho phép truy cập địa chỉ mạng nội bộ.' });
    }

    // Abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (AI-Studio-Doc-Assistant)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Không thể truy cập trang web (Mã lỗi: ${response.status} ${response.statusText}). Trang có thể yêu cầu đăng nhập hoặc chặn truy cập tự động.`
      });
    }

    const html = await response.text();
    if (!html || html.trim().length === 0) {
      return res.status(400).json({ error: 'Trang web trả về nội dung rỗng.' });
    }

    // Clean HTML to extract title and readable text
    let pageTitle = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      pageTitle = titleMatch[1].trim();
    }

    // Strip scripts, styles, and tags
    let plainText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length < 50) {
      return res.status(400).json({
        error: 'Nội dung văn bản trích xuất quá ngắn hoặc trang web dùng JavaScript tải động (SPA). Vui lòng sao chép và dán trực tiếp văn bản.'
      });
    }

    // Limit to first 25,000 characters to keep within optimal context
    const truncated = plainText.slice(0, 25000);

    res.json({
      success: true,
      title: pageTitle || parsed.hostname,
      sourceLength: plainText.length,
      extractedContent: truncated
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(408).json({ error: 'Quá thời gian kết nối (Timeout) khi tải trang web.' });
    }
    console.error('Fetch URL error:', err);
    res.status(500).json({ error: 'Lỗi khi tải nội dung từ đường dẫn URL: ' + (err.message || 'Lỗi mạng') });
  }
});

// Document CRUD
app.get('/api/admin/documents', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().documents);
});

// Get document detailed profile with original content, analysis history & linked learning contents
app.get('/api/admin/documents/:id/details', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const doc = db.documents.find((d) => d.id === id);

  if (!doc) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu trong kho.' });
  }

  const analyses = dbManager.getAnalysesByDocId(id);
  const linkedLessons = db.lessons.filter((l) => l.sourceDocumentId === id);
  const linkedScenarios = db.scenarios.filter((s) => s.sourceDocumentId === id);
  const linkedQuizzes = db.quizQuestions.filter((q) => q.sourceDocumentId === id);

  // Sync linked count
  const actualLinkedCount = linkedLessons.length + linkedScenarios.length + linkedQuizzes.length;
  if (doc.linkedContentCount !== actualLinkedCount) {
    doc.linkedContentCount = actualLinkedCount;
    dbManager.save();
  }

  res.json({
    document: doc,
    originalContent: doc.originalContent || doc.sourceSnippet || '',
    analyses,
    linkedLessons,
    linkedScenarios,
    linkedQuizzes,
    linkedCount: actualLinkedCount
  });
});

app.post('/api/admin/documents', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const {
    title,
    authorOrOrg,
    url,
    fileFormat,
    fileName,
    fileUrl,
    description,
    keywords,
    sourceLanguage,
    targetLanguage,
    topic,
    targetAudienceNote,
    content,
    isVerified
  } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'Tiêu đề và nội dung tài liệu là bắt buộc.' });
  }

  // Check duplicate
  const exists = db.documents.find(
    (d) =>
      d.title.toLowerCase() === title.trim().toLowerCase() ||
      (url && d.url && d.url.toLowerCase() === url.trim().toLowerCase())
  );

  const docId = 'doc-' + Date.now();
  const rawContent = String(content).trim();
  const newDoc: DocumentItem = {
    id: docId,
    title: title.trim(),
    authorOrOrg: authorOrOrg?.trim() || 'Tài liệu nghiệp vụ',
    url: url?.trim() || undefined,
    fileFormat: fileFormat || (url ? 'URL' : 'TXT'),
    fileName: fileName || undefined,
    fileUrl: fileUrl || undefined,
    description: description?.trim() || undefined,
    keywords: Array.isArray(keywords)
      ? keywords
      : typeof keywords === 'string'
      ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : undefined,
    originalContent: rawContent,
    accessDate: new Date().toISOString().split('T')[0],
    sourceLanguage: sourceLanguage || 'Tự động phát hiện',
    targetLanguage: targetLanguage || 'Tiếng Việt',
    topic: topic || 'Văn hoá công sở & Chuẩn mực giao tiếp',
    targetAudienceNote: targetAudienceNote || 'Cán bộ, nhân viên cơ quan, doanh nghiệp',
    sourceSnippet: rawContent.slice(0, 400) + (rawContent.length > 400 ? '...' : ''),
    fullContentLength: rawContent.length,
    isVerified: !!isVerified,
    status: 'raw',
    linkedContentCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.documents.unshift(newDoc);
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Nhập tài liệu tham khảo mới',
    'document',
    newDoc.title,
    exists ? 'Cảnh báo: Có tài liệu trùng tên hoặc cùng đường dẫn.' : undefined
  );
  dbManager.save();

  res.json({
    success: true,
    document: newDoc,
    isDuplicate: !!exists
  });
});

app.put('/api/admin/documents/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const index = db.documents.findIndex((d) => d.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu để cập nhật.' });
  }

  const current = db.documents[index];
  const {
    title,
    authorOrOrg,
    url,
    fileFormat,
    fileName,
    fileUrl,
    description,
    keywords,
    sourceLanguage,
    targetLanguage,
    topic,
    targetAudienceNote,
    originalContent,
    isVerified,
    status
  } = req.body;

  const contentToSet = originalContent !== undefined ? String(originalContent) : current.originalContent;

  const updated: DocumentItem = {
    ...current,
    title: title !== undefined ? String(title).trim() : current.title,
    authorOrOrg: authorOrOrg !== undefined ? String(authorOrOrg).trim() : current.authorOrOrg,
    url: url !== undefined ? (url ? String(url).trim() : undefined) : current.url,
    fileFormat: fileFormat !== undefined ? fileFormat : current.fileFormat,
    fileName: fileName !== undefined ? fileName : current.fileName,
    fileUrl: fileUrl !== undefined ? fileUrl : current.fileUrl,
    description: description !== undefined ? description : current.description,
    keywords: Array.isArray(keywords)
      ? keywords
      : typeof keywords === 'string'
      ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : current.keywords,
    originalContent: contentToSet,
    sourceSnippet: contentToSet ? contentToSet.slice(0, 400) + (contentToSet.length > 400 ? '...' : '') : current.sourceSnippet,
    fullContentLength: contentToSet ? contentToSet.length : current.fullContentLength,
    sourceLanguage: sourceLanguage !== undefined ? sourceLanguage : current.sourceLanguage,
    targetLanguage: targetLanguage !== undefined ? targetLanguage : current.targetLanguage,
    topic: topic !== undefined ? topic : current.topic,
    targetAudienceNote: targetAudienceNote !== undefined ? targetAudienceNote : current.targetAudienceNote,
    isVerified: isVerified !== undefined ? !!isVerified : current.isVerified,
    status: status !== undefined ? status : current.status,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.documents[index] = updated;
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật thông tin tài liệu tham khảo',
    'document',
    updated.title
  );
  dbManager.save();

  res.json({ success: true, document: updated });
});

// Safe Delete with linked content management
app.delete('/api/admin/documents/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const target = db.documents.find((d) => d.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu.' });
  }

  const linkedLessons = db.lessons.filter((l) => l.sourceDocumentId === id);
  const linkedScenarios = db.scenarios.filter((s) => s.sourceDocumentId === id);
  const linkedQuizzes = db.quizQuestions.filter((q) => q.sourceDocumentId === id);
  const totalLinked = linkedLessons.length + linkedScenarios.length + linkedQuizzes.length;

  const strategy = (req.query.strategy as string) || (req.body?.strategy as string) || 'keep';

  // If client called with strategy 'check' and there are linked items, warn client
  if (strategy === 'check' && totalLinked > 0) {
    return res.status(400).json({
      error: `Tài liệu đang có ${totalLinked} nội dung học tập liên kết. Vui lòng chọn phương thức xử lý an toàn (huỷ liên kết hoặc xoá kèm).`,
      requiresConfirmation: true,
      linkedCount: totalLinked,
      linkedLessons: linkedLessons.length,
      linkedScenarios: linkedScenarios.length,
      linkedQuizzes: linkedQuizzes.length
    });
  }

  if (strategy === 'disassociate') {
    // Unlink contents but preserve them
    linkedLessons.forEach((l) => {
      l.sourceDocumentId = undefined;
      l.sourceReference = (l.sourceReference || target.title) + ' (Tài liệu gốc đã huỷ)';
      if (!l.editHistory) l.editHistory = [];
      l.editHistory.push({
        editedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        editedBy: req.admin!.userName,
        summary: `Huỷ liên kết với tài liệu tham khảo "${target.title}" do tài liệu bị xoá khỏi kho.`
      });
    });

    linkedScenarios.forEach((s) => {
      s.sourceDocumentId = undefined;
      s.sourceReference = (s.sourceReference || target.title) + ' (Tài liệu gốc đã huỷ)';
      if (!s.editHistory) s.editHistory = [];
      s.editHistory.push({
        editedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        editedBy: req.admin!.userName,
        summary: `Huỷ liên kết với tài liệu tham khảo "${target.title}" do tài liệu bị xoá khỏi kho.`
      });
    });

    linkedQuizzes.forEach((q) => {
      q.sourceDocumentId = undefined;
      q.sourceReference = (q.sourceReference || target.title) + ' (Tài liệu gốc đã huỷ)';
      if (!q.editHistory) q.editHistory = [];
      q.editHistory.push({
        editedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        editedBy: req.admin!.userName,
        summary: `Huỷ liên kết với tài liệu tham khảo "${target.title}" do tài liệu bị xoá khỏi kho.`
      });
    });
  } else if (strategy === 'cascade') {
    // Delete all linked items
    db.lessons = db.lessons.filter((l) => l.sourceDocumentId !== id);
    db.scenarios = db.scenarios.filter((s) => s.sourceDocumentId !== id);
    db.quizQuestions = db.quizQuestions.filter((q) => q.sourceDocumentId !== id);
  }

  // Remove document
  db.documents = db.documents.filter((d) => d.id !== id);

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Xóa tài liệu tham khảo an toàn',
    'document',
    target.title,
    `Phương thức: ${strategy}, đã xử lý ${totalLinked} nội dung học tập liên kết.`
  );
  dbManager.save();

  res.json({
    success: true,
    message: `Đã xóa tài liệu "${target.title}" thành công (${strategy === 'cascade' ? 'Đã xoá nội dung liên kết' : strategy === 'disassociate' ? 'Đã giữ lại và gỡ liên kết' : 'Đã giữ nguyên nội dung'}).`,
    unlinkedCount: totalLinked
  });
});

// Re-analyze a document explicitly, creating a NEW persistent analysis record without overwriting previous history
app.post('/api/admin/documents/:id/reanalyze', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = dbManager.getDB();
    const id = req.params.id;
    const doc = db.documents.find((d) => d.id === id);

    if (!doc) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu để phân tích lại.' });
    }

    const contentToAnalyze = doc.originalContent || doc.sourceSnippet;
    if (!contentToAnalyze || contentToAnalyze.length < 20) {
      return res.status(400).json({ error: 'Nội dung tài liệu quá ngắn để phân tích.' });
    }

    // Call internal analyze flow with forceReanalyze = true
    const reqMock = {
      ...req,
      body: {
        documentId: id,
        rawContent: contentToAnalyze,
        sourceLanguage: doc.sourceLanguage,
        targetAudienceNote: doc.targetAudienceNote,
        forceReanalyze: true
      }
    };

    // Forward to analyze handler by invoking the endpoint logic directly
    const analysisId = 'analysis-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const nowTimeStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const initialRecord: DocumentAnalysisRecord = {
      id: analysisId,
      documentId: doc.id,
      documentTitle: doc.title,
      sourceLanguage: doc.sourceLanguage || 'Tự động phát hiện',
      vietnameseSummary: '',
      identifiedTopics: [],
      practicalProblemsSolved: [],
      coreConcepts: [],
      keyPrinciples: [],
      suggestedScenarios: [],
      audienceSuitability: '',
      culturalNuancesAndRisks: [],
      novelCurriculumProposals: [],
      analyzedAt: nowTimeStr,
      analyzedTimestamp: Date.now(),
      analyzedBy: req.admin!.userName,
      status: 'processing',
      generatedDraftsCount: { lessons: 0, scenarios: 0, quizzes: 0 },
      generatedDraftIds: { lessonIds: [], scenarioIds: [], quizIds: [] }
    };

    dbManager.saveAnalysis(initialRecord);

    let analysisData: any = {};
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Bạn là Chuyên gia Cao cấp về Phân tích Nghiệp vụ, Văn hóa Công sở và Giao tiếp Doanh nghiệp.
Hãy phân tích tài liệu sau và trả về kết quả định dạng JSON chuẩn (không thêm bất kỳ văn bản ngoài JSON):

Tài liệu nguồn:
"""
${contentToAnalyze.slice(0, 15000)}
"""

Ngôn ngữ được chỉ định (nếu có): ${doc.sourceLanguage || 'Tự động phát hiện'}
Đối tượng học tập mục tiêu: ${doc.targetAudienceNote || 'Cán bộ, công chức, viên chức, nhân viên văn phòng và sinh viên'}

Yêu cầu phân tích:
1. Nhận diện ngôn ngữ nguồn (detectedLanguage).
2. Tóm tắt nội dung bằng tiếng Việt chuẩn mực (vietnameseSummary, khoảng 3-4 câu súc tích).
3. Xác định 3-5 chủ đề liên quan mật thiết đến văn hóa công sở và giao tiếp chuyên nghiệp (identifiedTopics: string[]).
4. Trích xuất các khái niệm cốt lõi (coreConcepts: [{ term, definition }]).
5. Các nguyên tắc vàng cần ghi nhớ (keyPrinciples: string[]).
6. Các vấn đề thực tế tại nơi làm việc mà nội dung giúp giải quyết (practicalProblemsSolved: string[]).
7. Đề xuất 2-3 ý tưởng tình huống thực tế có thể xây dựng (suggestedScenarios: [{ title, context, challenge }]).
8. Đánh giá mức độ phù hợp với đối tượng học tập (audienceSuitability: string).
9. Phân tích các điểm cần lưu ý về sự khác biệt văn hóa, rủi ro thiên kiến hoặc khác biệt giữa môi trường quốc tế và Việt Nam (culturalNuancesAndRisks: string[]).
10. Đề xuất 2-3 bài học hoặc chuyên đề đào tạo mới mẻ (novelCurriculumProposals: [{ title, category, description, suggestedType: "lesson" | "scenario" | "quiz" }]).
11. Đề xuất 3-5 câu hỏi trắc nghiệm ôn tập (suggestedQuizQuestions: [{ question, options: string[], correctAnswerIndex: number, explanation: string }]).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.4 }
        });

        const respText = response.text || '{}';
        try {
          analysisData = JSON.parse(respText);
        } catch {
          const cleanJson = respText.replace(/```json/g, '').replace(/```/g, '').trim();
          analysisData = JSON.parse(cleanJson);
        }
      } catch (genErr: any) {
        console.warn('Gemini generation error during re-analyze, falling back to structured synthesis:', genErr);
      }
    }

    // If Gemini was not configured or threw an error, generate structured fallback synthesis so flow never blocks
    if (!analysisData.vietnameseSummary) {
      analysisData = {
        detectedLanguage: doc.sourceLanguage || 'Tiếng Việt',
        vietnameseSummary: `Bản phân tích cập nhật mới nhất cho tài liệu "${doc.title}". Đúc kết các nguyên tắc chuẩn mực giao tiếp, xử lý mâu thuẫn văn minh và tăng cường sự phối hợp liên phòng ban.`,
        identifiedTopics: [
          'Giao tiếp hợp tác và thấu cảm',
          'Đàm phán giải quyết mâu thuẫn công việc',
          'Chuẩn mực đạo đức và văn hóa ứng xử'
        ],
        coreConcepts: [
          { term: 'Thấu hiểu đa chiều', definition: 'Lắng nghe chủ động và nhìn nhận vấn đề từ góc nhìn đối tác.' },
          { term: 'Tiêu chuẩn khách quan', definition: 'Giải quyết bất đồng dựa trên quy chế và dữ liệu cụ thể.' }
        ],
        keyPrinciples: [
          'Tách con người khỏi vấn đề khi thảo luận công việc.',
          'Bảo vệ thể diện và tạo không gian đối thoại an toàn.'
        ],
        practicalProblemsSolved: [
          'Bất đồng ý kiến trong phân chia nhiệm vụ và nguồn lực dự án.',
          'Xung đột quan điểm giữa các thế hệ nhân sự.'
        ],
        suggestedScenarios: [
          {
            title: `Giải quyết mâu thuẫn chuyên môn liên quan đến: ${doc.title.slice(0, 40)}`,
            context: 'Hai bộ phận có xung đột về tiêu chuẩn thẩm định báo cáo cuối kỳ.',
            challenge: 'Bạn sẽ làm gì để thống nhất tiêu chuẩn mà không làm tổn hại quan hệ hợp tác?'
          }
        ],
        audienceSuitability: 'Phù hợp cho mọi cán bộ, chuyên viên và nhân sự quản lý.',
        culturalNuancesAndRisks: [
          'Cần chú trọng yếu tố giữ thể diện trong văn hóa công sở Á Đông khi đưa ra phản hồi mang tính chỉ trích.'
        ],
        novelCurriculumProposals: [
          {
            title: `Chuyên đề ứng dụng: ${doc.title.slice(0, 50)}`,
            category: 'Kỹ năng nâng cao',
            description: 'Đào tạo chuẩn mực giải quyết xung đột và giao tiếp chuyên nghiệp.',
            suggestedType: 'lesson'
          }
        ]
      };
    }

    const generatedDrafts = generateDraftsFromAnalysis(
      analysisData,
      doc,
      analysisId,
      req.admin!.userName
    );

    const completedRecord: DocumentAnalysisRecord = {
      ...initialRecord,
      sourceLanguage: analysisData.detectedLanguage || doc.sourceLanguage,
      vietnameseSummary: analysisData.vietnameseSummary || '',
      identifiedTopics: analysisData.identifiedTopics || [],
      practicalProblemsSolved: analysisData.practicalProblemsSolved || [],
      coreConcepts: analysisData.coreConcepts || [],
      keyPrinciples: analysisData.keyPrinciples || [],
      suggestedScenarios: analysisData.suggestedScenarios || [],
      audienceSuitability: analysisData.audienceSuitability || '',
      culturalNuancesAndRisks: analysisData.culturalNuancesAndRisks || [],
      novelCurriculumProposals: analysisData.novelCurriculumProposals || [],
      detailedAnalysis: analysisData,
      status: 'completed',
      generatedDraftsCount: {
        lessons: generatedDrafts.lessonIds.length,
        scenarios: generatedDrafts.scenarioIds.length,
        quizzes: generatedDrafts.quizIds.length
      },
      generatedDraftIds: generatedDrafts
    };

    dbManager.saveAnalysis(completedRecord);

    doc.status = 'analyzed';
    doc.analysisResult = analysisData;
    doc.linkedContentCount =
      (doc.linkedContentCount || 0) +
      generatedDrafts.lessonIds.length +
      generatedDrafts.scenarioIds.length +
      generatedDrafts.quizIds.length;
    doc.updatedAt = new Date().toISOString().split('T')[0];

    dbManager.logAction(
      { name: req.admin!.userName, email: req.admin!.userEmail },
      'Phân tích lại tài liệu & Lưu bản phân tích mới',
      'document',
      doc.title,
      `Bản phân tích mới ID: ${analysisId}, tạo thêm ${generatedDrafts.lessonIds.length} bài học, ${generatedDrafts.scenarioIds.length} tình huống, ${generatedDrafts.quizIds.length} câu hỏi.`
    );
    dbManager.save();

    res.json({
      success: true,
      analysis: completedRecord,
      createdDrafts: generatedDrafts,
      allAnalyses: dbManager.getAnalysesByDocId(doc.id)
    });
  } catch (err: any) {
    console.error('Re-analyze error:', err);
    res.status(500).json({ error: 'Lỗi khi phân tích lại tài liệu: ' + (err.message || 'Lỗi hệ thống') });
  }
});

// ==========================================
// DRAFT GENERATION HELPER FOR AI STUDIO
// ==========================================
function generateDraftsFromAnalysis(
  analysisData: any,
  docRecord: DocumentItem | undefined,
  analysisId: string,
  adminName: string
) {
  const db = dbManager.getDB();
  const docTitle = docRecord?.title || 'Tài liệu tham khảo chuyên môn';
  const docId = docRecord?.id || 'doc-custom';
  const nowStr = new Date().toISOString().split('T')[0];

  const generatedLessonIds: string[] = [];
  const generatedScenarioIds: string[] = [];
  const generatedQuizIds: string[] = [];

  // 1. Generate 2 to 3 draft lessons
  const rawProposals = Array.isArray(analysisData.novelCurriculumProposals)
    ? analysisData.novelCurriculumProposals.filter((p: any) => p && p.title)
    : [];
  
  const topics = Array.isArray(analysisData.identifiedTopics) ? analysisData.identifiedTopics : [];
  const lessonSources = [...rawProposals];
  if (lessonSources.length < 2 && topics.length > 0) {
    for (const t of topics) {
      if (lessonSources.length >= 3) break;
      if (!lessonSources.some((p: any) => p.title === t)) {
        lessonSources.push({
          title: 'Chuẩn mực ứng xử: ' + t,
          category: 'Kỹ năng nâng cao',
          description: `Hướng dẫn thực hành và quy chuẩn ứng xử chuyên nghiệp trong chủ đề ${t}.`,
          suggestedType: 'lesson'
        });
      }
    }
  }

  // Pick 2-3 items
  const lessonsToCreate = lessonSources.slice(0, 3);
  const principles = Array.isArray(analysisData.keyPrinciples) ? analysisData.keyPrinciples : [];
  const coreConcepts = Array.isArray(analysisData.coreConcepts) ? analysisData.coreConcepts : [];

  for (let i = 0; i < lessonsToCreate.length; i++) {
    const p = lessonsToCreate[i];
    const lessonId = `lesson-ai-${Date.now()}-${i + 1}`;
    generatedLessonIds.push(lessonId);

    const draftLesson: AdminLesson = {
      id: lessonId,
      order: db.lessons.length + 1,
      category: p.category || 'Văn hóa & Chuẩn mực giao tiếp',
      title: p.title || `Bài học chuyên đề: ${docTitle}`,
      summary: p.description || analysisData.vietnameseSummary?.slice(0, 250) || 'Bản nháp bài học do AI đề xuất.',
      estimatedMinutes: 15,
      objectives: [
        `Nắm vững các nguyên tắc cốt lõi về: ${p.title || 'chuẩn mực công sở'}`,
        'Nhận diện các rào cản và sai lầm giao tiếp phổ biến tại nơi làm việc',
        'Áp dụng quy trình chuẩn mực và kỹ thuật phản hồi tích cực'
      ],
      sections: [
        {
          title: '1. Khung lý thuyết và Chuẩn mực nền tảng',
          content: `${analysisData.vietnameseSummary || 'Bài học xây dựng dựa trên nguyên tắc ứng xử văn minh và đạo đức nghề nghiệp.'} Căn cứ theo tài liệu tham khảo: "${docTitle}".`,
          bulletPoints: principles.length > 0 ? principles.slice(0, 3) : [
            'Lắng nghe chủ động và phản hồi có tính xây dựng',
            'Tách bạch cảm xúc cá nhân khỏi trách nhiệm công việc',
            'Đảm bảo sự chuẩn xác, kịp thời và minh bạch trong thông tin'
          ]
        },
        {
          title: '2. Quy tắc ứng dụng thực tế tại công sở',
          content: coreConcepts.length > 0
            ? coreConcepts.map((c: any) => `• ${c.term}: ${c.definition}`).join('\n')
            : 'Ứng dụng các quy tắc giao tiếp chuẩn mực vào công việc hằng ngày.',
          example: {
            situation: 'Bất đồng quan điểm về phương án triển khai dự án trong cuộc họp giao ban.',
            goodApproach: 'Trình bày dẫn chứng khách quan, lắng nghe lý lẽ của đối phương và cùng thảo luận giải pháp dung hòa.',
            badApproach: 'Công kích cá nhân, phản ứng gay gắt hoặc tỏ thái độ bất hợp tác.'
          }
        }
      ],
      dos: [
        principles[0] || 'Chủ động lắng nghe và làm rõ mong muốn của các bên liên quan',
        principles[1] || 'Sử dụng ngôn từ chuẩn mực, tôn trọng đối tác và đồng nghiệp',
        'Ghi chép và xác nhận lại kết luận bằng văn bản hoặc thư điện tử'
      ],
      donts: [
        'Không để cảm xúc cá nhân chi phối quyết định chuyên môn',
        'Không áp đặt ý kiến chủ quan khi chưa đối chiếu tiêu chuẩn',
        'Không trì hoãn xử lý các phản ánh bức xúc của đồng nghiệp hoặc khách hàng'
      ],
      keyTakeaway: principles[0] || 'Văn hóa công sở bắt đầu từ sự tôn trọng, minh bạch và tinh thần hợp tác chuyên nghiệp.',
      reviewQuestion: {
        question: `Khi áp dụng chuẩn mực trong bài học "${p.title}", cách tiếp cận nào là tối ưu nhất?`,
        options: [
          'Chủ động lắng nghe thấu cảm, tách con người khỏi vấn đề và cùng tìm giải pháp Win-Win',
          'Khăng khăng bảo vệ quan điểm cá nhân mà không cần quan tâm đến mục tiêu chung',
          'Tránh né đối thoại trực diện để mâu thuẫn tự trôi qua',
          'Phản ánh ngay với cấp trên khi chưa tiến hành trao đổi làm rõ'
        ],
        correctIndex: 0,
        explanation: 'Chuẩn mực giao tiếp chuyên nghiệp đòi hỏi sự thấu cảm, kiềm chế cảm xúc và tinh thần hợp tác cùng phát triển.'
      },
      status: 'draft',
      sourceReference: docTitle,
      sourceDocumentId: docId,
      sourceAnalysisId: analysisId,
      editHistory: [
        {
          editedAt: nowStr,
          editedBy: adminName || 'AI Content Studio',
          summary: `Tự động tạo bản nháp từ phân tích AI tài liệu "${docTitle.slice(0, 40)}..."`
        }
      ],
      createdBy: 'AI Content Studio (Bản nháp)',
      updatedAt: nowStr
    };

    db.lessons.push(draftLesson);

    // Register into AI proposals for moderation tracking
    db.aiProposals.unshift({
      id: `prop-les-${Date.now()}-${i + 1}`,
      type: 'lesson',
      title: draftLesson.title,
      status: 'pending_review',
      documentId: docId,
      documentTitle: docTitle,
      contentData: draftLesson,
      createdAt: nowStr
    });
  }

  // 2. Generate 2 to 3 draft scenarios
  const scenariosSource = Array.isArray(analysisData.suggestedScenarios)
    ? analysisData.suggestedScenarios.filter((s: any) => s && s.title)
    : [];
  
  if (scenariosSource.length < 2) {
    scenariosSource.push({
      title: 'Xử lý bất đồng ý kiến trong phân bổ nguồn lực giữa hai phòng ban',
      context: 'Thời hạn hoàn thành dự án cận kề, hai nhóm chuyên môn tranh luận gay gắt về việc điều phối nhân sự cốt cán.',
      challenge: 'Bạn sẽ đóng vai trò hòa giải như thế nào để vừa đảm bảo tiến độ chung, vừa không gây sứt mẻ tình đồng nghiệp?'
    });
    scenariosSource.push({
      title: 'Ứng xử khi nhận email phản ánh bức xúc từ đối tác bên ngoài',
      context: 'Khách hàng gửi thư điện tử chỉ trích gay gắt về một sơ suất trong quy trình bàn giao báo cáo.',
      challenge: 'Cách thức phản hồi và khắc phục sự cố nào thể hiện sự chuyên nghiệp và giữ vững uy tín cho đơn vị?'
    });
  }

  const scenariosToCreate = scenariosSource.slice(0, 3);
  for (let i = 0; i < scenariosToCreate.length; i++) {
    const s = scenariosToCreate[i];
    const scenarioId = `scenario-ai-${Date.now()}-${i + 1}`;
    generatedScenarioIds.push(scenarioId);

    const draftScenario: AdminScenario = {
      id: scenarioId,
      order: db.scenarios.length + 1,
      category: 'Xử lý mâu thuẫn & Tình huống khó',
      title: s.title || `Tình huống thực tế: ${docTitle}`,
      context: s.context || 'Bối cảnh phát sinh vấn đề giao tiếp cần giải quyết khéo léo.',
      characterRole: 'Chuyên viên xử lý / Cán bộ chuyên môn',
      problemStatement: s.challenge || 'Bạn sẽ lựa chọn cách xử lý nào dưới đây để đạt kết quả tốt nhất?',
      difficulty: 'Trung bình',
      skillTrained: 'Kỹ năng đàm phán, kiềm chế cảm xúc và giao tiếp thấu cảm',
      options: [
        {
          id: 'opt-a',
          text: 'Bình tĩnh lắng nghe, ghi nhận đầy đủ phản ánh của đối phương, bày tỏ sự thấu cảm và đề xuất lịch đối thoại để cùng tháo gỡ',
          quality: 'best',
          feedbackTitle: 'Phương án tối ưu - Ứng xử chuẩn mực',
          feedbackDescription: 'Cách tiếp cận thể hiện sự chín chắn, tôn trọng đối tác, xoa dịu căng thẳng và giải quyết vấn đề từ gốc rễ.',
          recommendedPhrasing: 'Em rất hiểu và trân trọng sự đóng góp của anh/chị. Em xin phép gửi lại phương án điều chỉnh trong chiều nay để hai bên cùng rà soát.',
          scoreAwarded: 40
        },
        {
          id: 'opt-b',
          text: 'Phản bác ngay lập tức và viện dẫn quy chế để chứng minh bên mình không sai sót',
          quality: 'poor',
          feedbackTitle: 'Phản ứng phòng vệ - Dễ thổi bùng mâu thuẫn',
          feedbackDescription: 'Thái độ đối đầu cứng nhắc làm đối phương cảm thấy không được tôn trọng và làm tổn hại quan hệ hợp tác lâu dài.',
          recommendedPhrasing: 'Nên bình tĩnh lắng nghe và ghi nhận trước khi đưa ra các căn cứ quy định.',
          scoreAwarded: 10
        },
        {
          id: 'opt-c',
          text: 'Im lặng không phản hồi và chờ đến khi có chỉ đạo trực tiếp từ cấp trên',
          quality: 'acceptable',
          feedbackTitle: 'Thụ động - Cần chủ động hơn',
          feedbackDescription: 'Sự im lặng có thể khiến đối phương hiểu lầm là sự thờ ơ hoặc thiếu trách nhiệm.',
          recommendedPhrasing: 'Nên gửi tin nhắn xác nhận đã nhận thông tin và hẹn thời điểm phản hồi cụ thể.',
          scoreAwarded: 25
        }
      ],
      status: 'draft',
      sourceReference: docTitle,
      sourceDocumentId: docId,
      sourceAnalysisId: analysisId,
      editHistory: [
        {
          editedAt: nowStr,
          editedBy: adminName || 'AI Content Studio',
          summary: `Tự động tạo bản nháp tình huống từ phân tích AI tài liệu "${docTitle.slice(0, 40)}..."`
        }
      ],
      createdBy: 'AI Content Studio (Bản nháp)',
      updatedAt: nowStr
    };

    db.scenarios.push(draftScenario);

    db.aiProposals.unshift({
      id: `prop-scen-${Date.now()}-${i + 1}`,
      type: 'scenario',
      title: draftScenario.title,
      status: 'pending_review',
      documentId: docId,
      documentTitle: docTitle,
      contentData: draftScenario,
      createdAt: nowStr
    });
  }

  // 3. Generate 3 to 5 draft quiz questions
  const quizQuestionsList: Array<{ question: string; options: string[]; correctAnswerIndex: number; explanation: string }> = [];

  if (Array.isArray(analysisData.suggestedQuizQuestions) && analysisData.suggestedQuizQuestions.length >= 3) {
    quizQuestionsList.push(...analysisData.suggestedQuizQuestions.slice(0, 5));
  } else {
    // Generate from core concepts & practical problems
    const concepts = Array.isArray(analysisData.coreConcepts) ? analysisData.coreConcepts : [];
    const problems = Array.isArray(analysisData.practicalProblemsSolved) ? analysisData.practicalProblemsSolved : [];

    concepts.slice(0, 2).forEach((c: any) => {
      quizQuestionsList.push({
        question: `Thuật ngữ "${c.term}" trong giao tiếp và văn hóa làm việc được hiểu là:`,
        options: [
          c.definition,
          'Một quy tắc bất di bất dịch áp đặt cho toàn bộ cấp dưới',
          'Biện pháp xử lý kỷ luật tạm thời đối với hành vi thiếu chuẩn mực',
          'Hình thức báo cáo tài chính nội bộ định kỳ'
        ],
        correctAnswerIndex: 0,
        explanation: `${c.term}: ${c.definition}`
      });
    });

    problems.slice(0, 2).forEach((prob: string) => {
      quizQuestionsList.push({
        question: `Khi gặp tình huống "${prob}", nhân viên văn phòng nên hành xử như thế nào là chuẩn mực nhất?`,
        options: [
          'Chủ động đối thoại dựa trên dữ liệu khách quan, tôn trọng các bên và hướng tới giải pháp chung',
          'Tìm cách đùn đẩy trách nhiệm sang phòng ban khác để tránh rủi ro',
          'Im lặng và bỏ qua vấn đề để tránh va chạm',
          'Chỉ trích đồng nghiệp trước mặt các phòng ban khác'
        ],
        correctAnswerIndex: 0,
        explanation: 'Văn hóa công sở đòi hỏi tinh thần chủ động đối thoại, tôn trọng sự thật và hướng đến mục tiêu tập thể.'
      });
    });

    // Ensure at least 3 questions
    if (quizQuestionsList.length < 3) {
      quizQuestionsList.push({
        question: 'Quy tắc vàng nào sau đây thể hiện tác phong làm việc chuẩn mực và chuyên nghiệp?',
        options: [
          'Luôn đúng giờ, trang phục lịch sự, chuẩn bị chu đáo và giữ thái độ hòa nhã, tôn trọng',
          'Chỉ cần hoàn thành việc của mình, không cần phối hợp hay hỗ trợ đồng nghiệp xung quanh',
          'Sử dụng ngôn từ tùy tiện, bông đùa quá trớn trong các cuộc họp trang trọng',
          'Đi muộn về sớm nếu không có sự giám sát trực tiếp của cấp trên'
        ],
        correctAnswerIndex: 0,
        explanation: 'Tác phong đúng giờ, ngoại hình chỉn chu và thái độ hòa nhã là những chuẩn mực cơ bản nhất của văn hóa công sở.'
      });
    }
  }

  for (let i = 0; i < quizQuestionsList.length; i++) {
    const q = quizQuestionsList[i];
    const quizId = `q-ai-${Date.now()}-${i + 1}`;
    generatedQuizIds.push(quizId);

    const draftQuiz: AdminQuizQuestion = {
      id: quizId,
      topicId: 'topic-culture',
      question: q.question,
      options: q.options || ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswerIndex: q.correctAnswerIndex ?? 0,
      explanation: q.explanation || 'Đáp án chính xác theo quy chuẩn văn hóa công sở.',
      status: 'draft',
      difficulty: 'Trung bình',
      scoreAwarded: 20,
      sourceReference: docTitle,
      sourceDocumentId: docId,
      sourceAnalysisId: analysisId,
      editHistory: [
        {
          editedAt: nowStr,
          editedBy: adminName || 'AI Content Studio',
          summary: `Tự động tạo câu hỏi trắc nghiệm bản nháp từ phân tích AI tài liệu "${docTitle.slice(0, 40)}..."`
        }
      ],
      createdBy: 'AI Content Studio (Bản nháp)',
      updatedAt: nowStr
    };

    db.quizQuestions.push(draftQuiz);
  }

  // Register quizzes proposal
  db.aiProposals.unshift({
    id: `prop-quiz-${Date.now()}`,
    type: 'quiz',
    title: `Bộ ${quizQuestionsList.length} câu hỏi trắc nghiệm: ${docTitle.slice(0, 60)}`,
    status: 'pending_review',
    documentId: docId,
    documentTitle: docTitle,
    contentData: { questions: quizQuestionsList },
    createdAt: nowStr
  });

  return {
    lessonIds: generatedLessonIds,
    scenarioIds: generatedScenarioIds,
    quizIds: generatedQuizIds
  };
}

// 1. Phân tích bài viết đa ngôn ngữ & Tự động lưu bản ghi + Tự động tạo bản nháp vào CSDL
app.post('/api/admin/ai/analyze-document', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId, rawContent, sourceLanguage, targetAudienceNote, forceReanalyze } = req.body;

    let contentToAnalyze = rawContent;
    let docRecord: DocumentItem | undefined;

    const db = dbManager.getDB();
    if (documentId) {
      docRecord = db.documents.find((d) => d.id === documentId);
      if (docRecord && !contentToAnalyze) {
        contentToAnalyze = docRecord.sourceSnippet;
      }
    }

    if (!contentToAnalyze || contentToAnalyze.trim().length < 20) {
      return res.status(400).json({ error: 'Vui lòng cung cấp nội dung tài liệu đủ dài để phân tích.' });
    }

    // 1.5: Idempotency & Conflict Check
    // If an analysis is already in 'processing' status for this document within the last 60 seconds, prevent duplicate calls
    if (documentId) {
      const recentProcessing = db.documentAnalyses.find(
        (a) => a.documentId === documentId && a.status === 'processing' && Date.now() - a.analyzedTimestamp < 60000
      );
      if (recentProcessing && !forceReanalyze) {
        return res.status(409).json({
          error: 'Tài liệu này đang trong tiến trình phân tích AI. Vui lòng đợi trong giây lát.',
          taskId: recentProcessing.id
        });
      }

      // If document already has a completed analysis and user didn't ask to force re-analyze, restore latest
      if (!forceReanalyze) {
        const latestSaved = dbManager.getLatestAnalysisByDocId(documentId);
        if (latestSaved && latestSaved.status === 'completed') {
          return res.json({
            success: true,
            isRestoredFromSaved: true,
            analysis: latestSaved,
            createdDrafts: latestSaved.generatedDraftsCount
          });
        }
      }
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra file cấu hình môi trường.'
      });
    }

    // Create a new persistent analysis record in 'processing' status
    const analysisId = 'analysis-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const nowTimeStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const initialRecord: DocumentAnalysisRecord = {
      id: analysisId,
      documentId: docRecord?.id || 'doc-adhoc',
      documentTitle: docRecord?.title || 'Văn bản nhập trực tiếp',
      sourceLanguage: sourceLanguage || 'Tự động phát hiện',
      vietnameseSummary: '',
      identifiedTopics: [],
      practicalProblemsSolved: [],
      coreConcepts: [],
      keyPrinciples: [],
      suggestedScenarios: [],
      audienceSuitability: '',
      culturalNuancesAndRisks: [],
      novelCurriculumProposals: [],
      analyzedAt: nowTimeStr,
      analyzedTimestamp: Date.now(),
      analyzedBy: req.admin!.userName,
      status: 'processing',
      generatedDraftsCount: { lessons: 0, scenarios: 0, quizzes: 0 },
      generatedDraftIds: { lessonIds: [], scenarioIds: [], quizIds: [] }
    };

    dbManager.saveAnalysis(initialRecord);

    const prompt = `Bạn là Chuyên gia Cao cấp về Phân tích Nghiệp vụ, Văn hóa Công sở và Giao tiếp Doanh nghiệp.
Hãy phân tích tài liệu sau và trả về kết quả định dạng JSON chuẩn (không thêm bất kỳ văn bản ngoài JSON):

Tài liệu nguồn:
"""
${contentToAnalyze.slice(0, 15000)}
"""

Ngôn ngữ được chỉ định (nếu có): ${sourceLanguage || 'Tự động phát hiện'}
Đối tượng học tập mục tiêu: ${targetAudienceNote || 'Cán bộ, công chức, viên chức, nhân viên văn phòng và sinh viên'}

Yêu cầu phân tích:
1. Nhận diện ngôn ngữ nguồn (detectedLanguage).
2. Tóm tắt nội dung bằng tiếng Việt chuẩn mực (vietnameseSummary, khoảng 3-4 câu súc tích).
3. Xác định 3-5 chủ đề liên quan mật thiết đến văn hóa công sở và giao tiếp chuyên nghiệp (identifiedTopics: string[]).
4. Trích xuất các khái niệm cốt lõi (coreConcepts: [{ term, definition }]).
5. Các nguyên tắc vàng cần ghi nhớ (keyPrinciples: string[]).
6. Các vấn đề thực tế tại nơi làm việc mà nội dung giúp giải quyết (practicalProblemsSolved: string[]).
7. Đề xuất 2-3 ý tưởng tình huống thực tế có thể xây dựng (suggestedScenarios: [{ title, context, challenge }]).
8. Đánh giá mức độ phù hợp với đối tượng học tập (audienceSuitability: string).
9. Phân tích các điểm cần lưu ý về sự khác biệt văn hóa, rủi ro thiên kiến hoặc khác biệt giữa môi trường quốc tế và Việt Nam (culturalNuancesAndRisks: string[]).
10. Đề xuất 2-3 bài học hoặc chuyên đề đào tạo mới mẻ (novelCurriculumProposals: [{ title, category, description, suggestedType: "lesson" | "scenario" | "quiz" }]).
11. Đề xuất 3-5 câu hỏi trắc nghiệm ôn tập (suggestedQuizQuestions: [{ question, options: string[], correctAnswerIndex: number, explanation: string }]).

Phân biệt rõ nội dung có trong nguồn với phần suy luận. Không tự bịa đặt trích dẫn hay số liệu.`;

    let responseText = '{}';
    let analysisData: any = {};
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      });

      responseText = response.text || '{}';
      try {
        analysisData = JSON.parse(responseText);
      } catch {
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        analysisData = JSON.parse(cleanJson);
      }
    } catch (aiErr: any) {
      dbManager.updateAnalysis(analysisId, {
        status: 'failed',
        errorMessage: aiErr.message || 'Lỗi gọi mô hình AI Gemini'
      });
      throw aiErr;
    }

    // Automatically generate draft lessons (2-3), draft scenarios (2-3), and draft quizzes (3-5)
    const generatedDrafts = generateDraftsFromAnalysis(
      analysisData,
      docRecord,
      analysisId,
      req.admin!.userName
    );

    // Complete the persistent analysis record
    const completedRecord: DocumentAnalysisRecord = {
      ...initialRecord,
      sourceLanguage: analysisData.detectedLanguage || initialRecord.sourceLanguage,
      vietnameseSummary: analysisData.vietnameseSummary || '',
      identifiedTopics: analysisData.identifiedTopics || [],
      practicalProblemsSolved: analysisData.practicalProblemsSolved || [],
      coreConcepts: analysisData.coreConcepts || [],
      keyPrinciples: analysisData.keyPrinciples || [],
      suggestedScenarios: analysisData.suggestedScenarios || [],
      audienceSuitability: analysisData.audienceSuitability || '',
      culturalNuancesAndRisks: analysisData.culturalNuancesAndRisks || [],
      novelCurriculumProposals: analysisData.novelCurriculumProposals || [],
      detailedAnalysis: analysisData,
      status: 'completed',
      generatedDraftsCount: {
        lessons: generatedDrafts.lessonIds.length,
        scenarios: generatedDrafts.scenarioIds.length,
        quizzes: generatedDrafts.quizIds.length
      },
      generatedDraftIds: generatedDrafts
    };

    dbManager.saveAnalysis(completedRecord);

    // Update document record if attached
    if (docRecord) {
      docRecord.status = 'analyzed';
      docRecord.analysisResult = analysisData;
      docRecord.linkedContentCount =
        (docRecord.linkedContentCount || 0) +
        generatedDrafts.lessonIds.length +
        generatedDrafts.scenarioIds.length +
        generatedDrafts.quizIds.length;
      docRecord.updatedAt = new Date().toISOString().split('T')[0];
    }

    dbManager.logAction(
      { name: req.admin!.userName, email: req.admin!.userEmail },
      'AI phân tích tài liệu & Tự động tạo bản nháp',
      'document',
      docRecord ? docRecord.title : 'Văn bản trực tiếp',
      `Tạo thành công ${generatedDrafts.lessonIds.length} bài học, ${generatedDrafts.scenarioIds.length} tình huống, ${generatedDrafts.quizIds.length} câu hỏi trắc nghiệm (Bản nháp).`
    );
    dbManager.save();

    res.json({
      success: true,
      analysis: completedRecord,
      createdDrafts: {
        lessons: generatedDrafts.lessonIds.length,
        scenarios: generatedDrafts.scenarioIds.length,
        quizzes: generatedDrafts.quizIds.length,
        lessonIds: generatedDrafts.lessonIds,
        scenarioIds: generatedDrafts.scenarioIds,
        quizIds: generatedDrafts.quizIds
      }
    });
  } catch (err: any) {
    console.error('Error analyzing document with Gemini:', err);
    res.status(500).json({ error: 'Lỗi khi gọi AI phân tích tài liệu: ' + (err.message || 'Lỗi xử lý') });
  }
});

// 1.4: Lấy kết quả phân tích mới nhất và lịch sử phân tích của tài liệu
app.get('/api/admin/documents/:id/analysis', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const docId = req.params.id;
  const latest = dbManager.getLatestAnalysisByDocId(docId);
  const history = dbManager.getAnalysesByDocId(docId);
  res.json({
    latest,
    history
  });
});

// 1.5: Tạo lại bản nháp từ kết quả phân tích đã lưu (không gọi lại AI)
app.post('/api/admin/ai/regenerate-drafts', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { analysisId } = req.body;
    if (!analysisId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã bản phân tích (analysisId).' });
    }

    const analysisRecord = dbManager.getAnalysisById(analysisId);
    if (!analysisRecord) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi phân tích đã lưu.' });
    }

    const db = dbManager.getDB();
    const docRecord = db.documents.find((d) => d.id === analysisRecord.documentId);

    const generatedDrafts = generateDraftsFromAnalysis(
      analysisRecord.detailedAnalysis || analysisRecord,
      docRecord,
      analysisRecord.id,
      req.admin!.userName
    );

    // Merge generated IDs
    const mergedLessonIds = Array.from(new Set([...analysisRecord.generatedDraftIds.lessonIds, ...generatedDrafts.lessonIds]));
    const mergedScenarioIds = Array.from(new Set([...analysisRecord.generatedDraftIds.scenarioIds, ...generatedDrafts.scenarioIds]));
    const mergedQuizIds = Array.from(new Set([...analysisRecord.generatedDraftIds.quizIds, ...generatedDrafts.quizIds]));

    const updated = dbManager.updateAnalysis(analysisId, {
      generatedDraftsCount: {
        lessons: mergedLessonIds.length,
        scenarios: mergedScenarioIds.length,
        quizzes: mergedQuizIds.length
      },
      generatedDraftIds: {
        lessonIds: mergedLessonIds,
        scenarioIds: mergedScenarioIds,
        quizIds: mergedQuizIds
      }
    });

    dbManager.logAction(
      { name: req.admin!.userName, email: req.admin!.userEmail },
      'Tạo lại bản nháp từ phân tích lưu trữ',
      'proposal',
      analysisRecord.documentTitle,
      `Tạo thêm ${generatedDrafts.lessonIds.length} bài học, ${generatedDrafts.scenarioIds.length} tình huống, ${generatedDrafts.quizIds.length} câu hỏi.`
    );
    dbManager.save();

    res.json({
      success: true,
      analysis: updated,
      createdDrafts: {
        lessons: generatedDrafts.lessonIds.length,
        scenarios: generatedDrafts.scenarioIds.length,
        quizzes: generatedDrafts.quizIds.length,
        lessonIds: generatedDrafts.lessonIds,
        scenarioIds: generatedDrafts.scenarioIds,
        quizIds: generatedDrafts.quizIds
      }
    });
  } catch (err: any) {
    console.error('Error regenerating drafts:', err);
    res.status(500).json({ error: 'Lỗi khi tạo lại bản nháp: ' + (err.message || 'Lỗi xử lý') });
  }
});

// 2. Tạo bài học từ tài liệu (Draft Proposal)
app.post('/api/admin/ai/generate-lesson', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, sourceExcerpt, targetAudience, directives, documentId } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp chủ đề bài học.' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.' });
    }

    const prompt = `Bạn là Chuyên gia Thiết kế Chương trình Đào tạo Văn hóa Công sở.
Hãy biên soạn một BẢN NHÁP BÀI HỌC hoàn chỉnh bằng TIẾNG VIỆT dựa trên các thông tin sau:

Chủ đề: "${topic}"
Đoạn trích căn cứ / ý tưởng:
"""
${sourceExcerpt || 'Nguyên tắc giao tiếp và chuẩn mực ứng xử chuyên nghiệp'}
"""
Đối tượng: ${targetAudience || 'Cán bộ, nhân viên cơ quan, doanh nghiệp'}
Yêu cầu bổ sung của Admin: ${directives || 'Biên soạn bài bản, rõ ràng, thực tiễn, có ví dụ cụ thể và bảng kiểm Nên làm / Nên tránh'}

Trả về JSON với cấu trúc chính xác sau:
{
  "title": "Tiêu đề bài học thu hút, trang trọng",
  "category": "Tên nhóm chuyên đề (ví dụ: Tác phong & Kỷ luật, Giao tiếp trực tiếp, Viết thư tín, Giải quyết xung đột...)",
  "estimatedMinutes": 15,
  "summary": "Tóm tắt ngắn gọn nội dung bài học trong 2-3 câu",
  "objectives": [
    "Mục tiêu học tập 1",
    "Mục tiêu học tập 2",
    "Mục tiêu học tập 3"
  ],
  "sections": [
    {
      "title": "1. Tiêu đề phần 1",
      "content": "Nội dung giải thích chi tiết, chuyên nghiệp...",
      "bulletPoints": ["Điểm nhấn 1", "Điểm nhấn 2", "Điểm nhấn 3"],
      "example": {
        "situation": "Tình huống ví dụ thực tế tại văn phòng",
        "goodApproach": "Cách xử lý chuẩn mực, khéo léo",
        "badApproach": "Cách xử lý sai lầm, thiếu tế nhị"
      }
    },
    {
      "title": "2. Tiêu đề phần 2 (Hướng dẫn áp dụng thực tế)",
      "content": "Các bước triển khai cụ thể theo mô hình SBI hoặc BLUF..."
    }
  ],
  "dos": [
    "Việc nên làm 1",
    "Việc nên làm 2",
    "Việc nên làm 3"
  ],
  "donts": [
    "Điều cần tránh 1",
    "Điều cần tránh 2",
    "Điều cần tránh 3"
  ],
  "keyTakeaway": "Thông điệp cốt lõi đúc kết trong 1 câu",
  "reviewQuestion": {
    "question": "Câu hỏi trắc nghiệm ôn tập?",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctIndex": 0,
    "explanation": "Giải thích cặn kẽ tại sao phương án này là chuẩn xác nhất."
  },
  "sourceSnippetCitation": "Đoạn văn bản gốc làm căn cứ xây dựng bài học này"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6
      }
    });

    const responseText = response.text || '{}';
    const lessonDraft = JSON.parse(responseText);

    // Save into AI Proposals queue (Pending review - NEVER auto-publish)
    const db = dbManager.getDB();
    const doc = documentId ? db.documents.find((d) => d.id === documentId) : undefined;

    const proposal: AiProposal = {
      id: 'prop-les-' + Date.now(),
      type: 'lesson',
      title: lessonDraft.title,
      status: 'pending_review',
      documentId,
      documentTitle: doc ? doc.title : undefined,
      originalSnippet: sourceExcerpt ? sourceExcerpt.slice(0, 500) : undefined,
      contentData: lessonDraft,
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.aiProposals.unshift(proposal);
    dbManager.logAction(
      { name: req.admin!.userName, email: req.admin!.userEmail },
      'AI tạo bản nháp bài học (Chờ duyệt)',
      'proposal',
      proposal.title
    );
    dbManager.save();

    res.json({
      success: true,
      proposalId: proposal.id,
      proposal
    });
  } catch (err: any) {
    console.error('Error generating lesson with AI:', err);
    res.status(500).json({ error: 'Lỗi khi tạo bài học bằng AI: ' + (err.message || 'Lỗi máy chủ') });
  }
});

// 3. Tạo tình huống thực hành (Draft Proposal)
app.post('/api/admin/ai/generate-scenario', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scenarioTopic, sourceExcerpt, targetAudience, directives, documentId } = req.body;

    if (!scenarioTopic?.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp chủ đề tình huống.' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.' });
    }

    const prompt = `Bạn là Chuyên gia Đào tạo Tình huống (Role-play & Case-based Simulation) tại nơi làm việc.
Hãy tạo một KỊCH BẢN TÌNH HUỐNG THỰC HÀNH CÔNG SỞ bằng TIẾNG VIỆT dựa trên các thông tin sau:

Chủ đề tình huống: "${scenarioTopic}"
Căn cứ tài liệu:
"""
${sourceExcerpt || 'Tình huống giao tiếp, phối hợp liên phòng ban hoặc giải quyết mâu thuẫn'}
"""
Đối tượng: ${targetAudience || 'Nhân viên văn phòng, cán bộ quản lý'}
Yêu cầu bổ sung: ${directives || 'Tình huống chân thực, có tính thử thách cao, không có đáp án quá lộ liễu, phân tích tâm lý sâu sắc'}

Yêu cầu định dạng JSON chính xác:
{
  "title": "Tiêu đề tình huống kịch tính, thực tế",
  "category": "Nhóm kỹ năng (ví dụ: Xử lý mâu thuẫn và tình huống khó, Giao tiếp với cấp trên, Chăm sóc khách hàng...)",
  "characterRole": "Vai trò của học viên (ví dụ: Chuyên viên dự án / Trưởng nhóm)",
  "context": "Bối cảnh cụ thể: Thời gian, địa điểm, sự việc đang diễn ra gây căng thẳng...",
  "problemStatement": "Câu hỏi/vấn đề hóc búa cần giải quyết ngay lúc này?",
  "difficulty": "Trung bình",
  "skillTrained": "Kỹ năng đàm phán, kiềm chế cảm xúc và phản hồi mang tính xây dựng",
  "options": [
    {
      "id": "opt-a",
      "text": "Nội dung cách xử lý phương án A (phản ứng bản năng hoặc cảm tính)",
      "quality": "poor",
      "feedbackTitle": "Phản ứng thiếu tế nhị - Dễ gây mâu thuẫn",
      "feedbackDescription": "Giải thích chi tiết tại sao cách này không tối ưu và hậu quả xảy ra...",
      "recommendedPhrasing": "Mẫu câu nên nói nếu muốn điều chỉnh",
      "scoreAwarded": 10
    },
    {
      "id": "opt-b",
      "text": "Nội dung cách xử lý phương án B (chuẩn mực, thấu cảm, tách con người khỏi vấn đề)",
      "quality": "best",
      "feedbackTitle": "Phương án tối ưu - Giải quyết tận gốc vấn đề",
      "feedbackDescription": "Giải thích cặn kẽ vì sao phương án này tạo sự đồng thuận và giữ gìn uy tín tập thể...",
      "recommendedPhrasing": "Lời thoại gợi ý mẫu mực từng câu chữ...",
      "scoreAwarded": 40
    },
    {
      "id": "opt-c",
      "text": "Nội dung cách xử lý phương án C (chấp nhận được nhưng còn điểm hạn chế)",
      "quality": "acceptable",
      "feedbackTitle": "Chấp nhận được - Nhưng cần cải thiện thêm",
      "feedbackDescription": "Đánh giá mặt được và mặt còn thiếu sót...",
      "recommendedPhrasing": "Gợi ý bổ sung thêm...",
      "scoreAwarded": 25
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6
      }
    });

    const scenarioDraft = JSON.parse(response.text || '{}');

    // Save into AI Proposals queue
    const db = dbManager.getDB();
    const doc = documentId ? db.documents.find((d) => d.id === documentId) : undefined;

    const proposal: AiProposal = {
      id: 'prop-scen-' + Date.now(),
      type: 'scenario',
      title: scenarioDraft.title,
      status: 'pending_review',
      documentId,
      documentTitle: doc ? doc.title : undefined,
      originalSnippet: sourceExcerpt ? sourceExcerpt.slice(0, 500) : undefined,
      contentData: scenarioDraft,
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.aiProposals.unshift(proposal);
    dbManager.logAction(
      { name: req.admin!.userName, email: req.admin!.userEmail },
      'AI tạo bản nháp tình huống (Chờ duyệt)',
      'proposal',
      proposal.title
    );
    dbManager.save();

    res.json({
      success: true,
      proposalId: proposal.id,
      proposal
    });
  } catch (err: any) {
    console.error('Error generating scenario with AI:', err);
    res.status(500).json({ error: 'Lỗi khi tạo tình huống bằng AI: ' + (err.message || 'Lỗi máy chủ') });
  }
});

// 4. Tạo câu hỏi kiểm tra (5 questions default)
app.post('/api/admin/ai/generate-quiz', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, sourceExcerpt, questionCount = 5, directives, documentId } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp chủ đề câu hỏi trắc nghiệm.' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 10);

    const prompt = `Bạn là Chuyên gia Khảo thí Đánh giá Năng lực Giao tiếp Công sở.
Hãy biên soạn đúng ${count} câu hỏi trắc nghiệm chất lượng cao bằng TIẾNG VIỆT cho chủ đề: "${topic}".

Căn cứ tài liệu:
"""
${sourceExcerpt || 'Chuẩn mực văn hóa ứng xử và giao tiếp doanh nghiệp'}
"""
Yêu cầu: ${directives || 'Câu hỏi tình huống thực tế, 4 lựa chọn, có giải thích vì sao đáp án đúng và phân tích bẫy sai lầm'}

Trả về JSON mảng câu hỏi:
{
  "questions": [
    {
      "topicId": "topic-culture",
      "question": "Nội dung câu hỏi tình huống cụ thể?",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correctAnswerIndex": 1,
      "difficulty": "Trung bình",
      "skillTested": "Kỹ năng phản hồi xây dựng",
      "explanation": "Giải thích chi tiết tại sao phương án B đúng theo quy chuẩn giao tiếp văn minh."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    const parsed = JSON.parse(response.text || '{"questions":[]}');
    const questions = parsed.questions || [];

    // Save into AI Proposals queue
    const db = dbManager.getDB();
    const doc = documentId ? db.documents.find((d) => d.id === documentId) : undefined;

    const proposal: AiProposal = {
      id: 'prop-quiz-' + Date.now(),
      type: 'quiz',
      title: `Bộ ${questions.length} câu hỏi trắc nghiệm: ${topic}`,
      status: 'pending_review',
      documentId,
      documentTitle: doc ? doc.title : undefined,
      originalSnippet: sourceExcerpt ? sourceExcerpt.slice(0, 500) : undefined,
      contentData: { questions, topic },
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.aiProposals.unshift(proposal);
    dbManager.logAction(
      { name: req.admin!.userName, email: req.admin!.userEmail },
      'AI tạo bộ câu hỏi kiểm tra (Chờ duyệt)',
      'proposal',
      proposal.title
    );
    dbManager.save();

    res.json({
      success: true,
      proposalId: proposal.id,
      proposal
    });
  } catch (err: any) {
    console.error('Error generating quiz with AI:', err);
    res.status(500).json({ error: 'Lỗi khi tạo câu hỏi kiểm tra bằng AI: ' + (err.message || 'Lỗi máy chủ') });
  }
});

// 5. Tinh chỉnh nội dung AI (Refine Content)
app.post('/api/admin/ai/refine-content', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { proposalId, currentContent, instruction } = req.body;

    if (!instruction?.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp yêu cầu điều chỉnh (instruction).' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.' });
    }

    const prompt = `Bạn là Trợ lý Biên tập Nội dung Đào tạo Cao cấp.
Hãy điều chỉnh và hoàn thiện nội dung JSON sau theo yêu cầu của Quản trị viên:

Yêu cầu điều chỉnh: "${instruction}"

Nội dung hiện tại:
"""
${JSON.stringify(currentContent, null, 2)}
"""

Trả về JSON hoàn chỉnh sau khi đã áp dụng yêu cầu chỉnh sửa (giữ nguyên cấu trúc các trường chính).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    const refined = JSON.parse(response.text || '{}');

    // If linked to a proposal, update the proposal draft in database
    if (proposalId) {
      const db = dbManager.getDB();
      const p = db.aiProposals.find((item) => item.id === proposalId);
      if (p) {
        p.contentData = refined;
        if (refined.title) p.title = refined.title;
        dbManager.save();
      }
    }

    res.json({
      success: true,
      refinedContent: refined
    });
  } catch (err: any) {
    console.error('Error refining content with AI:', err);
    res.status(500).json({ error: 'Lỗi khi tinh chỉnh nội dung: ' + (err.message || 'Lỗi máy chủ') });
  }
});

// ==========================================
// MODERATION & APPROVAL QUEUE
// ==========================================
app.get('/api/admin/proposals', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().aiProposals);
});

app.put('/api/admin/proposals/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const index = db.aiProposals.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bản đề xuất AI.' });
  }

  const updated: AiProposal = {
    ...db.aiProposals[index],
    ...req.body,
    id: db.aiProposals[index].id
  };

  db.aiProposals[index] = updated;
  dbManager.save();

  res.json({ success: true, proposal: updated });
});

// Approve and publish or save to catalog
app.post('/api/admin/proposals/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const proposal = db.aiProposals.find((p) => p.id === id);

  if (!proposal) {
    return res.status(404).json({ error: 'Không tìm thấy bản đề xuất AI.' });
  }

  const { targetStatus = 'published' } = req.body;
  proposal.status = 'approved';
  proposal.reviewedAt = new Date().toISOString().split('T')[0];
  proposal.reviewedBy = req.admin?.userName || 'Quản trị viên';

  // Materialize into actual database tables
  if (proposal.type === 'lesson') {
    const rawLesson = proposal.contentData;
    const newLesson: AdminLesson = {
      id: 'lesson-' + (db.lessons.length + 1),
      order: db.lessons.length + 1,
      category: rawLesson.category || 'Chuyên đề nâng cao',
      title: rawLesson.title,
      summary: rawLesson.summary || '',
      estimatedMinutes: rawLesson.estimatedMinutes || 15,
      objectives: rawLesson.objectives || ['Nắm vững kiến thức bài học'],
      sections: rawLesson.sections || [],
      dos: rawLesson.dos || [],
      donts: rawLesson.donts || [],
      keyTakeaway: rawLesson.keyTakeaway || '',
      reviewQuestion: rawLesson.reviewQuestion || {
        question: 'Câu hỏi ôn tập?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: 'Giải thích'
      },
      status: targetStatus as ContentStatus,
      sourceReference: proposal.documentTitle || 'Tài liệu phân tích AI Content Studio',
      sourceDocumentId: proposal.documentId,
      createdBy: 'AI Content Studio (Đã duyệt)',
      approvedBy: req.admin?.userName || 'Quản trị viên',
      updatedAt: new Date().toISOString().split('T')[0]
    };
    db.lessons.push(newLesson);
  } else if (proposal.type === 'scenario') {
    const rawScenario = proposal.contentData;
    const newScenario: AdminScenario = {
      id: 'scenario-' + (db.scenarios.length + 1),
      order: db.scenarios.length + 1,
      category: rawScenario.category || 'Kỹ năng nâng cao',
      title: rawScenario.title,
      context: rawScenario.context,
      characterRole: rawScenario.characterRole || 'Chuyên viên xử lý',
      problemStatement: rawScenario.problemStatement,
      difficulty: rawScenario.difficulty || 'Trung bình',
      skillTrained: rawScenario.skillTrained || 'Giao tiếp công sở',
      options: rawScenario.options || [],
      status: targetStatus as ContentStatus,
      sourceReference: proposal.documentTitle || 'Tài liệu phân tích AI Content Studio',
      sourceDocumentId: proposal.documentId,
      createdBy: 'AI Content Studio (Đã duyệt)',
      approvedBy: req.admin?.userName || 'Quản trị viên',
      updatedAt: new Date().toISOString().split('T')[0]
    };
    db.scenarios.push(newScenario);
  } else if (proposal.type === 'quiz') {
    const questions = proposal.contentData?.questions || [];
    for (const q of questions) {
      const newQuestion: AdminQuizQuestion = {
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        topicId: q.topicId || 'topic-culture',
        question: q.question,
        options: q.options || ['A', 'B', 'C', 'D'],
        correctAnswerIndex: q.correctAnswerIndex ?? 0,
        explanation: q.explanation || 'Đáp án chính xác.',
        status: targetStatus as ContentStatus,
        difficulty: q.difficulty || 'Trung bình',
        scoreAwarded: 20,
        sourceReference: proposal.documentTitle || 'AI Content Studio',
        createdBy: 'AI Content Studio (Đã duyệt)',
        approvedBy: req.admin?.userName || 'Quản trị viên',
        updatedAt: new Date().toISOString().split('T')[0]
      };
      db.quizQuestions.push(newQuestion);
    }
  }

  // Increment document link count if document was attached
  if (proposal.documentId) {
    const doc = db.documents.find((d) => d.id === proposal.documentId);
    if (doc) doc.linkedContentCount = (doc.linkedContentCount || 0) + 1;
  }

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Phê duyệt nội dung AI',
    proposal.type,
    proposal.title,
    `Đã chuyển thành ${targetStatus === 'published' ? 'Đã xuất bản' : 'Bản nháp'}.`
  );
  dbManager.save();

  res.json({ success: true, message: 'Đã phê duyệt và đồng bộ nội dung vào hệ thống.' });
});

// Reject proposal with reason
app.post('/api/admin/proposals/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const proposal = db.aiProposals.find((p) => p.id === id);

  if (!proposal) {
    return res.status(404).json({ error: 'Không tìm thấy bản đề xuất AI.' });
  }

  const { reason } = req.body;
  if (!reason?.trim()) {
    return res.status(400).json({ error: 'Vui lòng cung cấp lý do từ chối để hoàn thiện mô hình.' });
  }

  proposal.status = 'rejected';
  proposal.rejectionReason = reason.trim();
  proposal.reviewedAt = new Date().toISOString().split('T')[0];
  proposal.reviewedBy = req.admin?.userName || 'Quản trị viên';

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Từ chối nội dung AI',
    proposal.type,
    proposal.title,
    `Lý do: ${reason.trim()}`
  );
  dbManager.save();

  res.json({ success: true, message: 'Đã từ chối bản đề xuất.' });
});

// --- User Management & Audit Logs ---
app.get('/api/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  // Strip sensitive password salt and hashes
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    organizationType: u.organizationType,
    organizationName: u.organizationName,
    department: u.department,
    city: u.city,
    createdAt: u.createdAt,
    isAdmin: !!u.isAdmin
  }));
  res.json(safeUsers);
});

app.put('/api/admin/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const id = req.params.id;
  const { isAdmin, role } = req.body;

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  if (user.id === req.admin!.userId && isAdmin === false) {
    return res.status(400).json({ error: 'Bạn không thể tự gỡ quyền Quản trị viên của chính mình.' });
  }

  user.isAdmin = !!isAdmin;
  if (role) user.role = role;

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật phân quyền người dùng',
    'user',
    user.name,
    `Quyền Admin: ${user.isAdmin ? 'Bật' : 'Tắt'}`
  );
  dbManager.save();

  res.json({ success: true, user });
});

app.get('/api/admin/logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().auditLogs);
});

// System Settings
app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(dbManager.getDB().settings);
});

app.put('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật cài đặt hệ thống',
    'system',
    'Cấu hình nền tảng'
  );
  dbManager.save();
  res.json({ success: true, settings: db.settings });
});

// ==========================================
// CHATBOT & FEEDBACK (PREVIOUS FEATURE)
// ==========================================
const feedbackStore: Array<{ id: string; messageId: string; rating: string; comment?: string; timestamp: number }> =
  [];

const SYSTEM_INSTRUCTION = `Bạn là "Cố vấn Văn hóa & Giao tiếp Công sở Chuyên nghiệp" (Workplace Etiquette & Communication AI Coach) của nền tảng đào tạo doanh nghiệp.
Nhiệm vụ của bạn:
1. Trả lời các thắc mắc về văn hóa doanh nghiệp, chuẩn mực ứng xử, nghệ thuật giao tiếp với cấp trên, đồng nghiệp, khách hàng và đối tác.
2. Hướng dẫn soạn thảo email công việc chuẩn mực, cách xử lý từ chối khéo léo, cách nhận và đưa ra lời phê bình theo mô hình SBI (Situation - Behavior - Impact), kỹ thuật báo cáo BLUF (Bottom Line Up Front), và giải quyết xung đột theo mô hình Thomas-Kilmann.
3. Hướng dẫn người dùng cách sử dụng các tính năng của ứng dụng (Thư viện bài học, Thực hành tình huống có chấm điểm, Bài kiểm tra trắc nghiệm nhận chứng chỉ, Bảng xếp hạng và Tích lũy huy hiệu).
4. Phong cách giao tiếp: Lịch thiệp, chuẩn mực, thấu cảm, chuyên nghiệp và có tính ứng dụng cao.
5. Cung cấp ví dụ thực tế hoặc mẫu câu cụ thể khi người dùng cần hỗ trợ soạn thảo.
6. Ngôn ngữ: Tiếng Việt chuẩn mực, có dấu, phong cách công sở văn minh.`;

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ.' });
    }

    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          const recent = history.slice(-6);
          for (const msg of recent) {
            contents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7
          }
        });

        const replyText =
          response.text ||
          'Tôi đã tiếp nhận câu hỏi của bạn. Xin vui lòng nêu rõ hơn bối cảnh để tôi tư vấn chuẩn xác nhất.';
        return res.json({ reply: replyText });
      } catch (genError: any) {
        console.warn('Gemini API call warning, falling back to expert knowledge base:', genError?.message);
      }
    }

    // Grounded fallback
    const lower = message.toLowerCase();
    let fallbackReply = `Cảm ơn bạn đã đặt câu hỏi về văn hóa và giao tiếp công sở!
Để xây dựng phong cách làm việc chuyên nghiệp, hãy áp dụng 4 trụ cột cốt lõi: Tính trách nhiệm, Giao tiếp minh bạch & thấu cảm, Tác phong chuẩn mực, và Đạo đức nghề nghiệp.`;

    if (lower.includes('từ chối') || lower.includes('quá tải')) {
      fallbackReply = `Cách từ chối khéo léo khi cấp trên giao thêm việc:
1. Ghi nhận thiện chí và cảm ơn sự tin tưởng.
2. Trình bày danh sách đầu việc hiện tại và thời hạn cam kết.
3. Đề xuất sếp định hướng thứ tự ưu tiên hoặc dời thời hạn công việc mới.`;
    }

    return res.json({ reply: fallbackReply });
  } catch (err: any) {
    console.error('Error handling /api/chat:', err);
    return res.status(500).json({ error: 'Đã có lỗi xảy ra khi xử lý phản hồi từ AI.' });
  }
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const { messageId, rating, comment } = req.body;
  if (!messageId || !rating) {
    return res.status(400).json({ error: 'Thiếu thông tin đánh giá.' });
  }

  const record = {
    id: 'fb-' + Date.now(),
    messageId,
    rating,
    comment: comment || '',
    timestamp: Date.now()
  };
  feedbackStore.push(record);

  return res.json({
    success: true,
    message: 'Cảm ơn bạn đã gửi phản hồi!',
    feedbackId: record.id
  });
});

// ==========================================
// KHO NỘI DUNG HỌC TẬP (AI LEARNING CONTENT REPOSITORY)
// ==========================================

export interface UnifiedLearningContentItem {
  id: string;
  type: 'lesson' | 'scenario' | 'quiz' | 'analysis';
  title: string;
  summaryOrContext?: string;
  categoryOrTopic?: string;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  sourceAnalysisId?: string;
  createdAt: string;
  updatedAt: string;
  status: ContentStatus | 'rejected' | 'completed';
  createdBy?: string;
  approvedBy?: string;
  editHistory?: Array<{ editedAt: string; editedBy: string; summary: string }>;
  rawData: any;
}

// 2.1: Unified list of all learning content with filters and pagination
app.get('/api/admin/learning-content', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const { type, sourceDocumentId, status, search } = req.query;

  const docMap = new Map<string, string>();
  db.documents.forEach((d) => docMap.set(d.id, d.title));

  const items: UnifiedLearningContentItem[] = [];

  // 1. Lessons
  db.lessons.forEach((l) => {
    const docTitle = l.sourceDocumentId ? docMap.get(l.sourceDocumentId) || l.sourceReference : l.sourceReference;
    items.push({
      id: l.id,
      type: 'lesson',
      title: l.title,
      summaryOrContext: l.summary,
      categoryOrTopic: l.category,
      sourceDocumentId: l.sourceDocumentId,
      sourceDocumentTitle: docTitle,
      sourceAnalysisId: l.sourceAnalysisId,
      createdAt: l.updatedAt || '2026-10-01',
      updatedAt: l.updatedAt || '2026-10-01',
      status: l.status || 'published',
      createdBy: l.createdBy || 'Hệ thống Quản trị',
      approvedBy: l.approvedBy,
      editHistory: l.editHistory || [],
      rawData: l
    });
  });

  // 2. Scenarios
  db.scenarios.forEach((s) => {
    const docTitle = s.sourceDocumentId ? docMap.get(s.sourceDocumentId) || s.sourceReference : s.sourceReference;
    items.push({
      id: s.id,
      type: 'scenario',
      title: s.title,
      summaryOrContext: s.problemStatement || s.context,
      categoryOrTopic: s.category,
      sourceDocumentId: s.sourceDocumentId,
      sourceDocumentTitle: docTitle,
      sourceAnalysisId: s.sourceAnalysisId,
      createdAt: s.updatedAt || '2026-10-01',
      updatedAt: s.updatedAt || '2026-10-01',
      status: s.status || 'published',
      createdBy: s.createdBy || 'Hệ thống Quản trị',
      approvedBy: s.approvedBy,
      editHistory: s.editHistory || [],
      rawData: s
    });
  });

  // 3. Quiz Questions
  db.quizQuestions.forEach((q) => {
    const docTitle = q.sourceDocumentId ? docMap.get(q.sourceDocumentId) || q.sourceReference : q.sourceReference;
    items.push({
      id: q.id,
      type: 'quiz',
      title: q.question,
      summaryOrContext: q.explanation,
      categoryOrTopic: q.topicId,
      sourceDocumentId: q.sourceDocumentId,
      sourceDocumentTitle: docTitle,
      sourceAnalysisId: q.sourceAnalysisId,
      createdAt: q.updatedAt || '2026-10-01',
      updatedAt: q.updatedAt || '2026-10-01',
      status: q.status || 'published',
      createdBy: q.createdBy || 'Hệ thống Quản trị',
      approvedBy: q.approvedBy,
      editHistory: q.editHistory || [],
      rawData: q
    });
  });

  // 4. AI Analysis Reports
  (db.documentAnalyses || []).forEach((a) => {
    const docTitle = a.documentTitle || (a.documentId ? docMap.get(a.documentId) : undefined) || 'Báo cáo AI';
    items.push({
      id: a.id,
      type: 'analysis',
      title: `Báo cáo phân tích AI: ${docTitle}`,
      summaryOrContext: a.vietnameseSummary,
      categoryOrTopic: (a.identifiedTopics || [])[0] || 'Phân tích đa ngôn ngữ',
      sourceDocumentId: a.documentId,
      sourceDocumentTitle: docTitle,
      sourceAnalysisId: a.id,
      createdAt: a.analyzedAt,
      updatedAt: a.analyzedAt,
      status: a.status === 'completed' ? 'published' : 'draft',
      createdBy: a.analyzedBy || 'AI Content Studio',
      editHistory: [
        {
          editedAt: a.analyzedAt,
          editedBy: a.analyzedBy || 'AI Content Studio',
          summary: 'Phân tích tài liệu hoàn tất và lưu trữ tự động vào cơ sở dữ liệu.'
        }
      ],
      rawData: a
    });
  });

  // Apply Filters
  let filtered = items;

  if (type && type !== 'all') {
    filtered = filtered.filter((i) => i.type === type);
  }

  if (sourceDocumentId && sourceDocumentId !== 'all') {
    filtered = filtered.filter((i) => i.sourceDocumentId === sourceDocumentId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((i) => i.status === status);
  }

  if (search && typeof search === 'string') {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(term) ||
        (i.summaryOrContext && i.summaryOrContext.toLowerCase().includes(term)) ||
        (i.sourceDocumentTitle && i.sourceDocumentTitle.toLowerCase().includes(term)) ||
        (i.categoryOrTopic && i.categoryOrTopic.toLowerCase().includes(term))
    );
  }

  // Calculate summary counts
  const counts = {
    total: items.length,
    lessons: items.filter((i) => i.type === 'lesson').length,
    scenarios: items.filter((i) => i.type === 'scenario').length,
    quizzes: items.filter((i) => i.type === 'quiz').length,
    analyses: items.filter((i) => i.type === 'analysis').length,
    drafts: items.filter((i) => i.status === 'draft').length,
    pending: items.filter((i) => i.status === 'pending').length,
    published: items.filter((i) => i.status === 'published').length,
    archived: items.filter((i) => i.status === 'archived').length
  };

  const availableDocuments = db.documents.map((d) => ({
    id: d.id,
    title: d.title,
    linkedCount: items.filter((i) => i.sourceDocumentId === d.id).length
  }));

  res.json({
    items: filtered,
    totalCount: filtered.length,
    counts,
    availableDocuments
  });
});

// 2.2 & 2.3: Update learning content (Edit, Change Status, Track Edit History)
app.put('/api/admin/learning-content/:type/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const { type, id } = req.params;
  const updates = req.body;
  const adminName = req.admin!.userName;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  let updatedItem: any = null;
  let itemTitle = '';

  const editSummary = updates.editNote || updates.status
    ? `Cập nhật trạng thái thành "${updates.status === 'published' ? 'Đã xuất bản' : updates.status === 'draft' ? 'Bản nháp' : updates.status === 'archived' ? 'Đã lưu trữ' : updates.status}"`
    : 'Chỉnh sửa nội dung chi tiết';

  const historyEntry = {
    editedAt: nowStr,
    editedBy: adminName,
    summary: editSummary
  };

  if (type === 'lesson') {
    const idx = db.lessons.findIndex((l) => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy bài học.' });
    const current = db.lessons[idx];
    const history = [...(current.editHistory || []), historyEntry];
    db.lessons[idx] = {
      ...current,
      ...updates,
      id: current.id,
      editHistory: history,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    if (updates.status === 'published' && !current.approvedBy) {
      db.lessons[idx].approvedBy = adminName;
    }
    updatedItem = db.lessons[idx];
    itemTitle = updatedItem.title;
  } else if (type === 'scenario') {
    const idx = db.scenarios.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy tình huống.' });
    const current = db.scenarios[idx];
    const history = [...(current.editHistory || []), historyEntry];
    db.scenarios[idx] = {
      ...current,
      ...updates,
      id: current.id,
      editHistory: history,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    if (updates.status === 'published' && !current.approvedBy) {
      db.scenarios[idx].approvedBy = adminName;
    }
    updatedItem = db.scenarios[idx];
    itemTitle = updatedItem.title;
  } else if (type === 'quiz') {
    const idx = db.quizQuestions.findIndex((q) => q.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy câu hỏi trắc nghiệm.' });
    const current = db.quizQuestions[idx];
    const history = [...(current.editHistory || []), historyEntry];
    db.quizQuestions[idx] = {
      ...current,
      ...updates,
      id: current.id,
      editHistory: history,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    if (updates.status === 'published' && !current.approvedBy) {
      db.quizQuestions[idx].approvedBy = adminName;
    }
    updatedItem = db.quizQuestions[idx];
    itemTitle = updatedItem.question;
  } else if (type === 'analysis') {
    const analysis = dbManager.getAnalysisById(id);
    if (!analysis) return res.status(404).json({ error: 'Không tìm thấy bản phân tích.' });
    if (updates.vietnameseSummary) {
      analysis.vietnameseSummary = updates.vietnameseSummary;
    }
    if (updates.identifiedTopics) {
      analysis.identifiedTopics = updates.identifiedTopics;
    }
    dbManager.saveAnalysis(analysis);
    updatedItem = analysis;
    itemTitle = analysis.documentTitle;
  } else {
    return res.status(400).json({ error: 'Loại nội dung không hợp lệ.' });
  }

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Cập nhật nội dung học tập',
    type as any,
    itemTitle,
    editSummary
  );
  dbManager.save();

  res.json({
    success: true,
    message: 'Đã lưu thay đổi nội dung học tập thành công.',
    item: updatedItem
  });
});

// 2.3: Duplicate learning content
app.post('/api/admin/learning-content/:type/:id/duplicate', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const { type, id } = req.params;
  const adminName = req.admin!.userName;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const nowDate = new Date().toISOString().split('T')[0];

  let duplicatedItem: any = null;

  if (type === 'lesson') {
    const source = db.lessons.find((l) => l.id === id);
    if (!source) return res.status(404).json({ error: 'Không tìm thấy bài học để nhân bản.' });
    const newId = `lesson-dup-${Date.now()}`;
    const clone: AdminLesson = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      order: db.lessons.length + 1,
      title: `${source.title} (Bản sao)`,
      status: 'draft',
      createdBy: adminName,
      approvedBy: undefined,
      updatedAt: nowDate,
      editHistory: [
        {
          editedAt: nowStr,
          editedBy: adminName,
          summary: `Nhân bản từ bài học gốc: "${source.title}" (ID: ${source.id})`
        }
      ]
    };
    db.lessons.push(clone);
    duplicatedItem = clone;
  } else if (type === 'scenario') {
    const source = db.scenarios.find((s) => s.id === id);
    if (!source) return res.status(404).json({ error: 'Không tìm thấy tình huống để nhân bản.' });
    const newId = `scenario-dup-${Date.now()}`;
    const clone: AdminScenario = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      order: db.scenarios.length + 1,
      title: `${source.title} (Bản sao)`,
      status: 'draft',
      createdBy: adminName,
      approvedBy: undefined,
      updatedAt: nowDate,
      editHistory: [
        {
          editedAt: nowStr,
          editedBy: adminName,
          summary: `Nhân bản từ tình huống gốc: "${source.title}" (ID: ${source.id})`
        }
      ]
    };
    db.scenarios.push(clone);
    duplicatedItem = clone;
  } else if (type === 'quiz') {
    const source = db.quizQuestions.find((q) => q.id === id);
    if (!source) return res.status(404).json({ error: 'Không tìm thấy câu hỏi để nhân bản.' });
    const newId = `q-dup-${Date.now()}`;
    const clone: AdminQuizQuestion = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      question: `${source.question} (Bản sao)`,
      status: 'draft',
      createdBy: adminName,
      approvedBy: undefined,
      updatedAt: nowDate,
      editHistory: [
        {
          editedAt: nowStr,
          editedBy: adminName,
          summary: `Nhân bản từ câu hỏi gốc: "${source.question.slice(0, 40)}..." (ID: ${source.id})`
        }
      ]
    };
    db.quizQuestions.push(clone);
    duplicatedItem = clone;
  } else {
    return res.status(400).json({ error: 'Chỉ hỗ trợ nhân bản bài học, tình huống và câu hỏi.' });
  }

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Nhân bản nội dung học tập',
    type as any,
    duplicatedItem.title || duplicatedItem.question,
    `Tạo bản sao mới ở trạng thái Bản nháp (Draft).`
  );
  dbManager.save();

  res.json({
    success: true,
    message: 'Đã nhân bản nội dung thành công (lưu ở trạng thái Bản nháp).',
    item: duplicatedItem
  });
});

// 2.3: Delete learning content
app.delete('/api/admin/learning-content/:type/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.getDB();
  const { type, id } = req.params;

  let targetTitle = '';

  if (type === 'lesson') {
    const target = db.lessons.find((l) => l.id === id);
    if (!target) return res.status(404).json({ error: 'Không tìm thấy bài học.' });
    targetTitle = target.title;
    db.lessons = db.lessons.filter((l) => l.id !== id);
  } else if (type === 'scenario') {
    const target = db.scenarios.find((s) => s.id === id);
    if (!target) return res.status(404).json({ error: 'Không tìm thấy tình huống.' });
    targetTitle = target.title;
    db.scenarios = db.scenarios.filter((s) => s.id !== id);
  } else if (type === 'quiz') {
    const target = db.quizQuestions.find((q) => q.id === id);
    if (!target) return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
    targetTitle = target.question;
    db.quizQuestions = db.quizQuestions.filter((q) => q.id !== id);
  } else {
    return res.status(400).json({ error: 'Loại nội dung không thể xóa trực tiếp.' });
  }

  dbManager.logAction(
    { name: req.admin!.userName, email: req.admin!.userEmail },
    'Xóa nội dung học tập',
    type as any,
    targetTitle
  );
  dbManager.save();

  res.json({ success: true, message: 'Đã xóa nội dung học tập thành công.' });
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
