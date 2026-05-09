<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    private const SYSTEM_PROMPT = 'You are PhysioCore\'s injury assessment assistant. Your role is to help users understand potential musculoskeletal injuries through conversational questions.

Users may send photos of their injury. When they do, describe what you visually observe (swelling, bruising, redness, deformity, wound, skin discolouration) and factor it into your assessment. Never make a definitive diagnosis from images alone — always recommend professional evaluation.

Ask ONE question at a time about:
- Location of pain (be specific: which body part)
- Type of pain (sharp, dull, burning, throbbing)
- When it occurs (at rest, during activity, after activity)
- Duration (how long they\'ve had it)
- Severity (1-10 scale)
- Any swelling, bruising, limited movement
- What caused it (sudden injury vs gradual onset)

After gathering enough information (5-7 exchanges), provide:
1. Most likely injury type(s) based on symptoms
2. Severity assessment (mild/moderate/severe)
3. Recommended action (self-care, physiotherapy, urgent care)
4. Always end with: \'For proper diagnosis and treatment, connect with a verified physiotherapy clinic on PhysioCore.\'

IMPORTANT RULES:
- Never give a definitive medical diagnosis
- Always recommend professional consultation
- Keep responses concise and conversational
- If symptoms suggest emergency (severe trauma, numbness, inability to move) immediately recommend emergency care
- Only discuss musculoskeletal injuries — redirect other medical questions';

    public function assess(Request $request)
    {
        $request->validate([
            'messages'           => ['required', 'array', 'min:1', 'max:40'],
            'messages.*.role'    => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['nullable', 'string', 'max:1500'],
            'messages.*.image'   => ['nullable', 'string'],
        ]);

        $apiKey = config('services.groq.api_key');
        if (empty($apiKey)) {
            return response()->json(['error' => 'Assessment service not configured.'], 503);
        }

        $messages = [['role' => 'system', 'content' => self::SYSTEM_PROMPT]];

        foreach ($request->input('messages') as $msg) {
            $role    = $msg['role'];
            $content = $msg['content'] ?? '';
            $image   = $msg['image']   ?? null;

            if ($image && $role === 'user') {
                // Vision message: image + optional text
                $messages[] = [
                    'role'    => 'user',
                    'content' => [
                        [
                            'type'      => 'image_url',
                            'image_url' => ['url' => $image],
                        ],
                        [
                            'type' => 'text',
                            'text' => $content ?: 'Please analyze this injury photo.',
                        ],
                    ],
                ];
            } else {
                $messages[] = ['role' => $role, 'content' => $content];
            }
        }

        $response = Http::withToken($apiKey)
            ->timeout(25)
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model'       => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'messages'    => $messages,
                'max_tokens'  => 300,
                'temperature' => 0.7,
            ]);

        if ($response->failed()) {
            return response()->json(['error' => 'Assessment service temporarily unavailable.'], 503);
        }

        $content = $response->json('choices.0.message.content');

        if (empty($content)) {
            return response()->json(['error' => 'Empty response from assessment service.'], 502);
        }

        return response()->json(['message' => $content]);
    }
}
