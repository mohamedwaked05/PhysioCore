import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';
import { Field, Label, Input, Textarea, FieldError } from '../../components/ui/Input';
import '../../styles/ui.css';
import '../../styles/client.css';

const INITIAL_FORM = {
    nickname:            '',
    date_of_birth:       '',
    gender:              '',
    language:            '',
    country:             '',
    timezone:            '',
    phone:               '',
    address:             '',
    condition_summary:   '',
    injury_details:      '',
    medical_history:     '',
    allergies:           '',
    current_medications: '',
    emergency_contact:   '',
};

export default function ClientProfilePage() {
    const [form, setForm]             = useState(INITIAL_FORM);
    const [photoFile, setPhotoFile]   = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [errors, setErrors]         = useState({});
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [editing, setEditing]       = useState(false);
    const [success, setSuccess]       = useState(false);
    const [errorMsg, setErrorMsg]     = useState('');
    const [userName, setUserName]     = useState('');

    useEffect(() => {
        getProfile()
            .then(res => {
                const d = res.data ?? {};
                setForm({
                    nickname:            d.nickname            ?? '',
                    date_of_birth:       d.date_of_birth       ?? '',
                    gender:              d.gender              ?? '',
                    language:            d.language            ?? '',
                    country:             d.country             ?? '',
                    timezone:            d.timezone            ?? '',
                    phone:               d.phone               ?? '',
                    address:             d.address             ?? '',
                    condition_summary:   d.condition_summary   ?? '',
                    injury_details:      d.injury_details      ?? '',
                    medical_history:     d.medical_history     ?? '',
                    allergies:           d.allergies           ?? '',
                    current_medications: d.current_medications ?? '',
                    emergency_contact:   d.emergency_contact   ?? '',
                });
                setPhotoPreview(d.profile_photo_url ?? '');

                try {
                    const u = JSON.parse(localStorage.getItem('user') || '{}');
                    setUserName(`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim());
                } catch {}
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const handlePhotoChange = (file) => {
        const MAX_MB = 5;
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setErrors(prev => ({ ...prev, profile_photo: 'Only JPG and PNG are allowed.' }));
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, profile_photo: `Max file size is ${MAX_MB}MB.` }));
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setErrors(prev => ({ ...prev, profile_photo: null }));
    };

    const handleCancel = () => {
        setEditing(false);
        setErrors({});
        setErrorMsg('');
        if (photoFile) {
            setPhotoFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccess(false);
        setSaving(true);

        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') formData.append(k, v);
        });
        if (photoFile) formData.append('profile_photo', photoFile);

        try {
            const res = await updateProfile(formData);
            const d   = res.data ?? {};
            setPhotoPreview(d.profile_photo_url ?? photoPreview);
            setPhotoFile(null);
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3500);
        } catch (err) {
            const serverErrors = err.response?.data?.errors ?? {};
            if (Object.keys(serverErrors).length > 0) {
                const flat = {};
                Object.entries(serverErrors).forEach(([k, v]) => { flat[k] = v[0]; });
                setErrors(flat);
            } else {
                setErrorMsg(err.response?.data?.message ?? 'Failed to save. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const displayName = form.nickname || userName || 'My Profile';

    if (loading) {
        return (
            <ClientLayout>
                <div className="client-loading"><div className="client-spinner" /></div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            {success  && <div className="ui-alert ui-alert--success">Profile updated successfully.</div>}
            {errorMsg && <div className="ui-alert ui-alert--error">{errorMsg}</div>}

            {/* Profile Header */}
            <div className="ui-profile-header" style={{ marginBottom: '1.25rem' }}>
                <Avatar
                    src={photoPreview}
                    name={userName}
                    size="xl"
                    editable={editing}
                    onFileChange={handlePhotoChange}
                />
                <div className="ui-profile-header-info">
                    <h1 className="ui-profile-header-name">{displayName}</h1>
                    <p className="ui-profile-header-sub">
                        {form.country && form.language
                            ? `${form.country} · ${form.language}`
                            : form.country || form.language || 'Complete your profile to get started'}
                    </p>
                    {errors.profile_photo && (
                        <span className="ui-field-error" style={{ marginTop: '0.25rem', display: 'block' }}>
                            {errors.profile_photo}
                        </span>
                    )}
                </div>
                <div className="ui-profile-header-actions">
                    {editing
                        ? <>
                            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>Cancel</Button>
                            <Button variant="primary" size="sm" type="submit" form="profile-form" loading={saving}>
                                Save Changes
                            </Button>
                          </>
                        : <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
                    }
                </div>
            </div>

            <form id="profile-form" onSubmit={handleSubmit}>
                {/* Personal Information */}
                <Card style={{ marginBottom: '1.25rem' }}>
                    <SectionHeader title="Personal Information" />
                    <div className="ui-form-grid">

                        <Field>
                            <Label hint="optional">Nickname</Label>
                            <Input
                                name="nickname"
                                value={form.nickname}
                                onChange={handleChange}
                                placeholder="What should we call you?"
                                disabled={!editing}
                                error={errors.nickname}
                            />
                            <FieldError message={errors.nickname} />
                        </Field>

                        <Field>
                            <Label hint="optional">Date of Birth</Label>
                            <Input
                                type="date"
                                name="date_of_birth"
                                value={form.date_of_birth}
                                onChange={handleChange}
                                disabled={!editing}
                                error={errors.date_of_birth}
                            />
                            <FieldError message={errors.date_of_birth} />
                        </Field>

                        <Field>
                            <Label hint="optional">Gender</Label>
                            <select
                                className={`ui-select${errors.gender ? ' ui-input--error' : ''}`}
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <FieldError message={errors.gender} />
                        </Field>

                        <Field>
                            <Label hint="optional">Phone</Label>
                            <Input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 8900"
                                disabled={!editing}
                                error={errors.phone}
                            />
                            <FieldError message={errors.phone} />
                        </Field>

                        <Field>
                            <Label hint="optional">Country</Label>
                            <Input
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                placeholder="e.g. United States"
                                disabled={!editing}
                                error={errors.country}
                            />
                            <FieldError message={errors.country} />
                        </Field>

                        <Field>
                            <Label hint="optional">Language</Label>
                            <Input
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                placeholder="e.g. English"
                                disabled={!editing}
                                error={errors.language}
                            />
                            <FieldError message={errors.language} />
                        </Field>

                        <Field>
                            <Label hint="optional">Timezone</Label>
                            <Input
                                name="timezone"
                                value={form.timezone}
                                onChange={handleChange}
                                placeholder="e.g. UTC+3"
                                disabled={!editing}
                                error={errors.timezone}
                            />
                            <FieldError message={errors.timezone} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Address</Label>
                            <Input
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Street, city, country"
                                disabled={!editing}
                                error={errors.address}
                            />
                            <FieldError message={errors.address} />
                        </Field>

                    </div>
                </Card>

                {/* Medical Information */}
                <Card>
                    <SectionHeader title="Medical Information" />
                    <div className="ui-form-grid">

                        <Field className="span-2">
                            <Label hint="optional">Condition Summary</Label>
                            <Textarea
                                name="condition_summary"
                                value={form.condition_summary}
                                onChange={handleChange}
                                placeholder="Brief summary of your current condition"
                                disabled={!editing}
                                error={errors.condition_summary}
                            />
                            <FieldError message={errors.condition_summary} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Injury Details</Label>
                            <Textarea
                                name="injury_details"
                                value={form.injury_details}
                                onChange={handleChange}
                                placeholder="Describe any injuries or physical limitations"
                                disabled={!editing}
                                error={errors.injury_details}
                            />
                            <FieldError message={errors.injury_details} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Medical History</Label>
                            <Textarea
                                name="medical_history"
                                value={form.medical_history}
                                onChange={handleChange}
                                placeholder="Relevant past diagnoses, surgeries, or treatments"
                                disabled={!editing}
                                error={errors.medical_history}
                            />
                            <FieldError message={errors.medical_history} />
                        </Field>

                        <Field>
                            <Label hint="optional">Allergies</Label>
                            <Input
                                name="allergies"
                                value={form.allergies}
                                onChange={handleChange}
                                placeholder="e.g. Penicillin, latex"
                                disabled={!editing}
                                error={errors.allergies}
                            />
                            <FieldError message={errors.allergies} />
                        </Field>

                        <Field>
                            <Label hint="optional">Current Medications</Label>
                            <Input
                                name="current_medications"
                                value={form.current_medications}
                                onChange={handleChange}
                                placeholder="e.g. Ibuprofen 400mg"
                                disabled={!editing}
                                error={errors.current_medications}
                            />
                            <FieldError message={errors.current_medications} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Emergency Contact</Label>
                            <Input
                                name="emergency_contact"
                                value={form.emergency_contact}
                                onChange={handleChange}
                                placeholder="Name and phone number"
                                disabled={!editing}
                                error={errors.emergency_contact}
                            />
                            <FieldError message={errors.emergency_contact} />
                        </Field>

                    </div>
                </Card>
            </form>
        </ClientLayout>
    );
}
