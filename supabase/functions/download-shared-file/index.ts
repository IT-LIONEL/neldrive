import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
  storagePath: string;
  folderToken?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Download shared file function called");

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { token, storagePath, folderToken }: RequestBody = await req.json();

    if (!storagePath || (!token && !folderToken)) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let fileData: any = null;

    // Check if this is a folder-based share
    if (folderToken) {
      console.log("Checking folder share with token:", folderToken);
      
      // Verify the folder is shareable and get the file
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('id, share_expires_at, is_shareable')
        .eq('shareable_token', folderToken)
        .eq('is_shareable', true)
        .single();

      if (folderError || !folderData) {
        console.error("Folder not found or not shareable");
        return new Response(
          JSON.stringify({ error: 'Folder not found or not shared' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check expiration
      if (folderData.share_expires_at && new Date(folderData.share_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Share link has expired' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get file from the shared folder
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderData.id)
        .eq('storage_path', storagePath)
        .single();

      if (fileError || !file) {
        console.error("File not found in shared folder");
        return new Response(
          JSON.stringify({ error: 'File not found in shared folder' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      fileData = file;
    } else {
      console.log("Checking file share with token:", token);

      // Verify the file is shareable directly
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('shareable_token', token)
        .eq('is_shareable', true)
        .maybeSingle();

      if (fileError) {
        console.error("Error fetching file metadata:", fileError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify file' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!file) {
        console.error("File not found or not shareable");
        return new Response(
          JSON.stringify({ error: 'File not found or not shared' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      fileData = file;
    }

    console.log("File verified, downloading from storage:", storagePath);

    // Log the download audit
    try {
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      await supabase.from('file_audit_logs').insert({
        file_id: fileData.id,
        user_id: fileData.user_id,
        action: 'download',
        ip_address: clientIp,
        user_agent: userAgent,
      });
      console.log("Audit log created for shared file download");
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
      // Don't fail the download if audit logging fails
    }

    // Download file from storage using service role
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('user-files')
      .download(storagePath);

    if (downloadError) {
      console.error("Error downloading file from storage:", downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("File downloaded successfully, size:", fileBlob.size);

    // Convert blob to array buffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    return new Response(
      JSON.stringify({
        file: Array.from(uint8Array),
        fileName: fileData.name,
        fileType: fileData.file_type,
        fileSize: fileData.file_size
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in download-shared-file function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
