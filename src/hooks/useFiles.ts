import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFiles = (folderId: string | null, searchQuery: string) => {
  const query = useQuery({
    queryKey: ["files", folderId, searchQuery],
    queryFn: async () => {
      let queryBuilder = supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      // If searching, search across ALL files (global search)
      if (searchQuery) {
        queryBuilder = queryBuilder.ilike("name", `%${searchQuery}%`);
      } else {
        // Only filter by folder when not searching
        if (folderId) {
          queryBuilder = queryBuilder.eq("folder_id", folderId);
        } else {
          queryBuilder = queryBuilder.is("folder_id", null);
        }
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data || [];
    },
  });

  return {
    files: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
