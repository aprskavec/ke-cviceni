import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lesson, LessonSummary } from "@/data/lessons";
import type { LessonLevel } from "@/data/lessonMetadata";

interface DbLesson {
  id: string;
  datocms_id: string;
  video_upload_id: string;
  name: string;
  kind: string;
  order: number;
  level: string;
  cefr: string;
  summary: unknown;
  created_at: string;
  updated_at: string;
}

// Transform database lesson to app Lesson format
function transformLesson(dbLesson: DbLesson): Lesson {
  const summary = dbLesson.summary as LessonSummary | null;
  
  return {
    id: dbLesson.datocms_id, // Use datocms_id as the app-level ID for compatibility
    name: dbLesson.name,
    kind: dbLesson.kind,
    order: dbLesson.order,
    level: dbLesson.level as Lesson['level'],
    cefr: dbLesson.cefr,
    video_upload_id: dbLesson.video_upload_id,
    createdAt: dbLesson.created_at,
    summary: summary || undefined,
    // Note: interactions are not stored in DB yet - they were only in static data
  };
}

export function useLessons(levelFilter?: LessonLevel) {
  return useQuery({
    queryKey: ['lessons', levelFilter],
    queryFn: async () => {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (levelFilter) {
        query = query.eq('level', levelFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching lessons:', error);
        throw error;
      }
      
      return (data as DbLesson[]).map(transformLesson);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('datocms_id', lessonId)
        .single();
      
      if (error) {
        console.error('Error fetching lesson:', error);
        throw error;
      }
      
      return transformLesson(data as DbLesson);
    },
    enabled: !!lessonId,
  });
}

// Get lesson counts by level
export function useLessonCounts() {
  return useQuery({
    queryKey: ['lesson-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('level');
      
      if (error) {
        console.error('Error fetching lesson counts:', error);
        throw error;
      }
      
      const counts: Record<LessonLevel, number> = {
        Zacatecnik: 0,
        Pokrocily: 0,
        Frajeris: 0,
      };
      
      data.forEach((lesson) => {
        const level = lesson.level as LessonLevel;
        if (counts[level] !== undefined) {
          counts[level]++;
        }
      });
      
      return counts;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
