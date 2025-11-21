import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAllOfflineFiles } from '@/lib/offlineStorage';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  useEffect(() => {
    const handleOnline = async () => {
      try {
        // Check if there are offline files that need syncing
        const offlineFiles = await getAllOfflineFiles();
        
        if (offlineFiles.length > 0) {
          // Verify files still exist in the database
          const { data: dbFiles, error } = await supabase
            .from('files')
            .select('id, is_offline')
            .eq('is_offline', true);

          if (error) throw error;

          const dbFileIds = new Set(dbFiles?.map(f => f.id) || []);
          
          // Sync status
          let syncedCount = 0;
          
          for (const offlineFile of offlineFiles) {
            if (dbFileIds.has(offlineFile.id)) {
              syncedCount++;
            }
          }

          if (syncedCount > 0) {
            toast.success(`Back online! ${syncedCount} offline ${syncedCount === 1 ? 'file' : 'files'} synced`);
          }
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
};
