import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_LESSONS, INITIAL_SCENARIOS, INITIAL_QUIZ_QUESTIONS, INITIAL_USERS } from '../src/data/seedData';
import { Lesson, Scenario, QuizQuestion, UserAccount } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent data directory
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

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
  analysisResult?: {
    detectedLanguage: string;
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
  };
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

export interface AdminSession {
  token: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'admin';
  createdAt: number;
  expiresAt: number;
}

export interface DocumentAnalysisRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceLanguage: string;
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

export interface DatabaseSchema {
  users: UserAccount[];
  lessons: AdminLesson[];
  scenarios: AdminScenario[];
  quizQuestions: AdminQuizQuestion[];
  documents: DocumentItem[];
  documentAnalyses: DocumentAnalysisRecord[];
  aiProposals: AiProposal[];
  auditLogs: AuditLog[];
  sessions: AdminSession[];
  settings: {
    aiModel: string;
    appName: string;
    allowRegistration: boolean;
    requireDocumentVerification: boolean;
    lastBackupDate?: string;
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.lessons && parsed.users) {
          if (!parsed.documentAnalyses) {
            parsed.documentAnalyses = [];
          }

          // Hydrate doc-seed-1 with rich original content and metadata
          if (parsed.documents) {
            const seedDoc = parsed.documents.find((d: any) => d.id === 'doc-seed-1');
            if (seedDoc) {
              seedDoc.fileFormat = seedDoc.fileFormat || 'URL';
              seedDoc.description =
                seedDoc.description ||
                'Tài liệu nghiên cứu và cẩm nang đàm phán giải quyết mâu thuẫn nơi làm việc từ Đại học Harvard.';
              seedDoc.keywords =
                seedDoc.keywords || ['Đàm phán', 'Harvard PON', 'BATNA', 'Win-Win', 'Giải quyết mâu thuẫn', 'Giao tiếp công sở'];
              if (!seedDoc.originalContent || seedDoc.originalContent.length < 300) {
                seedDoc.originalContent = `PROGRAM ON NEGOTIATION AT HARVARD LAW SCHOOL
DAILY BLOG: WORKPLACE CONFLICT RESOLUTION STANDARDS

1. Executive Summary
In today's fast-paced corporate and institutional environment, interpersonal conflicts are inevitable. Whether stemming from scarce resource allocation, divergent professional priorities, or cross-generational communication gaps, unaddressed disputes create toxic work cultures and erode team performance. The Harvard Program on Negotiation (PON) provides a principled negotiation framework (often termed Interest-Based Negotiation) designed to resolve workplace disputes while preserving long-term relationships.

2. The Core Pillars of Principled Negotiation
- Pillar 1: Separate the People from the Problem. Human beings are guided by emotions, ego defense mechanisms, and cognitive biases. When tackling difficult issues, professionals must separate relational friction from substantive problems. Avoid personal attacks and label actions rather than character.
- Pillar 2: Focus on Interests, Not Positions. Positions are what negotiators state they want (e.g., 'We demand 100% of the Q4 marketing budget'). Interests are the underlying drivers, fears, and aspirations (e.g., 'We must ensure our new digital product reaches market readiness without delays'). Exploring interests unlocks creative mutual solutions.
- Pillar 3: Invent Options for Mutual Gain. Do not assume a zero-sum pie. Brainstorm collaborative solutions in a psychologically safe environment before selecting the final outcome.
- Pillar 4: Insist on Objective Criteria. Base agreements on fair standards, industry benchmarks, legal precedents, or organizational data rather than arbitrary willpower or emotional coercion.

3. The Role of BATNA (Best Alternative to a Negotiated Agreement)
Understanding your BATNA provides psychological security and negotiation leverage. Before entering contentious discussions, evaluate what steps you will take if an agreement cannot be reached. Strengthening your BATNA prevents premature concessions and emotional capitulation.

4. Cross-Cultural Applications: Adapting to Asian & Vietnamese Workplaces
While Western negotiation literature strongly advocates direct confrontation and rapid feedback, Asian and Vietnamese workplace ethics place paramount importance on face-saving (Thể diện), indirect communication, and collective harmony. When resolving disputes in Vietnamese institutions, leaders should combine private 1-on-1 consultations before open committee deliberations, allowing all parties to preserve dignity while achieving business objectives.`;
              }
            }
          }

          // Hydrate seed draft lesson
          if (!parsed.lessons.some((l: any) => l.id === 'lesson-seed-draft-1')) {
            parsed.lessons.push({
              id: 'lesson-seed-draft-1',
              order: parsed.lessons.length + 1,
              category: 'Kỹ năng nâng cao',
              title: 'Nghệ thuật đàm phán đôi bên cùng có lợi (Win-Win) trong doanh nghiệp',
              summary: 'Ứng dụng mô hình đàm phán dựa trên nguyên tắc của Trường Luật Harvard (PON) vào môi trường công sở Việt Nam.',
              estimatedMinutes: 15,
              objectives: [
                'Nắm vững nguyên tắc tách con người khỏi vấn đề trong đàm phán nội bộ',
                'Hiểu và vận dụng khái niệm BATNA để tự tin bảo vệ quyền lợi chính đáng',
                'Biết cách khám phá lợi ích thực chất (Interests) thay vì cố chấp bảo vệ lập trường (Positions)'
              ],
              sections: [
                {
                  title: '1. Bốn trụ cột đàm phán nguyên tắc của Harvard',
                  content: 'Phương pháp đàm phán dựa trên nguyên tắc (Principled Negotiation) của Harvard tập trung vào việc: 1. Tách con người khỏi vấn đề; 2. Tập trung vào lợi ích thay vì lập trường; 3. Cùng kiến tạo nhiều phương án đôi bên cùng có lợi; 4. Kiên trì dựa trên các tiêu chuẩn khách quan.',
                  bulletPoints: [
                    'Tách con người khỏi vấn đề: Tránh công kích cá nhân hay xúc phạm nhân phẩm đồng nghiệp.',
                    'Tập trung vào lợi ích cốt lõi: Tìm hiểu lý do đằng sau đòi hỏi bề nổi.',
                    'Xác định BATNA: Luôn chuẩn bị phương án dự phòng tốt nhất trước khi bước vào phòng họp.'
                  ]
                }
              ],
              dos: ['Lắng nghe chủ động', 'Xác định rõ ràng BATNA'],
              donts: ['Không dùng ngôn từ công kích', 'Không áp đặt ý kiến chủ quan'],
              keyTakeaway: 'Đàm phán công sở thành công là cùng nhau tìm ra giải pháp tối ưu cho tổ chức.',
              reviewQuestion: {
                question: 'Theo nguyên tắc Harvard PON, khái niệm BATNA có vai trò gì quan trọng nhất?',
                options: [
                  'Là phương án dự phòng tốt nhất giúp đàm phán tự tin và tránh bị ép buộc',
                  'Là chiến thuật dùng áp lực chức vụ để đe dọa đối phương'
                ],
                correctIndex: 0,
                explanation: 'BATNA là điểm tựa an toàn giúp bạn biết rõ giới hạn chấp nhận được.'
              },
              status: 'draft',
              sourceReference: 'Harvard Program on Negotiation: Workplace Conflict Resolution Standards',
              sourceDocumentId: 'doc-seed-1',
              sourceAnalysisId: 'analysis-seed-1',
              editHistory: [
                {
                  editedAt: '2026-09-21 14:35',
                  editedBy: 'Hệ thống Quản trị',
                  summary: 'Tạo bản nháp tự động từ kết quả phân tích AI của tài liệu Harvard PON.'
                }
              ],
              createdBy: 'AI Content Studio (Bản nháp)',
              updatedAt: '2026-09-21'
            });
          }

          // Hydrate seed draft scenario
          if (parsed.scenarios && !parsed.scenarios.some((s: any) => s.id === 'scenario-seed-draft-1')) {
            parsed.scenarios.push({
              id: 'scenario-seed-draft-1',
              order: parsed.scenarios.length + 1,
              category: 'Xử lý mâu thuẫn & Tình huống khó',
              title: 'Tranh chấp ngân sách chiến dịch marketing giữa hai nhóm',
              characterRole: 'Trưởng ban điều phối dự án liên phòng ban',
              context: 'Ngân sách quý 4 bị cắt giảm 30% do biến động thị trường. Cả hai nhóm phát triển sản phẩm và truyền thông đều cho rằng dự án của nhóm mình mang tính sống còn.',
              problemStatement: 'Trong cuộc họp phân bổ ngân sách, bạn sẽ điều phối phiên thảo luận theo mô hình Harvard PON như thế nào?',
              options: [
                {
                  id: 'opt-1',
                  text: 'Tạm dừng cuộc họp 10 phút để hạ nhiệt, yêu cầu hai nhóm tách bạch con người khỏi vấn đề, cùng liệt kê các mục tiêu cốt lõi và tìm kiếm phương án hợp tác chia sẻ chi phí chung.',
                  quality: 'best',
                  feedbackTitle: 'Đàm phán nguyên tắc - Xuất sắc',
                  feedbackDescription: 'Hạ nhiệt cảm xúc, tách mâu thuẫn cá nhân và dẫn dắt hai bên cùng nhìn vào lợi ích tổng thể của doanh nghiệp.',
                  recommendedPhrasing: 'Chúng ta ở đây cùng một con thuyền. Hãy cùng thiết kế giải pháp dung hòa.',
                  scoreAwarded: 40
                }
              ],
              status: 'draft',
              difficulty: 'Nâng cao',
              skillTrained: 'Đàm phán giải quyết mâu thuẫn Harvard PON',
              sourceReference: 'Harvard Program on Negotiation: Workplace Conflict Resolution Standards',
              sourceDocumentId: 'doc-seed-1',
              sourceAnalysisId: 'analysis-seed-1',
              editHistory: [
                {
                  editedAt: '2026-09-21 14:35',
                  editedBy: 'Hệ thống Quản trị',
                  summary: 'Tạo bản nháp tình huống từ phân tích Harvard PON.'
                }
              ],
              createdBy: 'AI Content Studio (Bản nháp)',
              updatedAt: '2026-09-21'
            });
          }

          // Hydrate seed draft quiz
          if (parsed.quizQuestions && !parsed.quizQuestions.some((q: any) => q.id === 'q-seed-draft-1')) {
            parsed.quizQuestions.push({
              id: 'q-seed-draft-1',
              topicId: 'topic-ethics-conflicts',
              question: 'Thuật ngữ "BATNA" trong đàm phán và giải quyết xung đột nơi làm việc được hiểu là gì?',
              options: [
                'Best Alternative to a Negotiated Agreement - Phương án thay thế tốt nhất khi đàm phán không đạt kết quả',
                'Quy trình xử lý kỷ luật tạm thời đối với hành vi tiêu cực'
              ],
              correctAnswerIndex: 0,
              explanation: 'BATNA (Best Alternative to a Negotiated Agreement) là khái niệm cốt lõi của Harvard PON.',
              status: 'draft',
              difficulty: 'Trung bình',
              scoreAwarded: 20,
              sourceReference: 'Harvard Program on Negotiation: Workplace Conflict Resolution Standards',
              sourceDocumentId: 'doc-seed-1',
              sourceAnalysisId: 'analysis-seed-1',
              editHistory: [
                {
                  editedAt: '2026-09-21 14:35',
                  editedBy: 'Hệ thống Quản trị',
                  summary: 'Tạo câu hỏi bản nháp từ phân tích Harvard PON.'
                }
              ],
              createdBy: 'AI Content Studio (Bản nháp)',
              updatedAt: '2026-09-21'
            });
          }

          return parsed;
        }
      }
    } catch (err) {
      console.warn('Warning reading database file, initializing defaults:', err);
    }

    return this.initializeDefaultDatabase();
  }

  private initializeDefaultDatabase(): DatabaseSchema {
    const defaultLessons: AdminLesson[] = INITIAL_LESSONS.map((l) => ({
      ...l,
      status: 'published' as ContentStatus,
      sourceReference: 'Chuẩn mực Văn hóa Công sở & Đạo đức Công vụ Quốc gia 2026',
      createdBy: 'Hệ thống Quản trị',
      approvedBy: 'Hội đồng Thẩm định',
      updatedAt: '2026-10-01'
    }));

    const defaultScenarios: AdminScenario[] = INITIAL_SCENARIOS.map((s) => ({
      ...s,
      status: 'published' as ContentStatus,
      difficulty: s.order > 5 ? 'Nâng cao' : s.order > 2 ? 'Trung bình' : 'Cơ bản',
      skillTrained: s.category,
      sourceReference: 'Cẩm nang Kỹ năng Giao tiếp & Giải quyết Mâu thuẫn Thực chiến',
      createdBy: 'Hệ thống Quản trị',
      approvedBy: 'Hội đồng Thẩm định',
      updatedAt: '2026-10-01'
    }));

    const defaultQuestions: AdminQuizQuestion[] = INITIAL_QUIZ_QUESTIONS.map((q) => ({
      ...q,
      status: 'published' as ContentStatus,
      difficulty: 'Trung bình',
      scoreAwarded: 20,
      sourceReference: 'Ngân hàng Đề thi Đánh giá Năng lực Văn hóa Doanh nghiệp',
      createdBy: 'Hệ thống Quản trị',
      approvedBy: 'Hội đồng Thẩm định',
      updatedAt: '2026-10-01'
    }));

    // Ensure at least one admin account exists or can be provisioned
    const defaultUsers: UserAccount[] = INITIAL_USERS.map((u, idx) => ({
      ...u,
      // First seed user is an administrator for full management access
      isAdmin: idx === 0 ? true : false,
      role: idx === 0 ? 'Quản trị viên Hệ thống' : u.role
    }));

    const seedAnalyses: DocumentAnalysisRecord[] = [
      {
        id: 'analysis-seed-1',
        documentId: 'doc-seed-1',
        documentTitle: 'Harvard Program on Negotiation: Workplace Conflict Resolution Standards',
        sourceLanguage: 'English',
        vietnameseSummary:
          'Tài liệu nghiên cứu từ Harvard về đàm phán dựa trên nguyên tắc, tập trung vào việc tách con người khỏi vấn đề, thấu hiểu lợi ích cốt lõi thay vì cố chấp bảo vệ lập trường, và cùng xây dựng các phương án đôi bên cùng có lợi.',
        identifiedTopics: [
          'Tách bạch cảm xúc cá nhân khỏi công việc',
          'Mô hình đàm phán dựa trên lợi ích (Interest-Based Negotiation)',
          'Thiết lập tiêu chuẩn khách quan giải quyết mâu thuẫn'
        ],
        practicalProblemsSolved: [
          'Tranh chấp tài nguyên hoặc phân chia công việc giữa hai phòng ban.',
          'Bất đồng ý kiến trong việc lựa chọn nhà thầu hoặc đối tác công nghệ.'
        ],
        coreConcepts: [
          {
            term: 'BATNA',
            definition: 'Best Alternative to a Negotiated Agreement - Phương án thay thế tốt nhất khi đàm phán không đạt kết quả.'
          },
          {
            term: 'Interest vs Position',
            definition: 'Lợi ích sâu xa (cái họ thực sự cần) khác với lập trường bề nổi (cái họ đòi hỏi ban đầu).'
          }
        ],
        keyPrinciples: [
          'Luôn lắng nghe chủ động để thấu hiểu lợi ích tiềm ẩn của đối phương.',
          'Tránh công kích cá nhân hoặc gắn nhãn hành vi tiêu cực.',
          'Tạo không gian an toàn để cùng sáng tạo nhiều giải pháp trước khi quyết định.'
        ],
        suggestedScenarios: [
          {
            title: 'Tranh chấp ngân sách chiến dịch marketing giữa hai nhóm',
            context: 'Ngân sách bị cắt giảm 30% và cả hai nhóm đều cho rằng dự án của mình là sống còn.',
            challenge: 'Tìm kiếm phương án dung hòa lợi ích đôi bên mà không làm giảm hiệu quả chung.'
          }
        ],
        audienceSuitability: 'Rất phù hợp cho nhân viên từ 1 năm kinh nghiệm trở lên và các nhóm trưởng.',
        culturalNuancesAndRisks: [
          'Văn hóa phương Tây khuyến khích đối thoại trực diện, trong khi văn hóa Á Đông coi trọng giữ thể diện (Face-saving). Khi áp dụng tại Việt Nam cần kết hợp gặp gỡ riêng tư (1-on-1) trước khi đưa ra phòng họp chung.'
        ],
        novelCurriculumProposals: [
          {
            title: 'Nghệ thuật đàm phán đôi bên cùng có lợi (Win-Win) trong doanh nghiệp',
            category: 'Kỹ năng nâng cao',
            description: 'Ứng dụng mô hình Harvard vào môi trường công sở Việt Nam.',
            suggestedType: 'lesson'
          }
        ],
        analyzedAt: '2026-09-21 14:30',
        analyzedTimestamp: Date.now() - 86400000 * 30,
        analyzedBy: 'Hệ thống Quản trị',
        status: 'completed',
        generatedDraftsCount: {
          lessons: 1,
          scenarios: 1,
          quizzes: 2
        },
        generatedDraftIds: {
          lessonIds: [],
          scenarioIds: [],
          quizIds: []
        }
      }
    ];

    const initialDb: DatabaseSchema = {
      users: defaultUsers,
      lessons: defaultLessons,
      scenarios: defaultScenarios,
      quizQuestions: defaultQuestions,
      documents: [
        {
          id: 'doc-seed-1',
          title: 'Harvard Program on Negotiation: Workplace Conflict Resolution Standards',
          authorOrOrg: 'Harvard Law School PON',
          url: 'https://www.pon.harvard.edu/daily/conflict-resolution/workplace-conflict-resolution/',
          accessDate: '2026-09-20',
          sourceLanguage: 'English',
          targetLanguage: 'Tiếng Việt',
          topic: 'Giải quyết xung đột và Đàm phán nơi làm việc',
          targetAudienceNote: 'Cán bộ quản lý và chuyên viên văn phòng',
          sourceSnippet:
            'Principled negotiation focuses on separating people from the problem, focusing on interests rather than positions, inventing options for mutual gain, and insisting on using objective criteria.',
          fullContentLength: 4200,
          isVerified: true,
          status: 'analyzed',
          linkedContentCount: 2,
          createdAt: '2026-09-21',
          updatedAt: '2026-09-21',
          analysisResult: {
            detectedLanguage: 'English',
            vietnameseSummary:
              'Tài liệu nghiên cứu từ Harvard về đàm phán dựa trên nguyên tắc, tập trung vào việc tách con người khỏi vấn đề, thấu hiểu lợi ích cốt lõi thay vì cố chấp bảo vệ lập trường, và cùng xây dựng các phương án đôi bên cùng có lợi.',
            identifiedTopics: [
              'Tách bạch cảm xúc cá nhân khỏi công việc',
              'Mô hình đàm phán dựa trên lợi ích (Interest-Based Negotiation)',
              'Thiết lập tiêu chuẩn khách quan giải quyết mâu thuẫn'
            ],
            coreConcepts: [
              {
                term: 'BATNA',
                definition: 'Best Alternative to a Negotiated Agreement - Phương án thay thế tốt nhất khi đàm phán không đạt kết quả.'
              },
              {
                term: 'Interest vs Position',
                definition: 'Lợi ích sâu xa (cái họ thực sự cần) khác với lập trường bề nổi (cái họ đòi hỏi ban đầu).'
              }
            ],
            keyPrinciples: [
              'Luôn lắng nghe chủ động để thấu hiểu lợi ích tiềm ẩn của đối phương.',
              'Tránh công kích cá nhân hoặc gắn nhãn hành vi tiêu cực.',
              'Tạo không gian an toàn để cùng sáng tạo nhiều giải pháp trước khi quyết định.'
            ],
            practicalProblemsSolved: [
              'Tranh chấp tài nguyên hoặc phân chia công việc giữa hai phòng ban.',
              'Bất đồng ý kiến trong việc lựa chọn nhà thầu hoặc đối tác công nghệ.'
            ],
            suggestedScenarios: [
              {
                title: 'Tranh chấp ngân sách chiến dịch marketing giữa hai nhóm',
                context: 'Ngân sách bị cắt giảm 30% và cả hai nhóm đều cho rằng dự án của mình là sống còn.',
                challenge: 'Tìm kiếm phương án dung hòa lợi ích đôi bên mà không làm giảm hiệu quả chung.'
              }
            ],
            audienceSuitability: 'Rất phù hợp cho nhân viên từ 1 năm kinh nghiệm trở lên và các nhóm trưởng.',
            culturalNuancesAndRisks: [
              'Văn hóa phương Tây khuyến khích đối thoại trực diện, trong khi văn hóa Á Đông coi trọng giữ thể diện (Face-saving). Khi áp dụng tại Việt Nam cần kết hợp gặp gỡ riêng tư (1-on-1) trước khi đưa ra phòng họp chung.'
            ],
            novelCurriculumProposals: [
              {
                title: 'Nghệ thuật đàm phán đôi bên cùng có lợi (Win-Win) trong doanh nghiệp',
                category: 'Kỹ năng nâng cao',
                description: 'Ứng dụng mô hình Harvard vào môi trường công sở Việt Nam.',
                suggestedType: 'lesson'
              }
            ]
          }
        }
      ],
      documentAnalyses: seedAnalyses,
      aiProposals: [],
      auditLogs: [
        {
          id: 'log-seed-1',
          adminName: 'Hệ thống Quản trị',
          adminEmail: 'an.nguyen@congsochuyennghiep.vn',
          action: 'Khởi tạo hệ thống',
          targetType: 'system',
          targetTitle: 'Nền tảng Văn hóa Công sở 2026',
          timestamp: Date.now() - 86400000 * 3,
          details: 'Khởi tạo 10 bài học, 8 tình huống thực hành và ngân hàng câu hỏi trắc nghiệm.'
        }
      ],
      sessions: [],
      settings: {
        aiModel: 'gemini-3.8-flash',
        appName: 'Văn hoá công sở & Giao tiếp chuyên nghiệp',
        allowRegistration: true,
        requireDocumentVerification: false,
        lastBackupDate: new Date().toISOString()
      }
    };

    this.saveToFile(initialDb);
    return initialDb;
  }

  private saveToFile(db: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database.json:', err);
    }
  }

  // --- GETTERS & SAVE ---
  public reload(): DatabaseSchema {
    this.data = this.loadDatabase();
    return this.data;
  }

  public getDB(): DatabaseSchema {
    if (!this.data.documentAnalyses) {
      this.data.documentAnalyses = [];
    }
    return this.data;
  }

  public save(): void {
    this.saveToFile(this.data);
  }

  // --- DOCUMENT ANALYSIS RECORDS ---
  public getAnalysesByDocId(docId: string): DocumentAnalysisRecord[] {
    const db = this.getDB();
    return db.documentAnalyses
      .filter((a) => a.documentId === docId)
      .sort((a, b) => b.analyzedTimestamp - a.analyzedTimestamp);
  }

  public getLatestAnalysisByDocId(docId: string): DocumentAnalysisRecord | null {
    const list = this.getAnalysesByDocId(docId);
    return list.length > 0 ? list[0] : null;
  }

  public getAnalysisById(id: string): DocumentAnalysisRecord | null {
    const db = this.getDB();
    return db.documentAnalyses.find((a) => a.id === id) || null;
  }

  public saveAnalysis(analysis: DocumentAnalysisRecord): void {
    const db = this.getDB();
    const existingIndex = db.documentAnalyses.findIndex((a) => a.id === analysis.id);
    if (existingIndex >= 0) {
      db.documentAnalyses[existingIndex] = analysis;
    } else {
      db.documentAnalyses.unshift(analysis);
    }
    this.save();
  }

  public updateAnalysis(id: string, updates: Partial<DocumentAnalysisRecord>): DocumentAnalysisRecord | null {
    const db = this.getDB();
    const existingIndex = db.documentAnalyses.findIndex((a) => a.id === id);
    if (existingIndex === -1) return null;
    db.documentAnalyses[existingIndex] = {
      ...db.documentAnalyses[existingIndex],
      ...updates
    };
    this.save();
    return db.documentAnalyses[existingIndex];
  }

  // --- AUDIT LOG ---
  public logAction(
    admin: { name: string; email: string },
    action: string,
    targetType: AuditLog['targetType'],
    targetTitle: string,
    details?: string
  ): void {
    const log: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      adminName: admin.name,
      adminEmail: admin.email,
      action,
      targetType,
      targetTitle,
      timestamp: Date.now(),
      details
    };
    this.data.auditLogs.unshift(log);
    // Keep last 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
  }

  // --- SESSIONS ---
  public createSession(user: UserAccount): AdminSession {
    // Generate secure random token
    const token = 'adm_tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 12);
    const session: AdminSession = {
      token,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: 'admin',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    // Clean expired sessions
    this.data.sessions = this.data.sessions.filter((s) => s.expiresAt > Date.now());
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public verifySession(token?: string): AdminSession | null {
    if (!token) return null;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const session = this.data.sessions.find((s) => s.token === cleanToken);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.data.sessions = this.data.sessions.filter((s) => s.token !== cleanToken);
      this.save();
      return null;
    }
    return session;
  }

  public revokeSession(token: string): void {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    this.data.sessions = this.data.sessions.filter((s) => s.token !== cleanToken);
    this.save();
  }
}

export const dbManager = new DatabaseManager();
