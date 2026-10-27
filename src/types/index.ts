export type NavTab =
  | 'landing'
  | 'login'
  | 'register'
  | 'overview'
  | 'lessons'
  | 'lesson-detail'
  | 'scenarios'
  | 'quizzes'
  | 'leaderboard'
  | 'ai-tutor'
  | 'progress'
  | 'profile'
  | 'admin';

export interface LessonSection {
  title: string;
  content: string;
  bulletPoints?: string[];
  example?: {
    situation: string;
    goodApproach: string;
    badApproach: string;
  };
}

export interface ReviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  order: number;
  category: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  objectives: string[];
  sections: LessonSection[];
  dos: string[];
  donts: string[];
  keyTakeaway: string;
  reviewQuestion: ReviewQuestion;
}

export interface ScenarioOption {
  id: string;
  text: string;
  quality: 'best' | 'acceptable' | 'poor';
  feedbackTitle: string;
  feedbackDescription: string;
  recommendedPhrasing: string;
  scoreAwarded: number;
}

export interface Scenario {
  id: string;
  order: number;
  category: string;
  title: string;
  context: string;
  characterRole: string;
  problemStatement: string;
  options: ScenarioOption[];
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  relatedLessonId?: string;
}

export interface QuizTopic {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questionIds: string[];
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timestamp: number;
  userAnswers: Record<string, number>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'practice' | 'assessment' | 'mastery';
  requirement: string;
  pointsRequired?: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  department: string;
  role: string;
  avatarSeed: string;
  points: number;
  completedLessonsCount: number;
  quizzesTakenCount: number;
  badgeCount: number;
  isCurrentUser?: boolean;
}

export type OrganizationType =
  | 'Cơ quan nhà nước'
  | 'Đơn vị sự nghiệp công lập'
  | 'Doanh nghiệp nhà nước'
  | 'Doanh nghiệp tư nhân'
  | 'Tổ chức xã hội'
  | 'Sinh viên/thực tập sinh'
  | 'Khác';

export type LearningGoal =
  | 'Nâng cao kỹ năng giao tiếp'
  | 'Cải thiện văn hoá ứng xử'
  | 'Nâng cao kỹ năng quản lý'
  | 'Chuẩn bị đi làm hoặc thực tập'
  | 'Đào tạo nhân viên'
  | 'Khác';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Salted SHA-256 hash (never plain text)
  passwordSalt: string;
  createdAt: string;

  // Personal details
  birthDate?: string;
  phone?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác' | 'Không muốn cung cấp';
  avatarSeed: string;
  joinedDate?: string;

  // Professional details
  role: string;
  customRole?: string;
  organizationType?: OrganizationType;
  organizationName?: string;
  department: string;
  subUnit?: string;
  workplaceAddress?: string;
  city?: string;
  experienceYears?: string;
  learningGoal?: LearningGoal;

  isAdmin?: boolean;
}

export interface UserProgressData {
  completedLessonIds: string[];
  completedScenarios: Record<string, { selectedOptionId: string; timestamp: number; score: number }>;
  quizHistory: QuizResult[];
  points: number;
  unlockedBadges: string[];
  recentActivities: Array<{
    id: string;
    type: 'lesson' | 'scenario' | 'quiz' | 'badge';
    title: string;
    timestamp: number;
    pointsEarned: number;
  }>;
}

// Retain UserProfile for backward compatibility
export type UserProfile = UserAccount;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  feedback?: 'like' | 'dislike';
  feedbackComment?: string;
}

export interface ChatFeedback {
  id: string;
  messageId: string;
  rating: 'like' | 'dislike';
  comment: string;
  timestamp: number;
}

// ==========================================
// ADMIN SYSTEM & AI CONTENT STUDIO TYPES
// ==========================================
export type ContentStatus = 'published' | 'draft' | 'pending' | 'archived';

export interface ContentEditHistoryItem {
  editedAt: string;
  editedBy: string;
  summary: string;
}

