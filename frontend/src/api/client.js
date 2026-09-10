// API Client for Modern Placement Launchpad
const API_BASE = '/api';

export const apiClient = {
  // Health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err) {
      console.warn('Backend not reached, using offline mode:', err);
      return { status: 'offline' };
    }
  },

  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return await res.json();
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return await res.json();
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo`, { method: 'POST' });
    return await res.json();
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await res.json();
  },

  // Dashboard
  async getDashboard(userId = 'student-demo-101') {
    const res = await fetch(`${API_BASE}/dashboard/${userId}`);
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return await res.json();
  },

  // Profile
  async getProfile(userId) {
    const res = await fetch(`${API_BASE}/profile/${userId}`);
    return await res.json();
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/profile/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return await res.json();
  },

  // Assessments
  async getAssessmentCategories() {
    const res = await fetch(`${API_BASE}/assessments/categories`);
    return await res.json();
  },

  async getQuestions(category) {
    const res = await fetch(`${API_BASE}/assessments/questions/${encodeURIComponent(category)}`);
    return await res.json();
  },

  async submitAssessment(data) {
    const res = await fetch(`${API_BASE}/assessments/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getAssessmentHistory(userId) {
    const res = await fetch(`${API_BASE}/assessments/history/${userId}`);
    return await res.json();
  },

  // Roadmap
  async getRoadmap(userId = 'student-demo-101') {
    const res = await fetch(`${API_BASE}/roadmap/${userId}`);
    return await res.json();
  },

  async toggleRoadmapNode(userId, nodeId) {
    const res = await fetch(`${API_BASE}/roadmap/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, node_id: nodeId })
    });
    return await res.json();
  },

  // Content
  async getAllContent() {
    const res = await fetch(`${API_BASE}/content`);
    return await res.json();
  },

  async getCategoryContent(categoryKey) {
    const res = await fetch(`${API_BASE}/content/${categoryKey}`);
    return await res.json();
  },

  // YouTube
  async searchVideos(topic) {
    const res = await fetch(`${API_BASE}/youtube/search?q=${encodeURIComponent(topic)}`);
    return await res.json();
  },

  // AI Mock Interview
  async getInterviewQuestions(type = '') {
    const url = type ? `${API_BASE}/interview/questions?type=${type}` : `${API_BASE}/interview/questions`;
    const res = await fetch(url);
    return await res.json();
  },

  async startInterview(userId, type, role) {
    const res = await fetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, type, role })
    });
    return await res.json();
  },

  async evaluateInterviewAnswer(data) {
    const res = await fetch(`${API_BASE}/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getInterviewSessions(userId) {
    const res = await fetch(`${API_BASE}/interview/sessions/${userId}`);
    return await res.json();
  },

  // Resume Analysis
  async analyzeResume(userId, resumeText, targetRole) {
    const res = await fetch(`${API_BASE}/resume/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        resume_text: resumeText,
        target_role: targetRole
      })
    });
    return await res.json();
  },

  // Recommendations
  async getRecommendations(userId = 'student-demo-101') {
    const res = await fetch(`${API_BASE}/recommendations/${userId}`);
    return await res.json();
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return await res.json();
  },

  async getAdminStudents() {
    const res = await fetch(`${API_BASE}/admin/students`);
    return await res.json();
  },

  async addAdminQuestion(data) {
    const res = await fetch(`${API_BASE}/admin/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async addAdminTopic(data) {
    const res = await fetch(`${API_BASE}/admin/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // AI Career Coach & Placement Copilot
  async coachChat({ message, sessionId = null, candidateContext = null, token = null }) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/coach/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        session_id: sessionId,
        candidate_context: candidateContext
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to get coach response');
    }
    return await res.json();
  },

  async getCoachQuickPrompts() {
    const res = await fetch(`${API_BASE}/coach/quick-prompts`);
    if (!res.ok) return { prompts: [] };
    return await res.json();
  }
};
