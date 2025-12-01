import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB limit

export const useStorage = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["storage-usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { used: 0, total: MAX_STORAGE_BYTES, percentage: 0 };

      const { data: files, error } = await supabase
        .from("files")
        .select("file_size")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching storage:", error);
        return { used: 0, total: MAX_STORAGE_BYTES, percentage: 0 };
      }

      const usedBytes = files?.reduce((acc, file) => acc + (file.file_size || 0), 0) || 0;
      const percentage = (usedBytes / MAX_STORAGE_BYTES) * 100;

      return {
        used: usedBytes,
        total: MAX_STORAGE_BYTES,
        percentage: Math.min(percentage, 100),
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  return {
    usedBytes: data?.used || 0,
    totalBytes: data?.total || MAX_STORAGE_BYTES,
    percentage: data?.percentage || 0,
    isLoading,
    refetch,
  };
};

export const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};
