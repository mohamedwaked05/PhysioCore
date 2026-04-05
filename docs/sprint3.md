# Sprint 3 — Clinic Module & UI System

Date: 2026-04-04  
Scope: Clinic module + Profile system redesign + UI architecture standardization  

---

## Objective

Implement the Clinic module backend, enhance both Client and Clinic profiles, and introduce a reusable frontend UI system to standardize design across the application.

---

## Backend Implementation

### Database Changes

Client Profile:
- nickname (string)
- language (string)
- country (string)
- timezone (string)
- profile_photo_url (string)

Clinic:
- profile_photo_url (string)
- certifications (text)
- experience (string)
- payment_methods (string)
- services (text)
- working_hours (string)
- social_media_link (string)

All fields are nullable.

---

### Models

ClientProfile:
- Added new fields to $fillable

Clinic:
- Added new fields to $fillable

---

### Validation (Form Requests)

Client:
- Optional fields validation
- profile_photo → image (jpg, png, max 5MB)

Clinic:
- Text fields with limits
- social_media_link → URL validation
- profile_photo → image validation

---

### Controllers

ClientProfileController:
- Uses multipart form data
- Stores profile photos in client-photos/
- Deletes old photo on update

ClinicProfileController:
- Handles profile photo and license upload
- Stores:
  - photos → clinic-photos/
  - licenses → licenses/
- Removes old files on update

ClinicController:
- Returns:
  - profile_photo_url
  - services
  - working_hours

---

### Routes

Changed:
PUT /api/client/profile  
→ POST /api/client/profile/update  

Reason: file uploads require multipart POST.

---

## Frontend Implementation

### Design System

File: src/styles/ui.css

Includes:
- Cards
- Buttons
- Inputs
- Badges
- Alerts
- Avatar system
- Layout grid

---

### UI Components

Created in src/components/ui/

- Avatar
- Card
- Button
- Input system
- SectionHeader
- StatusBadge

---

### Client Profile Page

- View/Edit toggle
- Avatar upload
- Profile completion fields
- Validation + success/error messages
- Multipart form submission

---

### Clinic Profile Page

- Same layout as client profile
- Additional clinic fields:
  - services
  - experience
  - certifications
- License upload
- View mode shows file link

---

### Clinic Listing Page

- Card layout
- Shows:
  - Avatar
  - Name
  - Specialty
  - Address
  - Working hours
  - Services (tags)
- Request button with loading state

---

### API Layer

client.js:
- updateProfile uses multipart POST

---

## Integration Flow

Profile update:
Frontend → FormData → API → Laravel → Storage → DB → Response → UI update

Clinic listing:
Frontend → API → Data → UI cards

---

## Bug Fix

Button component did not forward props.

Fix:
Added {...rest} to button element.

---

## Outcome

- Clinic module implemented
- Profile system improved
- UI unified
- File uploads supported
- Clean scalable frontend structure