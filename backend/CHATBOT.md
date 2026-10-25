# PhysioCore chatbot / Groq Cloud

## Existing implementation

The inspected revision already used Groq rather than xAI: `ChatbotController::assess`
called `https://api.groq.com/openai/v1/chat/completions` with the now-unlisted
`meta-llama/llama-4-scout-17b-16e-instruct` model. No active xAI endpoint or Grok
model was found in the tracked project. The separate Python `ai-service` and
Laravel `AiService` analyze rehabilitation logs and are unrelated to this chatbot.

The guest endpoint is `POST /api/chatbot/assess` (existing throttle: 20/minute).
`frontend/src/components/Chatbot.js` supplies the embedded and floating interfaces,
photo compression, conversation history, clinic cards and clinic navigation.
`frontend/src/api/public.js` calls the backend without provider credentials.

The sports-injury prompt asks at most three questions about pain location,
mechanism, pain level or function, then produces an injury/severity/explanation.
Photos can shorten the questions. Emergency signs stop the assessment. The
original clinical wording and question topics are preserved.

The backend detects one of the existing injury keyword groups from conversation
text and the assessment. It searches approved clinics' `specialty_text` and
`services`, returning up to three. If there is no match, it returns up to three
approved clinics. If none exist, no clinic cards are returned. These are the
existing matching rules; matching does not rank by location, price or availability.

## Current integration

- Model: `qwen/qwen3.8-27b`, listed on Groq's free plan on 2026-10-25 and verified
  against the supplied key's live model list. It supports both text and images,
  preserving the photo interface. This is a preview model; availability can change.
- `GROQ_API_KEY` is read only through backend `config('services.groq.api_key')`.
  `GROQ_MODEL` optionally overrides the default; overrides must support vision,
  JSON mode and `reasoning_effort: none`. No provider SDK or new dependency is needed.
- Groq returns a JSON object containing `status` and `message`; the backend
  validates it and returns the existing patient-facing `message`/clinic-block
  protocol, plus `assessment_done`. The frontend still renders the same cards.
- Only backend database results can create clinic cards. Model-generated clinic
  fields are ignored and responses containing clinic-block delimiters are rejected.
- The backend counts questions in assistant history, includes the remaining budget
  in the prompt and rejects extra questions. The client omits transient failure
  messages from model history and restores failed text/photo input for resending.
- Connection timeout: 5 seconds; total provider timeout: 25 seconds; browser
  request timeout: 30 seconds. HTTP 429 returns a bounded `Retry-After` (60-second
  default). Provider/network errors and malformed/truncated output return controlled
  errors without provider bodies, credentials or patient data. Calls are not
  automatically retried, avoiding repeated consumption of the shared free quota.
- Uploaded images use data URLs (JPEG/PNG/WebP), at most three per conversation,
  with a 4,000,000-character limit per image to stay within the provider request
  limit. The existing browser compressor outputs JPEG. More than three photos
  produces a validation error; the user can remove the pending photo and resend.

## Server configuration

Set these in the backend runtime environment (or the ignored `backend/.env`):

```dotenv
GROQ_API_KEY=your_private_groq_key
GROQ_MODEL=qwen/qwen3.8-27b
```

Do not put either API credentials or a `REACT_APP_GROQ_API_KEY` in the frontend.
Do not put real keys in `.env.example`, Docker build arguments, tracked files or
logs. Clear Laravel's config cache after changing backend environment values:

```sh
php artisan config:clear
```

During this migration the existing workspace `.env` and installed dependencies
were unreadable OneDrive placeholders. They were left intact. The supplied key
was stored in the local Windows **user environment** as `GROQ_API_KEY`; restart
the backend from an environment that includes it. For an already-open PowerShell:

```powershell
$env:GROQ_API_KEY = [Environment]::GetEnvironmentVariable('GROQ_API_KEY', 'User')
```

For hosted/Docker deployments, set `GROQ_API_KEY` separately in that backend's
runtime secret/environment configuration; local Windows settings do not propagate
to hosting or containers. No deployment or billing/account changes were made.

Keep the Groq account on the Free plan. This integration requires no payment
method, subscription, billing activation or automatic paid-model fallback.
Published free limits for this model are 30 requests/minute, 1,000 requests/day,
8,000 tokens/minute and 200,000 tokens/day, shared at organization level. Account
limits are authoritative and may change; exhausted quotas require waiting.

## Validation

```sh
cd backend
php artisan test
cd ../frontend
npm test -- --watchAll=false --runInBand --runTestsByPath src/components/Chatbot.test.js
npm run build
```

Backend tests cover the four-turn / three-question conversation, approved-only
specialty matching, fallback and empty databases, vision payloads, emergency
behavior, key isolation, rate limits, connection failures, malformed/truncated
responses, fabricated clinic blocks and input validation. They use a fresh in-memory
SQLite clinic table and mocked Groq responses, consuming no real quota. Existing
PostgreSQL-only migrations are not changed. `orWhereLike` preserves case-insensitive
PostgreSQL matching while also allowing the same queries to run under SQLite.

Frontend tests cover both widget modes, three questions, clinic-card and browse
navigation, empty-clinic assessments, and retry after 429, 503 or browser timeout.
They mock the router as a virtual module because CRA 5's Jest resolver does not
resolve the installed React Router 7 package exports. `App.test.js` now mounts
the actual application and submits a chatbot message from the guest landing page,
replacing its obsolete starter assertion about a "learn react" link. That test
uses the real upstream router exports with a jsdom TextEncoder compatibility fix.

The runtime validation uses an isolated checkout and synthetic clinic records,
because the original OneDrive `.env`, database and dependencies cannot be read.
It cannot certify production clinic contents, hosting configuration or network
conditions. The existing keyword matching is a basic referral aid, and generated
clinical assessments still require professional clinical validation.

Recorded results: 29 backend tests (90 assertions) passed; all seven frontend
tests across both test suites passed; the production frontend build compiled successfully. Live requests
through the Laravel HTTP kernel and the real Groq API passed text assessment
with an approved database clinic, multimodal input, and emergency handling. The
live text assessment finished after two questions, consistent with the original
maximum-three rule. No key prefix was found in the changed source or built
frontend assets. No original clinic database records were modified.

Sources checked on 2026-10-25:

- https://console.groq.com/docs/models
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/vision
- https://console.groq.com/docs/api-reference
- https://console.groq.com/docs/billing-faqs
