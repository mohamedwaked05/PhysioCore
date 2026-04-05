  ---                                                                                                                                                             Phase 1 — Quick Wins
                                                                                                                                                                
  Skeleton loaders                                                                                                                                              
  - Created a reusable Skeleton.js component with shimmer animation
  - Clinic listing replaced spinner with 6 shaped skeleton cards (avatar circle, text lines, tag pills, button shape)
  - Clinic detail page replaced spinner with a full layout skeleton (hero + info row + cards)

  Page entrance animation
  - Every page fades in and slides up 10px on load (pageEntrance keyframe on .client-content)

  Gradient on primary elements
  - All primary buttons: linear-gradient(135deg, #4d5690 → #3E4772) with stronger shadow on hover
  - Navbar: same gradient direction for depth

  Toast notification system
  - Built ToastContext.js — ToastProvider wraps the whole app, useToast() hook available anywhere
  - Toasts slide in from top-right with a spring animation, auto-dismiss after 4.5s, manual close button
  - 4 types: success (green), error (red), warning (yellow), info (blue)
  - Replaced every inline success/error banner in listing and detail pages

  ---
  Phase 2 — Deeper Polish

  CSS variables system-wide
  - Added :root block to ui.css with 20 design tokens: --primary, --bg, --surface, --border, --text, --text-muted, radius values, shadow values
  - Replaced all hardcoded hex values in both ui.css and client.css with variables — changing --primary now recolors the entire app instantly

  Clinic card accent strips
  - Each card has a 3px gradient top strip via ::before
  - 3 rotating color variants per nth-child: navy→violet / teal→mint / plum→lavender

  Better empty states
  - EmptyState component with contextual SVG icon, title, and description
  - Different icon and copy for "no clinics at all" vs "no filter results"
  - "Clear all filters" button only appears when filters are active

  ---
  Phase 3 — Dark Mode + Animations

  Dark mode
  - ThemeContext.js — manages light/dark state, persists to localStorage
  - Toggle button (moon/sun icon) added to both ClientLayout and ClinicLayout navbars
  - Full dark color palette: deep navy background (#0d0f1a), slightly lighter cards (#161929), lighter primary (#7b8fe8) for readability on dark surfaces       
  - Fixed all remaining hardcoded #fff and semantic colors across client.css and clinic.css
  - Verification banner adapts per status in dark mode (green/amber/red tints instead of bright boxes)
  - File upload, tags, badges, request items, filter inputs — all properly themed

  Smooth theme crossfade
  - Uses data-theme-transitioning attribute trick — the 0.35s color transition only fires during the toggle, not on every hover

  Staggered card entrance
  - Clinic cards appear in a wave using CSS --i index custom property × 55ms delay — no JS library needed

  Micro-animations
  - Button press: scale(0.97) on :active for tactile feedback
  - Service tags: flip to primary color + scale(1.06) on hover (both listing cards and detail page)
  - Dark mode card hover: colored blue-purple glow instead of plain grey shadow