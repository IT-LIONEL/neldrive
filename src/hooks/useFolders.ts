import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFolders = (parentId: string | null, searchQuery: string) => {
  const query = useQuery({
    queryKey: ["folders", parentId, searchQuery],
    queryFn: async () => {
      let queryBuilder = supabase
        .from("folders")
        .select("id, name, created_at, parent_id, is_locked, password_hash")
        .order("created_at", { ascending: false });

      // If searching, search across ALL folders (global search)
      if (searchQuery) {
        queryBuilder = queryBuilder.ilike("name", `%${searchQuery}%`);
      } else {
        // Only filter by parent when not searching
        if (parentId) {
          queryBuilder = queryBuilder.eq("parent_id", parentId);
        } else {
          queryBuilder = queryBuilder.is("parent_id", null);
        }
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data || [];
    },
  });

  return {
    folders: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
