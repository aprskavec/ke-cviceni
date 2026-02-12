import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch all lesson IDs (datocms_id) that have cached exercises
 */
export function useCachedLessonIds() {
  return useQuery({
    queryKey: ['cached-lesson-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_exercises_cache')
        .select('lesson_id');
      
      if (error) {
        console.error('Error fetching cached lesson IDs:', error);
        throw error;
      }
      
      // Return a Set for O(1) lookup
      // lesson_id in cache now matches datocms_id in lessons table
      return new Set(data.map(row => row.lesson_id));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
