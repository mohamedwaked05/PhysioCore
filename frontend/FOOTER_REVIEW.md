# PhysioCore footer review

This change adds the public/authentication footer and its route layout. Backend,
chatbot, clinic matching, authentication behavior, and dependencies are unchanged.

## Architecture and visibility

The frontend uses Create React App 5, React 19, React Router 7, plain CSS, and the
existing Inter/Syne typography. `AuthProvider` initializes `user` synchronously
from localStorage, with no asynchronous loading phase. Existing logout clears
storage and reloads `/`. These behaviors are unchanged.

`App.js` now nests public and authentication routes under `PublicLayout`, which
owns footer visibility through `useAuth`. It does not infer login state from URLs.

| Page context | Guest | Signed-in client / clinic / admin |
| --- | --- | --- |
| `/` (embedded injury chatbot) | Footer | No footer before existing role redirect |
| `/clinics`, `/clinics/:id` | Footer | No footer |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Footer | Footer |
| `/verify-email/:id/:hash`, `/email-verified` | Footer | Footer |
| `/auth/google/callback`, `/auth/google/complete` | Footer | Footer |
| `/client/dashboard/*`, `/clinic/dashboard/*`, `/admin/dashboard/*` | Existing login redirect | No footer |
| `/client/profile`, `/clinic/profile` | Existing login redirect | No footer |
| `/client/clinics/*`, `/onboarding`, `/setup`, `/dashboard` | Existing redirects | Existing redirects |

There is no separate chatbot/assessment route or sign-out-confirmation page.
The assessment is embedded on the homepage or rendered by the existing widget;
sign-out confirmation is an existing dialog. Future public routes belong in the
public route group; protected routes stay outside it.

The public layout retains its DOM structure when a session changes, preventing
clinic filters or page state from being remounted. When its footer is hidden,
`display: contents` preserves the existing page layout. Protected dashboards do
not receive this layout at all.

## Design and responsive behavior

- Existing PhysioCore ECG logo, Inter body text, Syne brand text, blue/cyan palette,
  theme tokens, thin borders and 1160px content width.
- The footer uses a 25% surface tint (75% transparency). Its content, including
  the logo, text and social icons, has 80% opacity (20% transparency) applied once
  to the inner container. Link hover and keyboard focus restore full content
  opacity. Footer-local text colors preserve contrast after compositing.
  Its public wrapper is transparent so the existing body/root gradients show
  through, rather than being masked by a flat background. Authentication forms
  receive the same app gradients with their local light/dark background color.
  Dividers and social-button borders use softer tints; the fallback is transparent.
- Two columns above 600px: brand/description and navigation. Copyright, developer
  credit and social links form a restrained bottom row that can wrap on tablets.
- At 600px and below: stacked brand/navigation, full-width copyright, then credit
  and social icons in a compact two-column row. No fixed widths on text columns.
- Links have at least 44px touch targets, visible keyboard focus, accessible social
  labels and safe external-link attributes. No new motion is introduced.
- Safe-area padding accounts for notches and home indicators. No fixed footer.
- Public pages use a minimum viewport-height flex layout. Scoped overrides let the
  previously viewport-locked homepage grow around the footer. The chatbot retains
  its existing 420px desktop / 320px mobile size, input and internal message scrolling.
- Authentication forms retain their local theme behavior. CSS follows their
  existing `.login-page.dark` class so footer colors match without modifying auth
  pages or their state. Other public pages inherit the existing global theme.

## Destinations and outstanding content

Included internal destinations: Home `/`, Find a Clinic `/clinics`.
The logo also links home. Developer name is plain text because no portfolio URL
exists in the project.

External profiles use the supplied URLs:

- https://github.com/mohamedwaked05 (public profile retrieved successfully)
- https://www.linkedin.com/in/mohamad-waked/ (user supplied; LinkedIn returned 999
  to automated verification, so its content was not independently inspected)

No About, Privacy Policy, Terms of Use, or medical-disclaimer destination or approved
copy exists in the inspected project. They are omitted rather than linked to
invented pages or legal text. This also leaves legal/medical information access
for authenticated users unresolved: approved destinations/content are needed before
adding those items to the existing desktop Settings and mobile navigation menus.

## Validation

```sh
cd frontend
npm test -- --watchAll=false --runInBand
npm run build
```

Automated tests cover semantic markup, known destinations, external-link safety,
accessible labels, dynamic year, keyboard order, route-context visibility,
persisted sessions, login without remounting page state, logout storage cleanup /
guest reload, actual app route wiring, and the existing chatbot behavior.

`tests/footer-layout-checks.js` is a dependency-free real-browser assertion helper.
It can be passed to a browser runner's `page.evaluate(checkFooterLayout)` and
checks actual layout geometry, 44px targets, contrast, content/link overlap,
horizontal overflow, the embedded chat's size/scroll container, computed footer
alpha, content opacity and public-wrapper transparency. Contrast calculations use
composited base colors; gradient backdrops still require visual inspection. jsdom cannot
validate those geometric properties.

Required browser matrix (both themes): 320x568, 375x812, 430x932,
600x960, 768x1024, 1024x768, 1440x900 and 1920x1080. Include mobile
landscape orientations where practical.
Check public clinics, clinic details and auth forms as well as the homepage.
In the chat, complete a conversation and scroll back through messages; input and
footer boundaries must remain stable. Also verify real browser login/logout and
that client/clinic/admin pages contain no full footer.

Release validation on 2026-10-25: all four frontend suites passed (35 tests),
all backend tests passed (30 tests, 92 assertions), and the frontend production
build compiled successfully. The tested frontend source matches the release source.
Local Laravel/PostgreSQL HTTP checks covered clinic listing/details, role-based
login, profiles, dashboard data, logout, and token revocation with synthetic data.
AI unit tests mock the upstream provider and do not establish live model availability.

**Visual verification remains pending:** Browser Use origin permission was denied
for both local and production inspection. No viewport screenshots, real-browser
login/logout checks, contrast/geometry helper execution, or chat-scroll validation
were completed. The browser helper is supplied for later execution; jsdom tests
must not be described as real-browser responsive tests.
