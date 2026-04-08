import { useEffect, useRef, useState } from 'react';
import { getClinicProfile, createClinicProfile, updateClinicProfile } from '../../api/clinic';
import ClinicLayout from '../../components/ClinicLayout';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';
import { Field, Label, Input, Textarea, FieldError } from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import TagInput from '../../components/ui/TagInput';
import '../../styles/ui.css';
import '../../styles/clinic.css';

/* ── Price options ───────────────────────────────────────── */
const PRICE_OPTIONS = [
    { label: '$0',   value: '0'   },
    { label: '$25',  value: '25'  },
    { label: '$50',  value: '50'  },
    { label: '$75',  value: '75'  },
    { label: '$100', value: '100' },
    { label: '$125', value: '125' },
    { label: '$150', value: '150' },
    { label: '$175', value: '175' },
    { label: '$200', value: '200' },
    { label: '$250', value: '250' },
    { label: '$300', value: '300' },
    { label: '$350', value: '350' },
    { label: '$400', value: '400' },
    { label: '$500', value: '500' },
    { label: '$600', value: '600' },
    { label: '$750', value: '750' },
    { label: '$1000',value: '1000'},
];

/* ── Working Hours Builder ───────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        const hh   = String(h).padStart(2, '0');
        const mm   = String(m).padStart(2, '0');
        const ampm = h < 12 ? 'AM' : 'PM';
        const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
        TIMES.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${ampm}` });
    }
}

function serializeSchedule(schedule) {
    return schedule
        .filter(d => d.enabled)
        .map(d => `${d.day} ${d.from}-${d.to}`)
        .join(' | ');
}

function parseSchedule(str) {
    const base = DAYS.map(day => ({ day, enabled: false, from: '09:00', to: '18:00' }));
    if (!str) return base;
    const parts = str.split('|').map(s => s.trim());
    parts.forEach(part => {
        const match = part.match(/^(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
        if (match) {
            const idx = base.findIndex(d => d.day === match[1]);
            if (idx !== -1) {
                base[idx] = { day: match[1], enabled: true, from: match[2], to: match[3] };
            }
        }
    });
    return base;
}

function WorkingHoursBuilder({ value, onChange, disabled }) {
    const [schedule, setSchedule] = useState(() => parseSchedule(value));

    useEffect(() => {
        setSchedule(parseSchedule(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const update = (newSchedule) => {
        setSchedule(newSchedule);
        onChange({ target: { name: 'working_hours', value: serializeSchedule(newSchedule) } });
    };

    const toggleDay = (i) => {
        const next = schedule.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d);
        update(next);
    };

    const setTime = (i, field, val) => {
        const next = schedule.map((d, idx) => idx === i ? { ...d, [field]: val } : d);
        update(next);
    };

    if (disabled) {
        const active = schedule.filter(d => d.enabled);
        return (
            <div className="wh-display">
                {active.length === 0
                    ? <span className="wh-display-empty">Not set</span>
                    : active.map(d => (
                        <span key={d.day} className="wh-display-chip">
                            <strong>{d.day}</strong>
                            {d.from}–{d.to}
                        </span>
                    ))
                }
            </div>
        );
    }

    return (
        <div className="wh-builder">
            {schedule.map((d, i) => (
                <div key={d.day} className={`wh-row${d.enabled ? ' wh-active' : ''}`}>
                    <input
                        type="checkbox"
                        className="wh-toggle"
                        checked={d.enabled}
                        onChange={() => toggleDay(i)}
                    />
                    <span className="wh-day-label">{d.day}</span>
                    {d.enabled ? (
                        <>
                            <select
                                className="wh-time-select"
                                value={d.from}
                                onChange={e => setTime(i, 'from', e.target.value)}
                            >
                                {TIMES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <span className="wh-separator">to</span>
                            <select
                                className="wh-time-select"
                                value={d.to}
                                onChange={e => setTime(i, 'to', e.target.value)}
                            >
                                {TIMES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <span className="wh-closed">Closed</span>
                    )}
                </div>
            ))}
        </div>
    );
}

const INITIAL_FORM = {
    legal_name:               '',
    commercial_name:          '',
    clinic_email:             '',
    clinic_mobile:            '',
    address:                  '',
    description:              '',
    specialty_text:           '',
    tax_id:                   '',
    license_number:           '',
    experience:               '',
    payment_methods:          '',
    working_hours:            '',
    social_media_link:        '',
    min_price:                '',
    max_price:                '',
    estimated_response_time:  '',
};

const strToTags = (str) =>
    str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

const MAX_FILE_SIZE_MB = 5;
const LICENSE_TYPES    = ['application/pdf', 'image/jpeg', 'image/png'];
const PHOTO_TYPES      = ['image/jpeg', 'image/png'];

function LicenseUpload({ file, currentUrl, onChange, error }) {
    const inputRef = useRef();

    const handleChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        onChange(selected);
        e.target.value = '';
    };

    return (
        <div className="file-upload-wrap">
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
                style={{ display: 'none' }}
            />
            <button
                type="button"
                className={`file-upload-btn${file ? ' has-file' : ''}`}
                onClick={() => inputRef.current.click()}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="file-upload-name">
                    {file ? file.name : 'Choose license file (PDF, JPG, PNG — max 5MB)'}
                </span>
            </button>

            {!file && currentUrl && (
                <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="file-current-link">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    View current license file
                </a>
            )}
            {!file && !currentUrl && (
                <span className="file-upload-hint">Upload your official clinic license for verification.</span>
            )}
            {error && <span className="ui-field-error">{error}</span>}
        </div>
    );
}

export default function ClinicProfilePage() {
    const [form, setForm]               = useState(INITIAL_FORM);
    const [serviceTags, setServiceTags] = useState([]);
    const [certTags, setCertTags]       = useState([]);
    const [licenseFile, setLicenseFile] = useState(null);
    const [licenseUrl, setLicenseUrl]   = useState('');
    const [photoFile, setPhotoFile]     = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [errors, setErrors]           = useState({});
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [editing, setEditing]         = useState(false);
    const [success, setSuccess]         = useState(false);
    const [errorMsg, setErrorMsg]       = useState('');

    useEffect(() => {
        getClinicProfile()
            .then(res => {
                const d = res.data ?? {};
                setForm({
                    legal_name:               d.legal_name               ?? '',
                    commercial_name:          d.commercial_name          ?? '',
                    clinic_email:             d.clinic_email             ?? '',
                    clinic_mobile:            d.clinic_mobile            ?? '',
                    address:                  d.address                  ?? '',
                    description:              d.description              ?? '',
                    specialty_text:           d.specialty_text           ?? '',
                    tax_id:                   d.tax_id                   ?? '',
                    license_number:           d.license_number           ?? '',
                    experience:               d.experience               ?? '',
                    payment_methods:          d.payment_methods          ?? '',
                    working_hours:            d.working_hours            ?? '',
                    social_media_link:        d.social_media_link        ?? '',
                    min_price:                d.min_price  != null ? String(d.min_price)  : '',
                    max_price:                d.max_price  != null ? String(d.max_price)  : '',
                    estimated_response_time:  d.estimated_response_time  ?? '',
                });
                setServiceTags(strToTags(d.services ?? ''));
                setCertTags(strToTags(d.certifications ?? ''));
                setLicenseUrl(d.license_file_url ?? '');
                setPhotoPreview(d.profile_photo_url ?? '');
                setIsRegistered(!!d.clinic_email);
                // New clinic starts in edit mode
                if (!d.clinic_email) setEditing(true);
            })
            .catch(() => { setEditing(true); })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const handlePhotoChange = (file) => {
        if (!PHOTO_TYPES.includes(file.type)) {
            setErrors(prev => ({ ...prev, profile_photo: 'Only JPG and PNG are allowed.' }));
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, profile_photo: `Max file size is ${MAX_FILE_SIZE_MB}MB.` }));
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setErrors(prev => ({ ...prev, profile_photo: null }));
    };

    const handleLicenseChange = (file) => {
        if (!LICENSE_TYPES.includes(file.type)) {
            setErrors(prev => ({ ...prev, license_file: 'Invalid file type. Allowed: PDF, JPG, PNG.' }));
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, license_file: `Max file size is ${MAX_FILE_SIZE_MB}MB.` }));
            return;
        }
        setLicenseFile(file);
        setErrors(prev => ({ ...prev, license_file: null }));
    };

    const validate = () => {
        const errs = {};
        if (!form.legal_name.trim())      errs.legal_name      = 'Legal name is required.';
        if (!form.commercial_name.trim()) errs.commercial_name = 'Commercial name is required.';
        if (!form.clinic_email.trim())    errs.clinic_email    = 'Clinic email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clinic_email)) errs.clinic_email = 'Enter a valid email.';
        if (!form.clinic_mobile.trim())   errs.clinic_mobile   = 'Phone number is required.';
        if (!form.address.trim())         errs.address         = 'Address is required.';
        if (!form.specialty_text.trim())          errs.specialty_text          = 'Specialty is required.';
        if (!form.tax_id.trim())                  errs.tax_id                  = 'Tax ID is required.';
        if (!form.license_number.trim())           errs.license_number          = 'License number is required.';
        if (!form.payment_methods.trim())          errs.payment_methods         = 'Payment methods are required.';
        if (!form.working_hours.trim())            errs.working_hours           = 'Working hours are required.';
        if (!form.estimated_response_time.trim())  errs.estimated_response_time = 'Estimated response time is required.';
        if (form.min_price === '' || form.min_price === null) errs.min_price = 'Min session price is required.';
        if (form.max_price === '' || form.max_price === null) errs.max_price = 'Max session price is required.';
        if (form.min_price !== '' && form.max_price !== '' && Number(form.max_price) < Number(form.min_price)) {
            errs.max_price = 'Max price must be ≥ min price.';
        }
        return errs;
    };

    const handleCancel = () => {
        setEditing(false);
        setErrors({});
        setErrorMsg('');
        if (photoFile) setPhotoFile(null);
        if (licenseFile) setLicenseFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccess(false);

        const clientErrors = validate();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setSaving(true);

        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') formData.append(k, v);
        });
        if (serviceTags.length > 0) formData.append('services', serviceTags.join(', '));
        if (certTags.length > 0)    formData.append('certifications', certTags.join(', '));
        if (licenseFile) formData.append('license_file', licenseFile);
        if (photoFile)   formData.append('profile_photo', photoFile);

        try {
            const fn  = isRegistered ? updateClinicProfile : createClinicProfile;
            const res = await fn(formData);
            const d   = res.data ?? {};
            setLicenseUrl(d.license_file_url ?? licenseUrl);
            setPhotoPreview(d.profile_photo_url ?? photoPreview);
            setIsRegistered(true);
            setLicenseFile(null);
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

    if (loading) {
        return (
            <ClinicLayout>
                <div className="client-loading"><div className="client-spinner" /></div>
            </ClinicLayout>
        );
    }

    const displayName = form.commercial_name || form.legal_name || 'Clinic Profile';

    return (
        <ClinicLayout>
            {success  && <div className="ui-alert ui-alert--success">Clinic profile saved successfully.</div>}
            {errorMsg && <div className="ui-alert ui-alert--error">{errorMsg}</div>}

            {/* Profile Header */}
            <div className="ui-profile-header" style={{ marginBottom: '1.25rem' }}>
                <Avatar
                    src={photoPreview}
                    name={displayName}
                    size="xl"
                    editable={editing}
                    onFileChange={handlePhotoChange}
                />
                <div className="ui-profile-header-info">
                    <h1 className="ui-profile-header-name">{displayName}</h1>
                    <p className="ui-profile-header-sub">
                        {form.specialty_text
                            ? form.specialty_text
                            : isRegistered ? form.address || '' : 'Complete your clinic registration'}
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
                            {isRegistered && (
                                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>Cancel</Button>
                            )}
                            <Button variant="primary" size="sm" type="submit" form="clinic-form" loading={saving}>
                                {isRegistered ? 'Save Changes' : 'Submit Registration'}
                            </Button>
                          </>
                        : <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
                    }
                </div>
            </div>

            <form id="clinic-form" onSubmit={handleSubmit}>

                {/* Business Information */}
                <Card style={{ marginBottom: '1.25rem' }}>
                    <SectionHeader title="Business Information" />
                    <div className="ui-form-grid">

                        <Field>
                            <Label>Legal Name <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="legal_name"
                                value={form.legal_name}
                                onChange={handleChange}
                                placeholder="Registered legal entity name"
                                disabled={!editing}
                                error={errors.legal_name}
                            />
                            <FieldError message={errors.legal_name} />
                        </Field>

                        <Field>
                            <Label>Commercial Name <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="commercial_name"
                                value={form.commercial_name}
                                onChange={handleChange}
                                placeholder="Name clients will see"
                                disabled={!editing}
                                error={errors.commercial_name}
                            />
                            <FieldError message={errors.commercial_name} />
                        </Field>

                        <Field>
                            <Label>Clinic Email <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                type="email"
                                name="clinic_email"
                                value={form.clinic_email}
                                onChange={handleChange}
                                placeholder="contact@yourclinic.com"
                                disabled={!editing}
                                error={errors.clinic_email}
                            />
                            <FieldError message={errors.clinic_email} />
                        </Field>

                        <Field>
                            <Label>Phone Number <span style={{ color: '#dc2626' }}>*</span></Label>
                            <PhoneInput
                                name="clinic_mobile"
                                value={form.clinic_mobile}
                                onChange={handleChange}
                                disabled={!editing}
                                error={errors.clinic_mobile}
                                placeholder="Clinic phone number"
                            />
                            <FieldError message={errors.clinic_mobile} />
                        </Field>

                        <Field className="span-2">
                            <Label>Address <span style={{ color: '#dc2626' }}>*</span></Label>
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

                        <Field>
                            <Label>Tax ID <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="tax_id"
                                value={form.tax_id}
                                onChange={handleChange}
                                placeholder="e.g. VAT-123456"
                                disabled={!editing}
                                error={errors.tax_id}
                            />
                            <FieldError message={errors.tax_id} />
                        </Field>

                        <Field>
                            <Label hint="optional">Social Media</Label>
                            <Input
                                name="social_media_link"
                                value={form.social_media_link}
                                onChange={handleChange}
                                placeholder="https://instagram.com/yourclinic"
                                disabled={!editing}
                                error={errors.social_media_link}
                            />
                            <FieldError message={errors.social_media_link} />
                        </Field>

                    </div>
                </Card>

                {/* Clinic Details */}
                <Card style={{ marginBottom: '1.25rem' }}>
                    <SectionHeader title="Clinic Details" />
                    <div className="ui-form-grid">

                        <Field>
                            <Label>Specialty <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="specialty_text"
                                value={form.specialty_text}
                                onChange={handleChange}
                                placeholder="e.g. Sports Rehabilitation"
                                disabled={!editing}
                                error={errors.specialty_text}
                            />
                            <FieldError message={errors.specialty_text} />
                        </Field>

                        <Field>
                            <Label hint="optional">Experience</Label>
                            <Input
                                name="experience"
                                value={form.experience}
                                onChange={handleChange}
                                placeholder="e.g. 10+ years in physiotherapy"
                                disabled={!editing}
                                error={errors.experience}
                            />
                            <FieldError message={errors.experience} />
                        </Field>

                        <Field className="span-2">
                            <Label>Working Hours <span style={{ color: '#dc2626' }}>*</span></Label>
                            <WorkingHoursBuilder
                                value={form.working_hours}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <FieldError message={errors.working_hours} />
                        </Field>

                        <Field>
                            <Label>Payment Methods <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="payment_methods"
                                value={form.payment_methods}
                                onChange={handleChange}
                                placeholder="e.g. Cash, Visa, Insurance"
                                disabled={!editing}
                                error={errors.payment_methods}
                            />
                            <FieldError message={errors.payment_methods} />
                        </Field>

                        <Field>
                            <Label>Min. Session Price (USD) <span style={{ color: '#dc2626' }}>*</span></Label>
                            <select
                                className={`ui-select${errors.min_price ? ' ui-input--error' : ''}`}
                                name="min_price"
                                value={form.min_price}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                <option value="">Select min price</option>
                                {PRICE_OPTIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            <FieldError message={errors.min_price} />
                        </Field>

                        <Field>
                            <Label>Max. Session Price (USD) <span style={{ color: '#dc2626' }}>*</span></Label>
                            <select
                                className={`ui-select${errors.max_price ? ' ui-input--error' : ''}`}
                                name="max_price"
                                value={form.max_price}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                <option value="">Select max price</option>
                                {PRICE_OPTIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            <FieldError message={errors.max_price} />
                        </Field>

                        <Field>
                            <Label>Estimated Response Time <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="estimated_response_time"
                                value={form.estimated_response_time}
                                onChange={handleChange}
                                placeholder="e.g. Within 24 hours"
                                disabled={!editing}
                                error={errors.estimated_response_time}
                            />
                            <FieldError message={errors.estimated_response_time} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Description</Label>
                            <Textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe your clinic, services, and approach"
                                disabled={!editing}
                                error={errors.description}
                            />
                            <FieldError message={errors.description} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Services Offered</Label>
                            <TagInput
                                tags={serviceTags}
                                onChange={setServiceTags}
                                disabled={!editing}
                                placeholder="e.g. Manual therapy — press Enter to add"
                                error={errors.services}
                            />
                            <FieldError message={errors.services} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">Certifications</Label>
                            <TagInput
                                tags={certTags}
                                onChange={setCertTags}
                                disabled={!editing}
                                placeholder="e.g. ISO 9001 — press Enter to add"
                                error={errors.certifications}
                            />
                            <FieldError message={errors.certifications} />
                        </Field>

                    </div>
                </Card>

                {/* License Information */}
                <Card>
                    <SectionHeader title="License Information" />
                    <div className="ui-form-grid">

                        <Field>
                            <Label>License Number <span style={{ color: '#dc2626' }}>*</span></Label>
                            <Input
                                name="license_number"
                                value={form.license_number}
                                onChange={handleChange}
                                placeholder="e.g. MED-2024-001234"
                                disabled={!editing}
                                error={errors.license_number}
                            />
                            <FieldError message={errors.license_number} />
                        </Field>

                        <Field className="span-2">
                            <Label hint="optional">License Document</Label>
                            {editing
                                ? <LicenseUpload
                                    file={licenseFile}
                                    currentUrl={licenseUrl}
                                    onChange={handleLicenseChange}
                                    error={errors.license_file}
                                  />
                                : licenseUrl
                                    ? <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="file-current-link">
                                        View license file
                                      </a>
                                    : <span style={{ fontSize: '0.875rem', color: '#9896a4' }}>No license uploaded</span>
                            }
                        </Field>

                    </div>
                </Card>

            </form>
        </ClinicLayout>
    );
}
