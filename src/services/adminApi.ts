import {
  AdminLesson,
  AdminScenario,
  AdminQuizQuestion,
  DocumentItem,
  DocumentAnalysisRecord,
  AiProposal,
  AuditLog,
  AdminDashboardStats
} from '../types';

const ADMIN_TOKEN_KEY = 'vccs_admin_token_v1';

export const AdminApiService = {
  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string | null, remember = true): void {
    if (!token) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } else if (remember) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = `Lỗi yêu cầu (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // Auth
  async checkStatus() {
    return this.request<{
      initialized: boolean;
      isLoggedInAdmin: boolean;
      adminUser: { id: string; name: string; email: string } | null;
    }>('/api/auth/status');
  },

  async login(emailOrUsername: string, password: string, remember = true) {
    const res = await this.request<{
      success: boolean;
      token: string;
      user: any;
    }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password })
    });
    if (res.token) {
      this.setToken(res.token, remember);
    }
    return res;
  },

  async setupInitialAdmin(name: string, email: string, password: string) {
    const res = await this.request<{
      success: boolean;
      token: string;
      user: any;
    }>('/api/auth/setup-initial-admin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (res.token) {
      this.setToken(res.token, true);
    }
    return res;
  },

  async logout() {
    try {
      await this.request('/api/auth/admin-logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.setToken(null);
    }
  },

  // Stats
  async getStats(): Promise<AdminDashboardStats> {
    return this.request<AdminDashboardStats>('/api/admin/stats');
  },

  // Lessons
  async getLessons(): Promise<AdminLesson[]> {
    return this.request<AdminLesson[]>('/api/admin/lessons');
  },

  async createLesson(lesson: Partial<AdminLesson>): Promise<{ success: boolean; lesson: AdminLesson }> {
    return this.request('/api/admin/lessons', {
      method: 'POST',
      body: JSON.stringify(lesson)
    });
  },

  async updateLesson(id: string, updates: Partial<AdminLesson>): Promise<{ success: boolean; lesson: AdminLesson }> {
    return this.request(`/api/admin/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteLesson(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admin/lessons/${id}`, {
      method: 'DELETE'
    });
  },

  // Scenarios
  async getScenarios(): Promise<AdminScenario[]> {
    return this.request<AdminScenario[]>('/api/admin/scenarios');
  },

  async createScenario(scenario: Partial<AdminScenario>): Promise<{ success: boolean; scenario: AdminScenario }> {
    return this.request('/api/admin/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenario)
    });
  },

  async updateScenario(
    id: string,
    updates: Partial<AdminScenario>
  ): Promise<{ success: boolean; scenario: AdminScenario }> {
    return this.request(`/api/admin/scenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteScenario(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admin/scenarios/${id}`, {
      method: 'DELETE'
    });
  },

  // Quizzes
  async getQuizzes(): Promise<AdminQuizQuestion[]> {
    return this.request<AdminQuizQuestion[]>('/api/admin/quizzes');
  },

  async createQuiz(question: Partial<AdminQuizQuestion>): Promise<{ success: boolean; quizQuestion: AdminQuizQuestion }> {
    return this.request('/api/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify(question)
    });
  },

  async updateQuiz(
    id: string,
    updates: Partial<AdminQuizQuestion>
  ): Promise<{ success: boolean; quizQuestion: AdminQuizQuestion }> {
    return this.request(`/api/admin/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteQuiz(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admin/quizzes/${id}`, {
      method: 'DELETE'
    });
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    return this.request<DocumentItem[]>('/api/admin/documents');
  },

  async createDocument(data: {
    title: string;
    authorOrOrg?: string;
    url?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    topic?: string;
    targetAudienceNote?: string;
    content: string;
    isVerified?: boolean;
  }): Promise<{ success: boolean; document: DocumentItem; isDuplicate: boolean }> {
    return this.request('/api/admin/documents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getDocumentDetails(id: string): Promise<{
    document: DocumentItem;
    originalContent: string;
    analyses: DocumentAnalysisRecord[];
    linkedLessons: AdminLesson[];
    linkedScenarios: AdminScenario[];
    linkedQuizzes: AdminQuizQuestion[];
    linkedCount: number;
  }> {
    return this.request(`/api/admin/documents/${id}/details`);
  },

  async updateDocument(
    id: string,
    updates: Partial<DocumentItem>
  ): Promise<{ success: boolean; document: DocumentItem }> {
    return this.request(`/api/admin/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteDocument(id: string, strategy: 'check' | 'disassociate' | 'cascade' | 'keep' = 'check'): Promise<{
    success?: boolean;
    message?: string;
    unlinkedCount?: number;
    requiresConfirmation?: boolean;
    linkedCount?: number;
  }> {
    return this.request(`/api/admin/documents/${id}?strategy=${strategy}`, {
      method: 'DELETE'
    });
  },

  async reanalyzeDocument(id: string): Promise<{
    success: boolean;
    analysis: DocumentAnalysisRecord;
    createdDrafts: any;
    allAnalyses: DocumentAnalysisRecord[];
  }> {
    return this.request(`/api/admin/documents/${id}/reanalyze`, {
      method: 'POST'
    });
  },

  async fetchUrl(url: string): Promise<{
    success: boolean;
    title: string;
    sourceLength: number;
    extractedContent: string;
  }> {
    return this.request('/api/admin/ai/fetch-url', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  },

  // Learning Content Repository
  async getLearningContent(params: {
    type?: string;
    sourceDocumentId?: string;
    status?: string;
    search?: string;
  } = {}): Promise<{
    items: Array<{
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
      status: string;
      createdBy?: string;
      approvedBy?: string;
      editHistory?: Array<{ editedAt: string; editedBy: string; summary: string }>;
      rawData: any;
    }>;
    totalCount: number;
    counts: {
      total: number;
      lessons: number;
      scenarios: number;
      quizzes: number;
      analyses: number;
      drafts: number;
      pending: number;
      published: number;
      archived: number;
    };
    availableDocuments: Array<{ id: string; title: string; linkedCount: number }>;
  }> {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.sourceDocumentId) query.set('sourceDocumentId', params.sourceDocumentId);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return this.request(`/api/admin/learning-content${qs ? `?${qs}` : ''}`);
  },

  async updateLearningContent(type: string, id: string, updates: any): Promise<{
    success: boolean;
    message: string;
    item: any;
  }> {
    return this.request(`/api/admin/learning-content/${type}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async duplicateLearningContent(type: string, id: string): Promise<{
    success: boolean;
    message: string;
    item: any;
  }> {
    return this.request(`/api/admin/learning-content/${type}/${id}/duplicate`, {
      method: 'POST'
    });
  },

  async deleteLearningContent(type: string, id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/admin/learning-content/${type}/${id}`, {
      method: 'DELETE'
    });
  },

  // AI Content Studio
  async analyzeDocument(params: {
    documentId?: string;
    rawContent?: string;
    sourceLanguage?: string;
    targetAudienceNote?: string;
    forceReanalyze?: boolean;
  }) {
    return this.request<{
      success: boolean;
      analysis: DocumentAnalysisRecord;
      createdDrafts?: {
        lessons: number;
        scenarios: number;
        quizzes: number;
        lessonIds: string[];
        scenarioIds: string[];
        quizIds: string[];
      };
      isRestoredFromSaved?: boolean;
    }>('/api/admin/ai/analyze-document', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getDocumentAnalysis(documentId: string) {
    return this.request<{
      latest: DocumentAnalysisRecord | null;
      history: DocumentAnalysisRecord[];
    }>(`/api/admin/documents/${documentId}/analysis`);
  },

  async regenerateDrafts(analysisId: string) {
    return this.request<{
      success: boolean;
      analysis: DocumentAnalysisRecord;
      createdDrafts: {
        lessons: number;
        scenarios: number;
        quizzes: number;
        lessonIds: string[];
        scenarioIds: string[];
        quizIds: string[];
      };
    }>('/api/admin/ai/regenerate-drafts', {
      method: 'POST',
      body: JSON.stringify({ analysisId })
    });
  },

  async generateLesson(params: {
    topic: string;
    sourceExcerpt?: string;
    targetAudience?: string;
    directives?: string;
    documentId?: string;
  }) {
    return this.request<{
      success: boolean;
      proposalId: string;
      proposal: AiProposal;
    }>('/api/admin/ai/generate-lesson', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async generateScenario(params: {
    scenarioTopic: string;
    sourceExcerpt?: string;
    targetAudience?: string;
    directives?: string;
    documentId?: string;
  }) {
    return this.request<{
      success: boolean;
      proposalId: string;
      proposal: AiProposal;
    }>('/api/admin/ai/generate-scenario', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async generateQuiz(params: {
    topic: string;
    sourceExcerpt?: string;
    questionCount?: number;
    directives?: string;
    documentId?: string;
  }) {
    return this.request<{
      success: boolean;
      proposalId: string;
      proposal: AiProposal;
    }>('/api/admin/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async refineContent(params: {
    proposalId?: string;
    currentContent: any;
    instruction: string;
  }) {
    return this.request<{
      success: boolean;
      refinedContent: any;
    }>('/api/admin/ai/refine-content', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Proposals & Moderation
  async getProposals(): Promise<AiProposal[]> {
    return this.request<AiProposal[]>('/api/admin/proposals');
  },

  async updateProposal(id: string, updates: Partial<AiProposal>): Promise<{ success: boolean; proposal: AiProposal }> {
    return this.request(`/api/admin/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async approveProposal(id: string, targetStatus: 'published' | 'draft' = 'published') {
    return this.request<{ success: boolean; message: string }>(`/api/admin/proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus })
    });
  },

  async rejectProposal(id: string, reason: string) {
    return this.request<{ success: boolean; message: string }>(`/api/admin/proposals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Users & Logs & Settings
  async getUsers() {
    return this.request<any[]>('/api/admin/users');
  },

  async updateUserRole(id: string, isAdmin: boolean, role?: string) {
    return this.request<{ success: boolean; user: any }>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ isAdmin, role })
    });
  },

  async getLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/admin/logs');
  },

  async getSettings() {
    return this.request<any>('/api/admin/settings');
  },

  async updateSettings(settings: any) {
    return this.request<{ success: boolean; settings: any }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
