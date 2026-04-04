import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';
import Spinner from '../../components/Spinner';

const INITIAL_FORM = {
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    condition_summary: '',
    injury_details: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    emergency_contact: '',
};

export default function ClientProfilePage() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getProfile()
            .then(res => {
                const data = res.data ?? {};
                setForm({
                    date_of_birth:      data.date_of_birth      ?? '',
                    gender:             data.gender              ?? '',
                    phone:              data.phone               ?? '',
                    address:            data.address             ?? '',
                    condition_summary:  data.condition_summary   ?? '',
                    injury_details:     data.injury_details      ?? '',
                    medical_history:    data.medical_history     ?? '',
                    allergies:          data.allergies           ?? '',
                    current_medications:data.current_medications ?? '',
                    emergency_contact:  data.emergency_contact   ?? '',
                });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validate = () => {
        const errs = {};
        if (form.phone && !/^[+\d\s\-()]{0,20}$/.test(form.phone)) {
            errs.phone = 'Enter a valid phone number.';
        }
        if (form.date_of_birth && new Date(form.date_of_birth) >= new Date()) {
            errs.date_of_birth = 'Date of birth must be in the past.';
        }
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const clientErrors = validate();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setSaving(true);
        try {
            await updateProfile(form);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            const serverErrors = err.response?.data?.errors ?? {};
            if (Object.keys(serverErrors).length > 0) {
                const flat = {};
                Object.entries(serverErrors).forEach(([k, v]) => { flat[k] = v[0]; });
                setErrors(flat);
            } else {
                setError(err.response?.data?.message ?? 'Failed to save profile.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ClientLayout>
                <div className="client-loading"><div className="client-spinner" /></div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div className="client-page-header">
                <h1 className="client-page-title">My Profile</h1>
                <p className="client-page-subtitle">Keep your personal and medical information up to date.</p>
            </div>

            <form onSubmit={handleSubmit}>
                {error && <div className="client-error-banner">{error}</div>}
                {success && <div className="client-success-banner">Profile saved successfully.</div>}

                {/* Personal Information */}
                <div className="client-card" style={{ marginBottom: '1.25rem' }}>
                    <p className="profile-section-label">Personal Information</p>
                    <div className="profile-form-grid">
                        <div className="profile-field">
                            <label className="profile-label">Date of Birth</label>
                            <input
                                className="profile-input"
                                type="date"
                                name="date_of_birth"
                                value={form.date_of_birth}
                                onChange={handleChange}
                            />
                            {errors.date_of_birth && <span className="profile-field-error">{errors.date_of_birth}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Gender</label>
                            <select
                                className="profile-select"
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.gender && <span className="profile-field-error">{errors.gender}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Phone</label>
                            <input
                                className="profile-input"
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 8900"
                            />
                            {errors.phone && <span className="profile-field-error">{errors.phone}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Emergency Contact</label>
                            <input
                                className="profile-input"
                                type="text"
                                name="emergency_contact"
                                value={form.emergency_contact}
                                onChange={handleChange}
                                placeholder="Name and phone number"
                            />
                            {errors.emergency_contact && <span className="profile-field-error">{errors.emergency_contact}</span>}
                        </div>

                        <div className="profile-field span-2">
                            <label className="profile-label">Address</label>
                            <input
                                className="profile-input"
                                type="text"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Street, city, country"
                            />
                            {errors.address && <span className="profile-field-error">{errors.address}</span>}
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="client-card">
                    <p className="profile-section-label">Medical Information</p>
                    <div className="profile-form-grid">
                        <div className="profile-field span-2">
                            <label className="profile-label">Condition Summary</label>
                            <input
                                className="profile-input"
                                type="text"
                                name="condition_summary"
                                value={form.condition_summary}
                                onChange={handleChange}
                                placeholder="Brief description of your current condition"
                            />
                            {errors.condition_summary && <span className="profile-field-error">{errors.condition_summary}</span>}
                        </div>

                        <div className="profile-field span-2">
                            <label className="profile-label">Injury Details</label>
                            <textarea
                                className="profile-textarea"
                                name="injury_details"
                                value={form.injury_details}
                                onChange={handleChange}
                                placeholder="Describe your injury, when it occurred, and any relevant context"
                            />
                            {errors.injury_details && <span className="profile-field-error">{errors.injury_details}</span>}
                        </div>

                        <div className="profile-field span-2">
                            <label className="profile-label">Medical History</label>
                            <textarea
                                className="profile-textarea"
                                name="medical_history"
                                value={form.medical_history}
                                onChange={handleChange}
                                placeholder="Previous surgeries, chronic conditions, or relevant medical history"
                            />
                            {errors.medical_history && <span className="profile-field-error">{errors.medical_history}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Allergies</label>
                            <textarea
                                className="profile-textarea"
                                name="allergies"
                                value={form.allergies}
                                onChange={handleChange}
                                placeholder="List any known allergies"
                                style={{ minHeight: '70px' }}
                            />
                            {errors.allergies && <span className="profile-field-error">{errors.allergies}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Current Medications</label>
                            <textarea
                                className="profile-textarea"
                                name="current_medications"
                                value={form.current_medications}
                                onChange={handleChange}
                                placeholder="List current medications and dosages"
                                style={{ minHeight: '70px' }}
                            />
                            {errors.current_medications && <span className="profile-field-error">{errors.current_medications}</span>}
                        </div>
                    </div>

                    <div className="profile-form-footer">
                        <button className="profile-save-btn" type="submit" disabled={saving}>
                            {saving && <Spinner />}
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </form>
        </ClientLayout>
    );
}
