import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STEG_API_BASE = "https://rzjvlwrzqvtagsemscav.supabase.co/functions/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('STEGANOGRAPHY_API_KEY');
    if (!apiKey) {
      console.error('STEGANOGRAPHY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, imageData, width, height, data, type, password } = await req.json();
    console.log(`Processing steganography action: ${action}, dimensions: ${width}x${height}`);

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action is required (hide or extract)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let endpoint: string;
    let body: Record<string, unknown>;

    if (action === 'hide') {
      if (!imageData || !width || !height || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: imageData, width, height, data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      endpoint = `${STEG_API_BASE}/hide-data`;
      body = {
        imageData,
        width,
        height,
        data,
        type: type || 'text',
        password: password || undefined,
      };
    } else if (action === 'extract') {
      if (!imageData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required field: imageData' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      endpoint = `${STEG_API_BASE}/extract-data`;
      body = {
        imageData,
        password: password || undefined,
      };
    } else if (action === 'capacity') {
      if (!width || !height) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: width, height' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      endpoint = `${STEG_API_BASE}/check-capacity`;
      body = { width, height };
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Use: hide, extract, or capacity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calling external API: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log(`API response status: ${response.status}, success: ${result.success}`);

    return new Response(
      JSON.stringify(result),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Steganography function error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
