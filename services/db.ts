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
export const resetDatabase = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/reset`, {
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
 * Clear all student results
 */
export const clearStudentResults = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/admin/results/clear`, {
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
