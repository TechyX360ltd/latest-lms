import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock Supabase client if environment variables are missing
const createMockSupabaseClient = () => {
  console.warn('Supabase environment variables not found. Running in offline mode with localStorage.');
  
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    }),
  } as any;
};

// Export Supabase client - use mock if environment variables are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

export function isValidUUID(id: string | undefined | null): boolean {
  return !!id && /^[0-9a-fA-F-]{36}$/.test(id);
}

// Get a user's note for a lesson
export async function getLessonNote(userId: string, lessonId: string) {
  if (!isValidUUID(lessonId)) return null;
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();
  if (error && error.code !== 'PGRST116') return { error };
  return { note: data };
}

// Upsert (insert or update) a user's note for a lesson
export async function upsertLessonNote(userId: string, lessonId: string, content: string) {
  if (!isValidUUID(lessonId)) throw new Error('Invalid lessonId');
  const { data, error } = await supabase
    .from('lesson_notes')
    .upsert([{ user_id: userId, lesson_id: lessonId, content }], { onConflict: ['user_id', 'lesson_id'] });
  return { data, error };
}

// Get all discussion comments for a lesson
export async function getLessonDiscussions(lessonId: string) {
  if (!isValidUUID(lessonId)) return [];
  const { data, error } = await supabase
    .from('lesson_discussions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true });
  return { discussions: data, error };
}

// Add a new discussion comment (or reply) for a lesson
export async function addLessonDiscussion(userId: string, lessonId: string, content: string, parentId?: string) {
  if (!isValidUUID(lessonId)) throw new Error('Invalid lessonId');
  const { data, error } = await supabase
    .from('lesson_discussions')
    .insert([{ user_id: userId, lesson_id: lessonId, content, parent_id: parentId || null }]);
  return { data, error };
}