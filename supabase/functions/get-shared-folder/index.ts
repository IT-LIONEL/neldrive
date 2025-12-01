import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action, passwordHash } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "info") {
      // Get folder info
      const { data: folder, error } = await supabase
        .from("folders")
        .select("id, name, share_password_hash, share_expires_at, is_shareable")
        .eq("shareable_token", token)
        .eq("is_shareable", true)
        .single();

      if (error || !folder) {
        return new Response(JSON.stringify({ error: "Folder not found or not shared" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isExpired = folder.share_expires_at && new Date(folder.share_expires_at) < new Date();

      return new Response(JSON.stringify({
        folder_id: folder.id,
        folder_name: folder.name,
        has_password: !!folder.share_password_hash,
        is_expired: isExpired,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      // Verify password
      const { data: folder, error } = await supabase
        .from("folders")
        .select("share_password_hash")
        .eq("shareable_token", token)
        .eq("is_shareable", true)
        .single();

      if (error || !folder) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        valid: folder.share_password_hash === passwordHash,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "files") {
      // Get folder first to check permissions
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("id, share_password_hash, share_expires_at, is_shareable")
        .eq("shareable_token", token)
        .eq("is_shareable", true)
        .single();

      if (folderError || !folder) {
        return new Response(JSON.stringify({ error: "Folder not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiration
      if (folder.share_expires_at && new Date(folder.share_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Share link expired" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check password if required
      if (folder.share_password_hash && folder.share_password_hash !== passwordHash) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get files
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("id, name, file_type, file_size, storage_path, created_at")
        .eq("folder_id", folder.id);

      if (filesError) {
        return new Response(JSON.stringify({ error: "Failed to fetch files" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ files: files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});