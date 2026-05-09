<?php

namespace App\Http\Controllers;

use App\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    private const SYSTEM_PROMPT = 'You are PhysioCore\'s sports injury AI. Be fast and confident like a sports medicine doctor. Maximum 3 questions before assessment.

IF USER SENDS PHOTO: describe in one sentence what you see, then ask only 1-2 more questions before assessing.

QUESTION ORDER (pick the most relevant, max 3 total):
- Where exactly is the pain?
- How did it happen? (sudden twist/impact/fall or gradual)
- Pain level 1-10?
- Can you walk/use it normally?

ASSESSMENT FORMAT (after enough info):
"Based on your symptoms, you likely have: [INJURY NAME] [Grade if applicable]
Severity: [Mild/Moderate/Severe]
This means: [one sentence on what that means for them]"

Then STOP — do not add clinic recommendations in your text, those will be added automatically by the system.

RULES:
- Be direct. Say "You likely have ACL Grade 2" not "it could possibly be"
- Short sentences only
- No bullet points
- No medical disclaimers in every message
- Emergency signs (cannot move, severe deformity, numbness in limb): say "Go to emergency care immediately" and stop
- Only answer musculoskeletal injury questions
- When you have enough info, give the assessment — do not keep asking questions';

    private const INJURY_TERMS = [
        'acl'               => ['acl', 'anterior cruciate', 'knee ligament tear'],
        'mcl'               => ['mcl', 'medial collateral', 'inner knee'],
        'meniscus'          => ['meniscus', 'cartilage', 'knee cartilage'],
        'rotator cuff'      => ['rotator cuff', 'shoulder tear', 'shoulder impingement'],
        'ankle sprain'      => ['ankle sprain', 'lateral ankle', 'ankle ligament'],
        'fracture'          => ['fracture', 'broken bone', 'stress fracture'],
        'hamstring'         => ['hamstring', 'posterior thigh', 'hamstring tear'],
        'quadriceps'        => ['quadriceps', 'quad tear', 'thigh muscle'],
        'plantar fasciitis' => ['plantar fasciitis', 'heel pain', 'arch pain'],
        'lower back'        => ['lower back', 'lumbar', 'disc herniation', 'sciatica'],
        'shoulder'          => ['shoulder dislocation', 'shoulder strain', 'shoulder pain'],
        'knee'              => ['knee pain', 'knee injury', 'patella'],
        'tennis elbow'      => ['tennis elbow', 'lateral epicondylitis', 'elbow pain'],
        'achilles'          => ['achilles', 'heel tendon', 'achilles tear'],
        'groin'             => ['groin strain', 'groin pull', 'adductor'],
    ];

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

        // Build Groq message array — support vision payloads
        $groqMessages = [['role' => 'system', 'content' => self::SYSTEM_PROMPT]];

        foreach ($request->input('messages') as $msg) {
            $role    = $msg['role'];
            $content = $msg['content'] ?? '';
            $image   = $msg['image']   ?? null;

            if ($image && $role === 'user') {
                $groqMessages[] = [
                    'role'    => 'user',
                    'content' => [
                        ['type' => 'image_url', 'image_url' => ['url' => $image]],
                        ['type' => 'text',      'text'      => $content ?: 'Please analyze this injury.'],
                    ],
                ];
            } else {
                $groqMessages[] = ['role' => $role, 'content' => $content];
            }
        }

        $response = Http::withToken($apiKey)
            ->timeout(25)
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model'       => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'messages'    => $groqMessages,
                'max_tokens'  => 300,
                'temperature' => 0.7,
            ]);

        if ($response->failed()) {
            return response()->json(['error' => 'Assessment service temporarily unavailable.'], 503);
        }

        $aiText = $response->json('choices.0.message.content');

        if (empty($aiText)) {
            return response()->json(['error' => 'Empty response from assessment service.'], 502);
        }

        // Only append clinics on a final assessment response
        $lowerAi = strtolower($aiText);
        $isFinal = str_contains($lowerAi, 'you likely have')
            || str_contains($lowerAi, 'based on your symptoms')
            || str_contains($lowerAi, 'severity:')
            || str_contains($lowerAi, 'this is consistent with')
            || str_contains($lowerAi, 'this looks like');

        $clinicBlock = '';

        if ($isFinal) {
            // Detect injury from full conversation + AI reply
            $conversation = strtolower(
                collect($request->input('messages'))->pluck('content')->implode(' ')
                . ' ' . $aiText
            );

            $detectedInjury = null;
            foreach (self::INJURY_TERMS as $injury => $keywords) {
                foreach ($keywords as $kw) {
                    if (str_contains($conversation, $kw)) {
                        $detectedInjury = $injury;
                        break 2;
                    }
                }
            }

            // Search clinics by specialty_text and services
            $clinics = collect();
            if ($detectedInjury) {
                $terms = self::INJURY_TERMS[$detectedInjury];
                $q = Clinic::where('verification_status', 'approved')
                    ->where(function ($query) use ($terms, $detectedInjury) {
                        foreach ($terms as $term) {
                            $query->orWhere('specialty_text', 'ILIKE', "%{$term}%")
                                  ->orWhere('services', 'ILIKE', "%{$term}%");
                        }
                        $query->orWhere('specialty_text', 'ILIKE', "%{$detectedInjury}%")
                              ->orWhere('services', 'ILIKE', "%{$detectedInjury}%");
                    });
                $clinics = $q->limit(3)->get(['id', 'user_id', 'commercial_name', 'legal_name', 'address', 'specialty_text']);
            }

            // Fallback: any 3 approved clinics
            if ($clinics->isEmpty()) {
                $clinics = Clinic::where('verification_status', 'approved')
                    ->limit(3)
                    ->get(['id', 'user_id', 'commercial_name', 'legal_name', 'address', 'specialty_text']);
            }

            if ($clinics->isNotEmpty()) {
                $clinicBlock = "\n\n---CLINICS---";
                foreach ($clinics as $clinic) {
                    $clinicBlock .= "\n" . json_encode([
                        'id'       => $clinic->id,
                        'name'     => $clinic->commercial_name ?? $clinic->legal_name,
                        'address'  => $clinic->address,
                        'specialty' => $clinic->specialty_text,
                    ]);
                }
                $clinicBlock .= "\n---END---";
            }
        }

        return response()->json(['message' => $aiText . $clinicBlock]);
    }
}
