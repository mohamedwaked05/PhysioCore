<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Models\Clinic;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    // ── GET /admin/stats ──────────────────────────────────────
    public function stats()
    {
        $clinicCounts = Clinic::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN verification_status = 'pending'  THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        ")->first();

        $userCounts = User::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN role = 'client'  THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN role = 'clinic'  THEN 1 ELSE 0 END) as clinics,
            SUM(CASE WHEN role = 'admin'   THEN 1 ELSE 0 END) as admins,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
        ")->first();

        $flagCounts = AiInsight::where('safety_flag', true)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as unresolved,
                SUM(CASE WHEN resolved_at IS NULL AND severity = 'critical' THEN 1 ELSE 0 END) as critical
            ")->first();

        $recentClinics = Clinic::with('user:id,first_name,last_name,email,created_at')
            ->where('verification_status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id'                  => $c->id,
                'name'                => $c->commercial_name ?? $c->legal_name,
                'email'               => $c->clinic_email ?? $c->user?->email,
                'verification_status' => $c->verification_status,
                'created_at'          => $c->created_at,
            ]);

        $recentFlags = AiInsight::where('safety_flag', true)
            ->whereNull('resolved_at')
            ->with([
                'clientProfile' => fn($q) => $q->select('id', 'user_id')
                    ->with('user:id,first_name,last_name'),
                'clinic:id,commercial_name,legal_name',
            ])
            ->orderByRaw("CASE WHEN severity = 'critical' THEN 0 ELSE 1 END")
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($f) => [
                'id'          => $f->id,
                'flag_reason' => $f->flag_reason,
                'severity'    => $f->severity,
                'clinic_name' => $f->clinic?->commercial_name ?? $f->clinic?->legal_name ?? '—',
                'patient'     => trim(($f->clientProfile?->user?->first_name ?? '') . ' ' . ($f->clientProfile?->user?->last_name ?? '')) ?: 'Unknown',
                'created_at'  => $f->created_at,
            ]);

        return response()->json([
            'clinics'       => $clinicCounts,
            'users'         => $userCounts,
            'flags'         => $flagCounts,
            'recent_clinics' => $recentClinics,
            'recent_flags'   => $recentFlags,
        ]);
    }

    // ── GET /admin/clinics/{id} ───────────────────────────────
    public function showClinic(int $id)
    {
        $clinic = Clinic::with('user:id,first_name,last_name,email,created_at,status,email_verified_at')
            ->findOrFail($id);

        return response()->json($clinic);
    }

    // ── GET /admin/clinics ────────────────────────────────────
    public function clinics(Request $request)
    {
        $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = Clinic::with('user:id,first_name,last_name,email,created_at,status')
            ->when($request->status, fn($q) => $q->where('verification_status', $request->status))
            ->when($request->search, fn($q) => $q->where(function ($inner) use ($request) {
                $inner->where('legal_name', 'LIKE', "%{$request->search}%")
                      ->orWhere('commercial_name', 'LIKE', "%{$request->search}%")
                      ->orWhere('clinic_email', 'LIKE', "%{$request->search}%");
            }))
            ->latest();

        return response()->json($query->paginate(20));
    }

    // ── POST /admin/clinics/{id}/approve ──────────────────────
    public function approveClinic(int $id)
    {
        $clinic = Clinic::findOrFail($id);
        $clinic->update([
            'verification_status' => 'approved',
            'rejection_reason'    => null,
        ]);

        // Activate the clinic's user account
        $clinic->user?->update(['status' => 'active']);

        if ($clinic->user_id) {
            $this->notifications->notify($clinic->user_id, 'clinic_approved', [
                'clinic_name' => $clinic->commercial_name ?? $clinic->legal_name,
            ]);
        }

        return response()->json(['message' => 'Clinic approved.', 'clinic' => $clinic]);
    }

    // ── POST /admin/clinics/{id}/reject ───────────────────────
    public function rejectClinic(Request $request, int $id)
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $clinic = Clinic::findOrFail($id);
        $clinic->update([
            'verification_status' => 'rejected',
            'rejection_reason'    => $request->reason,
        ]);

        if ($clinic->user_id) {
            $this->notifications->notify($clinic->user_id, 'clinic_rejected', [
                'clinic_name'      => $clinic->commercial_name ?? $clinic->legal_name,
                'rejection_reason' => $request->reason,
            ]);
        }

        return response()->json(['message' => 'Clinic rejected.', 'clinic' => $clinic]);
    }

    // ── GET /admin/users ──────────────────────────────────────
    public function users(Request $request)
    {
        $request->validate([
            'role'   => ['nullable', 'in:client,clinic,admin'],
            'status' => ['nullable', 'in:active,suspended,pending'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = User::select(['id', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at', 'email_verified_at'])
            ->when($request->role,   fn($q) => $q->where('role', $request->role))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where(function ($inner) use ($request) {
                $inner->where('first_name', 'LIKE', "%{$request->search}%")
                      ->orWhere('last_name',  'LIKE', "%{$request->search}%")
                      ->orWhere('email',      'LIKE', "%{$request->search}%");
            }))
            ->latest();

        return response()->json($query->paginate(25));
    }

    // ── PATCH /admin/users/{id}/status ────────────────────────
    public function toggleUserStatus(Request $request, int $id)
    {
        $request->validate([
            'status' => ['required', 'in:active,suspended'],
        ]);

        $user = User::findOrFail($id);

        // Prevent admins from suspending themselves
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot modify your own account.'], 403);
        }

        $user->update(['status' => $request->status]);

        $type = $request->status === 'suspended' ? 'user_suspended' : 'user_activated';
        $this->notifications->notify($user->id, $type, [
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'User status updated.', 'user' => $user]);
    }

    // ── DELETE /admin/users/{id} ──────────────────────────────
    public function destroyUser(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 403);
        }

        if ($user->role === 'admin') {
            return response()->json(['message' => 'Admin accounts cannot be deleted.'], 403);
        }

        DB::transaction(function () use ($user) {
            // Sanctum tokens have no DB cascade — delete manually
            $user->tokens()->delete();
            // Notifications have no DB cascade — delete manually
            UserNotification::where('user_id', $user->id)->delete();
            // DB CASCADE handles the rest:
            //   client_profiles → access_requests, rehab_plans (exercises + progress)
            //   clinics         → rehab_plans, access_requests
            //   messages        (sender_id and receiver_id both CASCADE)
            $user->delete();
        });

        return response()->json(['message' => 'User permanently deleted.']);
    }

    // ── GET /admin/safety-flags ───────────────────────────────
    public function safetyFlags(Request $request)
    {
        $request->validate([
            'resolved' => ['nullable', 'in:0,1'],
        ]);

        $showResolved = $request->boolean('resolved', false);

        $flags = AiInsight::where('safety_flag', true)
            ->when(!$showResolved, fn($q) => $q->whereNull('resolved_at'))
            ->when($showResolved,  fn($q) => $q->whereNotNull('resolved_at'))
            ->with([
                'clientProfile' => fn($q) => $q->select('id', 'user_id', 'condition_summary')
                    ->with('user:id,first_name,last_name'),
                'clinic:id,commercial_name,legal_name',
                'resolvedByUser:id,first_name,last_name',
            ])
            ->orderByRaw("CASE WHEN severity = 'critical' THEN 0 ELSE 1 END")
            ->latest()
            ->limit(100)
            ->get()
            ->map(function ($f) {
                $u        = $f->clientProfile?->user;
                $name     = trim(($u?->first_name ?? '') . ' ' . ($u?->last_name ?? '')) ?: 'Unknown';
                $initials = strtoupper(($u?->first_name[0] ?? '') . ($u?->last_name[0] ?? '')) ?: '?';
                $resolver = $f->resolvedByUser;

                return [
                    'id'                => $f->id,
                    'patient_name'      => $name,
                    'initials'          => $initials,
                    'condition'         => $f->clientProfile?->condition_summary ?? '—',
                    'clinic_name'       => $f->clinic?->commercial_name ?? $f->clinic?->legal_name ?? '—',
                    'flag_reason'       => $f->flag_reason,
                    'severity'          => $f->severity,
                    'resolved_at'       => $f->resolved_at,
                    'resolved_by'       => $resolver
                        ? trim($resolver->first_name . ' ' . $resolver->last_name)
                        : null,
                    'resolution_note'   => $f->resolution_note,
                    'created_at'        => $f->created_at,
                ];
            });

        return response()->json($flags);
    }

    // ── PATCH /admin/safety-flags/{id}/resolve ────────────────
    public function resolveFlag(Request $request, int $id)
    {
        $request->validate([
            'resolution_note' => ['nullable', 'string', 'max:500'],
        ]);

        $flag = AiInsight::where('safety_flag', true)->findOrFail($id);
        $flag->update([
            'resolved_at'     => Carbon::now('UTC'),
            'resolved_by'     => $request->user()->id,
            'resolution_note' => $request->input('resolution_note'),
        ]);

        return response()->json(['message' => 'Flag resolved.']);
    }
}
