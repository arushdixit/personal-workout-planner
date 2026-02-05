import { serve } from "std/http/server.ts"

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { messages, systemPrompt, model: requestedModel, temperature = 0.7, response_format } = await req.json()

        // 1. Get secrets from Supabase environment
        const apiKey = Deno.env.get('OPENROUTER_API_KEY')
        // Use the model from Supabase secrets if set, otherwise use what the client sent, or default
        const configModel = Deno.env.get('OPENROUTER_MODEL')
        const finalModel = configModel || requestedModel || 'openai/gpt-4o-mini'

        if (!apiKey) {
            throw new Error('Missing OPENROUTER_API_KEY secret in Supabase')
        }

        console.log(`Calling OpenRouter with model: ${finalModel}`)

        // 2. Call OpenRouter
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-Title': 'Pro-Lifts AI Service',
            },
            body: JSON.stringify({
                model: finalModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature,
                response_format,
            }),
        })

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenRouter error:', error);
            return new Response(JSON.stringify({ error }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Function error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
