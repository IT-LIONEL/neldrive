import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAllOfflineFiles, getUploadQueue, removeFromUploadQueue } from '@/lib/offlineStorage';
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

        // Process queued uploads
        const queuedUploads = await getUploadQueue();
        
        if (queuedUploads.length > 0) {
          toast.info(`Uploading ${queuedUploads.length} queued ${queuedUploads.length === 1 ? 'file' : 'files'}...`);
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          let successCount = 0;
          
          for (const upload of queuedUploads) {
            try {
              // Upload to storage
              const fileExt = upload.name.split(".").pop();
              const fileName = `${user.id}/${Date.now()}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from("user-files")
                .upload(fileName, upload.data);

              if (uploadError) throw uploadError;

              // Create database record
              const { error: dbError } = await supabase.from("files").insert({
                name: upload.name,
                folder_id: upload.folder_id,
                user_id: user.id,
                storage_path: fileName,
                file_type: upload.file_type,
                file_size: upload.file_size,
              });

              if (dbError) throw dbError;

              // Remove from queue
              await removeFromUploadQueue(upload.id);
              successCount++;
            } catch (error) {
              console.error('Failed to upload queued file:', error);
            }
          }

          if (successCount > 0) {
            toast.success(`${successCount} ${successCount === 1 ? 'file' : 'files'} uploaded successfully!`);
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
