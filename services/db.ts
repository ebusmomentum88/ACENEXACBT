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
