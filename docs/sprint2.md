# Sprint 2 — Client Module

Date: 2026-04-03

---

## Overview

Sprint 2 focused on building the complete client-side domain, including profile management, clinic discovery, and access request functionality. This sprint establishes the core interaction between clients and clinics.

---

## Database Changes

Three migrations were introduced:

1. add_medical_fields_to_client_profiles_table

   * Added: condition_summary, injury_details, emergency_contact
   * Used Schema::table to extend existing structure without affecting existing data

2. add_details_to_clinics_table

   * Added: description, specialty
   * Enables meaningful clinic display in frontend listings

3. create_access_requests_table

   * Fields: client_profile_id, clinic_id, status, notes, payment_preference
   * Status values: pending, approved, rejected
   * Foreign keys with cascade delete to maintain integrity

---

## Backend Implementation

### Models

ClientProfile

* Added new fields to fillable
* Added relationship: accessRequests()

Clinic

* Added description and specialty to fillable

AccessRequest

* New model
* Relationships:

  * belongsTo ClientProfile
  * belongsTo Clinic

---

### Controllers

ClientProfileController

* show(): retrieves authenticated user's profile
* update(): updates profile using validated input

AccessRequestController

* index(): returns client requests with clinic data (eager loaded)
* store():

  * Prevents duplicate active requests (pending/approved)
  * Creates new request if valid

ClinicController

* index():

  * Returns only verified clinics
  * Selects only required fields for performance

---

### Validation

UpdateProfileRequest

* Validates all profile fields
* Enforces:

  * correct data types
  * past date constraints
  * enum values (e.g., gender)
* Supports partial updates

StoreAccessRequestRequest

* Validates clinic_id existence
* Prevents invalid requests

---

### Routing & Security

* All routes under: /api/client/*

* Protected by:

  * auth:sanctum
  * role:client

* Ensures:

  * only authenticated users
  * only client role access

---

### Bug Fix

Password reset URL customization moved to AppServiceProvider::boot() to ensure consistent execution across all requests. Removed previous implementation from User model.

---

## Frontend Implementation

### API Layer

src/api/client.js

* Centralized API service
* Functions:

  * getProfile
  * updateProfile
  * getClinics
  * getAccessRequests
  * createAccessRequest

---

### Routing Protection

ProtectedRoute component

* Verifies authentication
* Verifies user role
* Redirects to login if invalid
* Preserves intended destination using state

---

### Layout

ClientLayout

* Shared layout across client pages
* Includes:

  * Navbar
  * Navigation links
  * User info
  * Logout functionality

---

### Pages

ClientDashboardPage

* Fetches profile and access requests
* Displays:

  * profile summary
  * request list with status
* Uses color-coded status indicators

ClientProfilePage

* Pre-fills existing data
* Split into personal and medical sections
* Client-side validation before submission
* Displays backend validation errors
* Shows success feedback

ClinicListingPage

* Displays verified clinics
* Shows:

  * name, specialty, description, address
* Handles access request creation
* Prevents duplicate requests using local state

---

### UI System

client.css

* Consistent design with Sprint 1
* Shared color system and typography
* Responsive layout
* Includes:

  * cards
  * forms
  * status badges
  * loading states

---

## Integration

* Axios instance attaches authentication token automatically
* All API calls handled through centralized service
* Data fetched and rendered dynamically
* UI updates immediately after actions

---

## System Flow

Authentication → Token stored → Protected route access → API request → Backend validation → Database query → JSON response → UI render

Profile update → Validation → Database update → UI feedback

Access request → Duplicate check → Record creation → UI state update

---

## Outcome

* Client profile fully manageable
* Clinics browsable with relevant data
* Access request system fully functional
* Request status visible to client
* Secure and validated data flow
* Frontend and backend fully integrated

---

## Status

Sprint 2 completed successfully