export interface AdminLesson extends Lesson {
  status: ContentStatus;
  sourceReference?: string;
  sourceDocumentId?: string;
  sourceAnalysisId?: string;
  editHistory?: ContentEditHistoryItem[];
  createdBy?: string;
  approvedBy?: string;
  updatedAt: string;
}

export interface AdminScenario extends Scenario {
  status: ContentStatus;
  difficulty?: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
  skillTrained?: string;
  sourceReference?: string;
  sourceDocumentId?: string;
  sourceAnalysisId?: string;
  editHistory?: ContentEditHistoryItem[];
  createdBy?: string;
  approvedBy?: string;
  updatedAt: string;
}

export interface AdminQuizQuestion extends QuizQuestion {
  status: ContentStatus;
  difficulty?: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
  scoreAwarded?: number;
  sourceReference?: string;
  sourceDocumentId?: string;
  sourceAnalysisId?: string;
  editHistory?: ContentEditHistoryItem[];
  createdBy?: string;
  approvedBy?: string;
  updatedAt: string;
}

export interface DocumentAnalysisResult {
  detectedLanguage: string;
  sourceLanguage?: string;
  vietnameseSummary: string;
  identifiedTopics: string[];
  coreConcepts: Array<{ term: string; definition: string }>;
  keyPrinciples: string[];
  practicalProblemsSolved: string[];
  suggestedScenarios: Array<{ title: string; context: string; challenge: string }>;
  audienceSuitability: string;
  culturalNuancesAndRisks: string[];
  novelCurriculumProposals: Array<{
    title: string;
    category: string;
    description: string;
    suggestedType: 'lesson' | 'scenario' | 'quiz';
  }>;
}

export interface DocumentAnalysisRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceLanguage: string;
  detectedLanguage?: string;
  vietnameseSummary: string;
  identifiedTopics: string[];
  practicalProblemsSolved: string[];
  coreConcepts: Array<{ term: string; definition: string }>;
  keyPrinciples: string[];
  suggestedScenarios: Array<{ title: string; context: string; challenge: string }>;
  audienceSuitability: string;
  culturalNuancesAndRisks: string[];
  novelCurriculumProposals: Array<{
    title: string;
    category: string;
    description: string;
    suggestedType: 'lesson' | 'scenario' | 'quiz';
  }>;
  detailedAnalysis?: any;
  analyzedAt: string;
  analyzedTimestamp: number;
  analyzedBy: string;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  generatedDraftsCount: {
    lessons: number;
    scenarios: number;
    quizzes: number;
  };
  generatedDraftIds: {
    lessonIds: string[];
    scenarioIds: string[];
    quizIds: string[];
  };
}

export interface DocumentItem {
  id: string;
  title: string;
  authorOrOrg: string;
  url?: string;
  fileFormat?: 'PDF' | 'DOCX' | 'TXT' | 'URL' | 'Khác';
  fileName?: string;
  fileUrl?: string;
  description?: string;
  keywords?: string[];
  originalContent?: string;
  accessDate: string;
  sourceLanguage: string;
  targetLanguage: string;
  topic: string;
  targetAudienceNote?: string;
  sourceSnippet: string;
  fullContentLength: number;
  isVerified: boolean;
  status: 'raw' | 'analyzed' | 'archived';
  analysisResult?: DocumentAnalysisResult;
  linkedContentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiProposal {
  id: string;
  type: 'lesson' | 'scenario' | 'quiz';
  title: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  documentId?: string;
  documentTitle?: string;
  originalSnippet?: string;
  contentData: any;
  similarityNote?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: 'lesson' | 'scenario' | 'quiz' | 'document' | 'proposal' | 'user' | 'system';
  targetTitle: string;
  timestamp: number;
  details?: string;
}

export interface AdminDashboardStats {
  totalLessons: number;
  publishedLessons: number;
  draftLessons: number;
  pendingLessons: number;
  totalScenarios: number;
  publishedScenarios: number;
  totalQuestions: number;
  totalDocuments: number;
  analyzedDocuments: number;
  pendingAiProposals: number;
  totalUsers: number;
  activeLearnersLast7Days: number;
  totalXPGranted: number;
}

