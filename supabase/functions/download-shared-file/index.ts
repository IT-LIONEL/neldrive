import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
  storagePath: string;
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
    const { token, storagePath }: RequestBody = await req.json();

    if (!token || !storagePath) {
      console.error("Missing token or storagePath");
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Checking if file is shareable with token:", token);

    // Verify the file is shareable
    const { data: fileData, error: fileError } = await supabase
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

    if (!fileData) {
      console.error("File not found or not shareable");
      return new Response(
        JSON.stringify({ error: 'File not found or not shared' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("File verified, downloading from storage:", storagePath);

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
