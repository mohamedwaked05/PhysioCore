# Sprint 1 — Authentication & Authorization

**Date:** 2026-04-02
**Sprint Goal:** Build a complete authentication system with role-based access, email verification, Google OAuth, and secure session handling.

---

#  1. Overview

Sprint 1 focused on implementing a **production-level authentication system** including:

* Email/password authentication
* Google OAuth login
* Email verification (real SMTP)
* Password reset system
* Role-based access (client, clinic, admin)
* Secure token handling using Laravel Sanctum
* Fully connected frontend authentication flow

---

#  2. Backend Implementation

## User Entity

A custom `users` table was created with extended fields:

* first_name, last_name
* email (unique)
* password_hash (nullable for Google users)
* role (client, clinic, admin)
* status
* google_id (nullable)
* provider (local/google)
* email_verified_at

The `User` model:

* Implements `MustVerifyEmail`
* Uses `HasApiTokens` (Sanctum)

---
##  Registration

**Endpoint:** `POST /api/auth/register`

Flow:

1. Validate input via `RegisterRequest`
2. Create user
3. Initialize profile:

   * client → `ClientProfile`
   * clinic → `Clinic (pending)`
4. Trigger `Registered` event → sends verification email

---

##  Login

**Endpoint:** `POST /api/auth/login`

Flow:

1. Validate credentials
2. Check:

   * email verified
   * account status
3. Generate Sanctum token:

   * with expiry (24h) OR
   * no expiry (remember me)

---

##  Logout

**Endpoint:** `POST /api/auth/logout`

* Deletes current access token only

---

##  Email Verification

* Configured Gmail SMTP
* Verification link uses signed URL
* Endpoint:
  `GET /api/auth/verify-email/{id}/{hash}`
* Login blocked until verification

---

##  Google OAuth

Implemented using **Laravel Socialite (stateless)**

Flow:

1. `/api/auth/google` → redirect to Google
2. `/api/auth/google/callback`:

   * Existing user → login
   * New user → store temp data (15 min)
3. `/api/auth/google/complete`:

   * User selects role
   * Account created
   * Verification email sent

---

##  Password Reset

Endpoints:

* `POST /api/auth/forgot-password`
* `POST /api/auth/reset-password`

Implementation:

* Custom `password_reset_tokens` table
* Reset link redirected to frontend
* Password updated using `password_hash`
* All tokens revoked after reset

---

##  Validation

* Implemented using Laravel FormRequest
* Returns structured 422 errors
* Fully handled in frontend UI

---

##  Sanctum Tokens

* Tokens generated via `createToken()`
* Attached to all requests via Axios
* Protected using `auth:sanctum` middleware

---

#  3. Frontend Implementation

##  Authentication Pages

* LoginPage
* RegisterPage
* GoogleCallbackPage
* GoogleCompleteRegistrationPage
* ForgotPasswordPage
* ResetPasswordPage

---

##  Auth Flow

* Token stored in localStorage
* Axios interceptor attaches token
* 401 interceptor:

  * clears session
  * redirects to `/login`

---

##  Redirect Logic

After login:

* client → `/onboarding`
* clinic → `/setup`
* admin → `/dashboard`

---

##  Infrastructure

* `AuthContext` handles auth state
* Axios instance with interceptors
* Reusable `Spinner` component
* Shared `AuthSidebar` component

---

# 4. UI/UX Design

* Split layout:

  * Sidebar (dark theme)
  * Form panel (light)
* Card-based design:

  * 980px width
  * Rounded corners (20px)
  * Soft shadows
* Color system:

  * Primary: #3E4772
  * Background: #EFECEA
* Typography:

  * Instrument Serif
  * Syne
  * Inter

---

# 5. Integration

* Frontend fully connected to backend APIs
* Token-based authentication implemented
* Error handling centralized (Axios interceptor)
* Smooth user experience across all auth flows

---

# 6. Sprint Checklist

All planned features were successfully implemented:

* User system ✅
* Authentication APIs ✅
* Role-based access ✅
* Email verification ✅
* Google OAuth ✅
* Password reset ✅
* Token handling ✅
* Frontend integration ✅
* UI implementation ✅

---

# 7. Outcome

Sprint 1 delivers a **complete, production-ready authentication system** that supports:

* Multiple authentication methods
* Secure session management
* Role-based navigation
* Scalable architecture for future modules

---

#  Sprint 1 Status: COMPLETED
