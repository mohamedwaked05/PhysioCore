import api from './axios';

// Clinic — all clients with their plans (multi-week overview)
export const getClinicPlans = () =>
    api.get('/clinic/plans');

// Clinic — create plan with exercises (each exercise has day_of_week)
export const createRehabPlan = (data) =>
    api.post('/clinic/rehab-plans', data);

// Clinic — get a patient's plan (returns exercises_by_day)
export const getPatientRehabPlan = (clientProfileId) =>
    api.get(`/clinic/patients/${clientProfileId}/rehab-plan`);

// Clinic — update plan (injury_type and/or full exercises replacement)
export const updateRehabPlan = (planId, data) =>
    api.put(`/clinic/rehab-plans/${planId}`, data);

// Clinic — delete plan
export const deleteRehabPlan = (planId) =>
    api.delete(`/clinic/rehab-plans/${planId}`);

// Clinic — add single exercise to existing plan
export const addExerciseToPlan = (planId, data) =>
    api.post(`/clinic/rehab-plans/${planId}/exercises`, data);

// Clinic — update single exercise
export const updateExerciseInPlan = (planId, exerciseId, data) =>
    api.put(`/clinic/rehab-plans/${planId}/exercises/${exerciseId}`, data);

// Clinic — remove single exercise
export const deleteExerciseFromPlan = (planId, exerciseId) =>
    api.delete(`/clinic/rehab-plans/${planId}/exercises/${exerciseId}`);

// Clinic — copy plan to another patient
export const copyRehabPlan = (planId, clientProfileId) =>
    api.post(`/clinic/rehab-plans/${planId}/copy`, { client_profile_id: clientProfileId });

// Clinic — predefined exercise library
export const getExerciseLibrary = (injuryType) =>
    api.get('/clinic/exercise-library', { params: injuryType ? { injury_type: injuryType } : {} });

// Client — fetch own rehab plan for a given clinic (returns exercises_by_day + progress)
export const getMyRehabPlan = (clinicId) =>
    api.get('/client/rehab-plan', { params: { clinic_id: clinicId } });

// Client — mark a day as completed (persisted server-side)
export const markDayComplete = (rehabPlanId, dayOfWeek) =>
    api.post('/client/rehab-plan/progress', { rehab_plan_id: rehabPlanId, day_of_week: dayOfWeek });

// Client — reset a day's completion (undo)
export const resetDayProgress = (rehabPlanId, dayOfWeek) =>
    api.delete('/client/rehab-plan/progress', { data: { rehab_plan_id: rehabPlanId, day_of_week: dayOfWeek } });
