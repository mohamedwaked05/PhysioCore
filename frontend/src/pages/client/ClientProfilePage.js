import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';
import Avatar from '../../components/ui/Avatar';
import ProfileBanner from '../../components/ui/ProfileBanner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';
import Skeleton from '../../components/ui/Skeleton';
import { Field, Label, Input, Textarea, FieldError } from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import '../../styles/ui.css';
import '../../styles/client.css';

const LANGUAGES = [
    'Arabic', 'Bengali', 'Chinese (Simplified)', 'Chinese (Traditional)',
    'Dutch', 'English', 'French', 'German', 'Greek', 'Hebrew',
    'Hindi', 'Indonesian', 'Italian', 'Japanese', 'Korean',
    'Malay', 'Persian', 'Polish', 'Portuguese', 'Romanian',
    'Russian', 'Spanish', 'Swahili', 'Swedish', 'Tagalog',
    'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese',
];

const TIMEZONES = [
    { label: 'UTC±00:00 — UTC',                   value: 'UTC' },
    { label: 'UTC−12:00 — Baker Island',           value: 'Etc/GMT+12' },
    { label: 'UTC−11:00 — American Samoa',         value: 'Pacific/Pago_Pago' },
    { label: 'UTC−10:00 — Hawaii',                 value: 'Pacific/Honolulu' },
    { label: 'UTC−09:00 — Alaska',                 value: 'America/Anchorage' },
    { label: 'UTC−08:00 — Los Angeles (PST)',       value: 'America/Los_Angeles' },
    { label: 'UTC−07:00 — Denver (MST)',            value: 'America/Denver' },
    { label: 'UTC−06:00 — Chicago (CST)',           value: 'America/Chicago' },
    { label: 'UTC−05:00 — New York (EST)',          value: 'America/New_York' },
    { label: 'UTC−04:00 — Halifax (AST)',           value: 'America/Halifax' },
    { label: 'UTC−03:00 — São Paulo',              value: 'America/Sao_Paulo' },
    { label: 'UTC−02:00 — South Georgia',          value: 'Atlantic/South_Georgia' },
    { label: 'UTC−01:00 — Azores',                 value: 'Atlantic/Azores' },
    { label: 'UTC+00:00 — London (GMT/BST)',        value: 'Europe/London' },
    { label: 'UTC+01:00 — Paris / Berlin (CET)',    value: 'Europe/Paris' },
    { label: 'UTC+02:00 — Cairo / Helsinki (EET)',  value: 'Africa/Cairo' },
    { label: 'UTC+02:00 — Beirut',                 value: 'Asia/Beirut' },
    { label: 'UTC+03:00 — Moscow / Riyadh',        value: 'Europe/Moscow' },
    { label: 'UTC+03:00 — Nairobi',                value: 'Africa/Nairobi' },
    { label: 'UTC+03:30 — Tehran',                 value: 'Asia/Tehran' },
    { label: 'UTC+04:00 — Dubai / Baku',           value: 'Asia/Dubai' },
    { label: 'UTC+04:30 — Kabul',                  value: 'Asia/Kabul' },
    { label: 'UTC+05:00 — Karachi / Tashkent',     value: 'Asia/Karachi' },
    { label: 'UTC+05:30 — New Delhi / Mumbai',     value: 'Asia/Kolkata' },
    { label: 'UTC+05:45 — Kathmandu',              value: 'Asia/Kathmandu' },
    { label: 'UTC+06:00 — Dhaka / Almaty',         value: 'Asia/Dhaka' },
    { label: 'UTC+06:30 — Yangon',                 value: 'Asia/Rangoon' },
    { label: 'UTC+07:00 — Bangkok / Jakarta',      value: 'Asia/Bangkok' },
    { label: 'UTC+08:00 — Beijing / Singapore',    value: 'Asia/Singapore' },
    { label: 'UTC+08:00 — Perth',                  value: 'Australia/Perth' },
    { label: 'UTC+09:00 — Tokyo / Seoul',          value: 'Asia/Tokyo' },
    { label: 'UTC+09:30 — Adelaide',               value: 'Australia/Adelaide' },
    { label: 'UTC+10:00 — Sydney',                 value: 'Australia/Sydney' },
    { label: 'UTC+11:00 — Solomon Islands',        value: 'Pacific/Guadalcanal' },
    { label: 'UTC+12:00 — Auckland / Fiji',        value: 'Pacific/Auckland' },
    { label: 'UTC+13:00 — Samoa',                  value: 'Pacific/Apia' },
];

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
    const [photoFile, setPhotoFile]       = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [coverFile, setCoverFile]       = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
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
                setCoverPreview(d.cover_photo_url ?? '');

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

    const handleCoverChange = (file) => {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleCancel = () => {
        setEditing(false);
        setErrors({});
        setErrorMsg('');
        setPhotoFile(null);
        setCoverFile(null);
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
        if (photoFile)  formData.append('profile_photo', photoFile);
        if (coverFile)  formData.append('cover_photo',   coverFile);

        try {
            const res = await updateProfile(formData);
            const d   = res.data ?? {};
            setPhotoPreview(d.profile_photo_url ?? photoPreview);
            setCoverPreview(d.cover_photo_url   ?? coverPreview);
            setPhotoFile(null);
            setCoverFile(null);
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
                <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <Skeleton height="80px" width="80px" radius="50%" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Skeleton height="22px" width="180px" radius="6px" />
                            <Skeleton height="14px" width="120px" radius="6px" />
                        </div>
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <Skeleton height="14px" width="90px" radius="5px" />
                            <Skeleton height="42px" radius="8px" />
                        </div>
                    ))}
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            {success  && <div className="ui-alert ui-alert--success">Profile updated successfully.</div>}
            {errorMsg && <div className="ui-alert ui-alert--error">{errorMsg}</div>}

            {/* Cover Banner */}
            <div style={{ marginBottom: '1.25rem' }}>
                <ProfileBanner
                    coverUrl={coverPreview}
                    editable={editing}
                    onCoverChange={handleCoverChange}
                    avatarSlot={
                        <Avatar
                            src={photoPreview}
                            name={userName}
                            gender={form.gender}
                            size="xl"
                            editable={editing}
                            onFileChange={handlePhotoChange}
                        />
                    }
                />
                <div className="ui-profile-header" style={{ marginTop: '1rem', paddingTop: 0, borderTop: 'none' }}>
                    <div className="ui-profile-header-info" style={{ flex: 1 }}>
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
                                placeholder=""
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
                            </select>
                            <FieldError message={errors.gender} />
                        </Field>

                        <Field>
                            <Label hint="optional">Phone</Label>
                            <PhoneInput
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                disabled={!editing}
                                error={errors.phone}
                                placeholder="Phone number"
                            />
                            <FieldError message={errors.phone} />
                        </Field>

                        <Field>
                            <Label hint="optional">Country</Label>
                            <select
                                className={`ui-select${errors.country ? ' ui-input--error' : ''}`}
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                <option value="">Select country</option>
                                <option value="Afghanistan">Afghanistan</option>
                                <option value="Albania">Albania</option>
                                <option value="Algeria">Algeria</option>
                                <option value="Andorra">Andorra</option>
                                <option value="Angola">Angola</option>
                                <option value="Argentina">Argentina</option>
                                <option value="Armenia">Armenia</option>
                                <option value="Australia">Australia</option>
                                <option value="Austria">Austria</option>
                                <option value="Azerbaijan">Azerbaijan</option>
                                <option value="Bahrain">Bahrain</option>
                                <option value="Bangladesh">Bangladesh</option>
                                <option value="Belarus">Belarus</option>
                                <option value="Belgium">Belgium</option>
                                <option value="Bolivia">Bolivia</option>
                                <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                                <option value="Brazil">Brazil</option>
                                <option value="Bulgaria">Bulgaria</option>
                                <option value="Cambodia">Cambodia</option>
                                <option value="Cameroon">Cameroon</option>
                                <option value="Canada">Canada</option>
                                <option value="Chile">Chile</option>
                                <option value="China">China</option>
                                <option value="Colombia">Colombia</option>
                                <option value="Croatia">Croatia</option>
                                <option value="Cuba">Cuba</option>
                                <option value="Cyprus">Cyprus</option>
                                <option value="Czech Republic">Czech Republic</option>
                                <option value="Denmark">Denmark</option>
                                <option value="Ecuador">Ecuador</option>
                                <option value="Egypt">Egypt</option>
                                <option value="Estonia">Estonia</option>
                                <option value="Ethiopia">Ethiopia</option>
                                <option value="Finland">Finland</option>
                                <option value="France">France</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Germany">Germany</option>
                                <option value="Ghana">Ghana</option>
                                <option value="Greece">Greece</option>
                                <option value="Guatemala">Guatemala</option>
                                <option value="Hungary">Hungary</option>
                                <option value="India">India</option>
                                <option value="Indonesia">Indonesia</option>
                                <option value="Iran">Iran</option>
                                <option value="Iraq">Iraq</option>
                                <option value="Ireland">Ireland</option>
                                <option value="Israel">Israel</option>
                                <option value="Italy">Italy</option>
                                <option value="Jamaica">Jamaica</option>
                                <option value="Japan">Japan</option>
                                <option value="Jordan">Jordan</option>
                                <option value="Kazakhstan">Kazakhstan</option>
                                <option value="Kenya">Kenya</option>
                                <option value="Kuwait">Kuwait</option>
                                <option value="Kyrgyzstan">Kyrgyzstan</option>
                                <option value="Latvia">Latvia</option>
                                <option value="Lebanon">Lebanon</option>
                                <option value="Libya">Libya</option>
                                <option value="Lithuania">Lithuania</option>
                                <option value="Luxembourg">Luxembourg</option>
                                <option value="Malaysia">Malaysia</option>
                                <option value="Maldives">Maldives</option>
                                <option value="Malta">Malta</option>
                                <option value="Mexico">Mexico</option>
                                <option value="Moldova">Moldova</option>
                                <option value="Monaco">Monaco</option>
                                <option value="Mongolia">Mongolia</option>
                                <option value="Montenegro">Montenegro</option>
                                <option value="Morocco">Morocco</option>
                                <option value="Mozambique">Mozambique</option>
                                <option value="Myanmar">Myanmar</option>
                                <option value="Nepal">Nepal</option>
                                <option value="Netherlands">Netherlands</option>
                                <option value="New Zealand">New Zealand</option>
                                <option value="Nigeria">Nigeria</option>
                                <option value="North Macedonia">North Macedonia</option>
                                <option value="Norway">Norway</option>
                                <option value="Oman">Oman</option>
                                <option value="Pakistan">Pakistan</option>
                                <option value="Palestine">Palestine</option>
                                <option value="Panama">Panama</option>
                                <option value="Paraguay">Paraguay</option>
                                <option value="Peru">Peru</option>
                                <option value="Philippines">Philippines</option>
                                <option value="Poland">Poland</option>
                                <option value="Portugal">Portugal</option>
                                <option value="Qatar">Qatar</option>
                                <option value="Romania">Romania</option>
                                <option value="Russia">Russia</option>
                                <option value="Saudi Arabia">Saudi Arabia</option>
                                <option value="Senegal">Senegal</option>
                                <option value="Serbia">Serbia</option>
                                <option value="Singapore">Singapore</option>
                                <option value="Slovakia">Slovakia</option>
                                <option value="Slovenia">Slovenia</option>
                                <option value="Somalia">Somalia</option>
                                <option value="South Africa">South Africa</option>
                                <option value="South Korea">South Korea</option>
                                <option value="Spain">Spain</option>
                                <option value="Sri Lanka">Sri Lanka</option>
                                <option value="Sudan">Sudan</option>
                                <option value="Sweden">Sweden</option>
                                <option value="Switzerland">Switzerland</option>
                                <option value="Syria">Syria</option>
                                <option value="Taiwan">Taiwan</option>
                                <option value="Tajikistan">Tajikistan</option>
                                <option value="Tanzania">Tanzania</option>
                                <option value="Thailand">Thailand</option>
                                <option value="Tunisia">Tunisia</option>
                                <option value="Turkey">Turkey</option>
                                <option value="Turkmenistan">Turkmenistan</option>
                                <option value="Uganda">Uganda</option>
                                <option value="Ukraine">Ukraine</option>
                                <option value="United Arab Emirates">United Arab Emirates</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="United States">United States</option>
                                <option value="Uruguay">Uruguay</option>
                                <option value="Uzbekistan">Uzbekistan</option>
                                <option value="Venezuela">Venezuela</option>
                                <option value="Vietnam">Vietnam</option>
                                <option value="Yemen">Yemen</option>
                                <option value="Zambia">Zambia</option>
                                <option value="Zimbabwe">Zimbabwe</option>
                            </select>
                            <FieldError message={errors.country} />
                        </Field>

                        <Field>
                            <Label hint="optional">Language</Label>
                            <select
                                className={`ui-select${errors.language ? ' ui-input--error' : ''}`}
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                <option value="">Select language</option>
                                {LANGUAGES.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                            <FieldError message={errors.language} />
                        </Field>

                        <Field>
                            <Label hint="optional">Timezone</Label>
                            <select
                                className={`ui-select${errors.timezone ? ' ui-input--error' : ''}`}
                                name="timezone"
                                value={form.timezone}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                <option value="">Select timezone</option>
                                {TIMEZONES.map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
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
