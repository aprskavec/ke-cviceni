/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Removing background from image:', imageUrl.substring(0, 100) + '...');

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    console.log('Image fetched, size:', imageBlob.size, 'bytes');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Calling OpenAI gpt-image-1 to remove background...');

    // Use multipart/form-data for OpenAI image edit API with gpt-image-1 parameters
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('image[]', imageBlob, 'image.png');
    formData.append('prompt', 'Remove the background completely. Keep only the main subject (character, mascot, person, object) with clean precise edges. Make the background fully transparent.');
    formData.append('size', '1024x1024');
    formData.append('quality', 'high');
    formData.append('output_format', 'png');
    formData.append('background', 'transparent');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const generatedImageBase64 = data.data?.[0]?.b64_json;

    if (!generatedImageBase64) {
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('OpenAI did not return an image');
    }

    const resultImageUrl = `data:image/png;base64,${generatedImageBase64}`;
    console.log('Background removal completed with transparent background');

    return new Response(
      JSON.stringify({ 
        imageUrl: resultImageUrl,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Background removal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Background removal failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
