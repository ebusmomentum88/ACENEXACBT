// services/db.ts
import { SubjectInfo, ExamResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://acenexacbt-5b6j.onrender.com/api';

/**
 * Fetch all subjects from backend
 */
export const getAllSubjects = async (): Promise<SubjectInfo[]> => {
  try {
    const res = await fetch(`${API_BASE}/subjects`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // include cookies/session if needed
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    }
    const data = await res.json();
    // Ensure returned data matches SubjectInfo[]
    return data as SubjectInfo[];
  } catch (err: any) {
    console.error(err);
    return [];
  }
};

/**
 * Fetch student exam history/results
 * @param username string
 */
export const getStudentResults = async (username: string): Promise<ExamResult[]> => {
  try {
    const res = await fetch(`${API_BASE}/students/${username}/results`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch results: ${res.statusText}`);
    }
    const data = await res.json();
    // Ensure returned data matches ExamResult[]
    return data as ExamResult[];
  } catch (err: any) {
    console.error(err);
    return [];
  }
};

/**
 * Get question bank statistics
 */
export const getBankStats = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch bank stats: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(err);
    return {};
  }
};

/**
 * Add a single question to the question bank
 */
export const addQuestionToBank = async (question: any): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(question),
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Add multiple questions in bulk
 */
export const addBulkQuestions = async (questions: any[]): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/questions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ questions }),
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Fetch all questions from the bank
 */
export const fetchAllQuestions = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/admin/questions`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch questions: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(err);
    return [];
  }
};

/**
 * Delete a question from the bank
 */
export const deleteQuestion = async (questionId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Reset the entire database
 */
export const resetDatabase = async (confirmWipe?: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirm: confirmWipe }),
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Clear all student results
 */
export const clearStudentResults = async (username?: string): Promise<boolean> => {
  try {
    const endpoint = username 
      ? `${API_BASE}/admin/students/${username}/results/clear`
      : `${API_BASE}/admin/results/clear`;
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Add a new subject
 */
export const addSubject = async (name: string, category: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, category }),
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Delete a subject
 */
export const deleteSubject = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Initialize database - fetch and cache questions
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    // Try to fetch fresh data from backend
    const questions = await fetchAllQuestions();
    if (questions.length > 0) {
      // Cache questions locally
      localStorage.setItem('cached_questions', JSON.stringify(questions));
      return true;
    }
    return false;
  } catch (err: any) {
    console.error('Database initialization failed:', err);
    // Try to use cached data
    const cached = localStorage.getItem('cached_questions');
    return !!cached;
  }
};

/**
 * Start an exam session
 */
export const startExam = (subjects: any[], examType: string): any => {
  try {
    const cached = localStorage.getItem('cached_questions');
    const allQuestions = cached ? JSON.parse(cached) : [];
    
    // Filter questions by exam type and subjects
    const questionsBySubject: Record<string, any[]> = {};
    subjects.forEach(subject => {
      const subjectQuestions = allQuestions.filter(
        (q: any) => q.subject === subject && q.examType === examType
      );
      questionsBySubject[subject] = subjectQuestions;
    });
    
    return {
      id: `session-${Date.now()}`,
      examType,
      subjects,
      questions: questionsBySubject,
      answers: {},
      markedForReview: [],
      startTime: Date.now(),
      durationSeconds: examType === 'JAMB' ? 7200 : 10800, // 2hrs JAMB, 3hrs WAEC
      isSubmitted: false
    };
  } catch (err: any) {
    console.error('Start exam failed:', err);
    throw err;
  }
};

/**
 * Calculate exam result
 */
export const calculateResult = (session: any): any => {
  const scoreBySubject: Record<string, any> = {};
  let totalScore = 0;
  let totalQuestions = 0;
  
  Object.keys(session.questions).forEach(subject => {
    const questions = session.questions[subject];
    let correct = 0;
    
    questions.forEach((q: any) => {
      totalQuestions++;
      if (session.answers[q.id] === q.correctOption) {
        correct++;
        totalScore++;
      }
    });
    
    const total = questions.length;
    scoreBySubject[subject] = {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  });
  
  const overallPercentage = totalQuestions > 0 
    ? Math.round((totalScore / totalQuestions) * 100) 
    : 0;
  
  return {
    id: `result-${Date.now()}`,
    examType: session.examType,
    timestamp: Date.now(),
    subjects: session.subjects,
    scoreBySubject,
    totalScore,
    totalQuestions,
    overallPercentage,
    session // Include full session for review
  };
};

/**
 * Save student result
 */
export const saveStudentResult = async (username: string, result: any): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/students/${username}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(result),
    });
    
    if (!res.ok) {
      throw new Error('Failed to save result online');
    }
    
    return true;
  } catch (err: any) {
    console.error('Save result failed, storing offline:', err);
    
    // Save to offline queue
    const offlineResults = JSON.parse(localStorage.getItem('offline_results') || '[]');
    offlineResults.push({
      username,
      result,
      timestamp: Date.now()
    });
    localStorage.setItem('offline_results', JSON.stringify(offlineResults));
    
    throw new Error('Saved offline - will sync when online');
  }
};

/**
 * Sync offline results to backend
 */
export const syncOfflineResults = async (): Promise<number> => {
  try {
    const offlineResults = JSON.parse(localStorage.getItem('offline_results') || '[]');
    
    if (offlineResults.length === 0) {
      return 0;
    }
    
    let synced = 0;
    const failed: any[] = [];
    
    for (const item of offlineResults) {
      try {
        const res = await fetch(`${API_BASE}/students/${item.username}/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item.result),
        });
        
        if (res.ok) {
          synced++;
        } else {
          failed.push(item);
        }
      } catch (err) {
        failed.push(item);
      }
    }
    
    // Update offline queue with only failed items
    localStorage.setItem('offline_results', JSON.stringify(failed));
    
    return synced;
  } catch (err: any) {
    console.error('Sync failed:', err);
    return 0;
  }
};
