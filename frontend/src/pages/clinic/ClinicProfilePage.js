import { useEffect, useRef, useState } from 'react';
import { getClinicProfile, createClinicProfile, updateClinicProfile } from '../../api/clinic';
import ClinicLayout from '../../components/ClinicLayout';
import Spinner from '../../components/Spinner';
import '../../styles/clinic.css';

const INITIAL_FORM = {
    legal_name:      '',
    commercial_name: '',
    clinic_email:    '',
    clinic_mobile:   '',
    address:         '',
    description:     '',
    specialty_text:  '',
    tax_id:          '',
    license_number:  '',
};

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES    = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_LABEL    = 'PDF, JPG, PNG';

function FileUpload({ file, currentUrl, onChange, error }) {
    const inputRef = useRef();

    const handleChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        onChange(selected);
        // reset input so same file can be re-selected after error
        e.target.value = '';
    };

    return (
        <div className="file-upload-wrap">
            <input
                ref={inputRef}
                type="file"
                id="license_file"
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
                    {file ? file.name : `Choose license file (${ALLOWED_LABEL} — max ${MAX_FILE_SIZE_MB}MB)`}
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

            {error && <span className="profile-field-error">{error}</span>}
        </div>
    );
}

export default function ClinicProfilePage() {
    const [form, setForm]           = useState(INITIAL_FORM);
    const [licenseFile, setLicenseFile] = useState(null);
    const [currentFileUrl, setCurrentFileUrl] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [errors, setErrors]       = useState({});
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [success, setSuccess]     = useState(false);
    const [error, setError]         = useState('');

    useEffect(() => {
        getClinicProfile()
            .then(res => {
                const data = res.data ?? {};
                setForm({
                    legal_name:      data.legal_name      ?? '',
                    commercial_name: data.commercial_name ?? '',
                    clinic_email:    data.clinic_email    ?? '',
                    clinic_mobile:   data.clinic_mobile   ?? '',
                    address:         data.address         ?? '',
                    description:     data.description     ?? '',
                    specialty_text:  data.specialty_text  ?? '',
                    tax_id:          data.tax_id          ?? '',
                    license_number:  data.license_number  ?? '',
                });
                setCurrentFileUrl(data.license_file_url ?? '');
                setIsRegistered(!!data.clinic_email);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    const handleFileChange = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            setErrors(prev => ({ ...prev, license_file: `Invalid file type. Allowed: ${ALLOWED_LABEL}.` }));
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, license_file: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }));
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
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clinic_email)) errs.clinic_email = 'Enter a valid email address.';
        if (!form.clinic_mobile.trim())   errs.clinic_mobile   = 'Phone number is required.';
        if (!form.address.trim())         errs.address         = 'Address is required.';
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

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== undefined) formData.append(key, value);
        });
        if (licenseFile) formData.append('license_file', licenseFile);

        try {
            const fn   = isRegistered ? updateClinicProfile : createClinicProfile;
            const res  = await fn(formData);
            setCurrentFileUrl(res.data?.license_file_url ?? currentFileUrl);
            setIsRegistered(true);
            setLicenseFile(null);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3500);
        } catch (err) {
            const serverErrors = err.response?.data?.errors ?? {};
            if (Object.keys(serverErrors).length > 0) {
                const flat = {};
                Object.entries(serverErrors).forEach(([k, v]) => { flat[k] = v[0]; });
                setErrors(flat);
            } else {
                setError(err.response?.data?.message ?? 'Failed to save. Please try again.');
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

    return (
        <ClinicLayout>
            <div className="client-page-header">
                <h1 className="client-page-title">
                    {isRegistered ? 'Edit Registration' : 'Complete Registration'}
                </h1>
                <p className="client-page-subtitle">
                    {isRegistered
                        ? 'Update your clinic details. Changes will be reviewed by our team.'
                        : 'Fill in your clinic details to submit for verification.'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {error   && <div className="client-error-banner">{error}</div>}
                {success && <div className="client-success-banner">Clinic registration saved successfully.</div>}

                {/* Business Information */}
                <div className="client-card" style={{ marginBottom: '1.25rem' }}>
                    <p className="profile-section-label">Business Information</p>
                    <div className="profile-form-grid">

                        <div className="profile-field">
                            <label className="profile-label">Legal Name <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                className="profile-input"
                                type="text"
                                name="legal_name"
                                value={form.legal_name}
                                onChange={handleChange}
                                placeholder="Registered legal entity name"
                            />
                            {errors.legal_name && <span className="profile-field-error">{errors.legal_name}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Commercial Name <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                className="profile-input"
                                type="text"
                                name="commercial_name"
                                value={form.commercial_name}
                                onChange={handleChange}
                                placeholder="Name clients will see"
                            />
                            {errors.commercial_name && <span className="profile-field-error">{errors.commercial_name}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Clinic Email <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                className="profile-input"
                                type="email"
                                name="clinic_email"
                                value={form.clinic_email}
                                onChange={handleChange}
                                placeholder="contact@yourclinic.com"
                            />
                            {errors.clinic_email && <span className="profile-field-error">{errors.clinic_email}</span>}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                className="profile-input"
                                type="tel"
                                name="clinic_mobile"
                                value={form.clinic_mobile}
                                onChange={handleChange}
                                placeholder="+1 234 567 8900"
                            />
                            {errors.clinic_mobile && <span className="profile-field-error">{errors.clinic_mobile}</span>}
                        </div>

                        <div className="profile-field span-2">
                            <label className="profile-label">Address <span style={{ color: '#dc2626' }}>*</span></label>
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

                        <div className="profile-field">
                            <label className="profile-label">Tax ID <span style={{ color: '#9896a4', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></label>
                            <input
                                className="profile-input"
                                type="text"
                                name="tax_id"
                                value={form.tax_id}
                                onChange={handleChange}
                                placeholder="e.g. VAT-123456"
                            />
                            {errors.tax_id && <span className="profile-field-error">{errors.tax_id}</span>}
                        </div>

                    </div>
                </div>

                {/* Clinic Details */}
                <div className="client-card" style={{ marginBottom: '1.25rem' }}>
                    <p className="profile-section-label">Clinic Details</p>
                    <div className="profile-form-grid">

                        <div className="profile-field">
                            <label className="profile-label">Specialty</label>
                            <input
                                className="profile-input"
                                type="text"
                                name="specialty_text"
                                value={form.specialty_text}
                                onChange={handleChange}
                                placeholder="e.g. Sports Rehabilitation"
                            />
                            {errors.specialty_text && <span className="profile-field-error">{errors.specialty_text}</span>}
                        </div>

                        <div className="profile-field span-2">
                            <label className="profile-label">Description</label>
                            <textarea
                                className="profile-textarea"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe your clinic, services, and approach"
                            />
                            {errors.description && <span className="profile-field-error">{errors.description}</span>}
                        </div>

                    </div>
                </div>

                {/* License Information */}
                <div className="client-card">
                    <p className="profile-section-label">License Information</p>
                    <div className="profile-form-grid">

                        <div className="profile-field">
                            <label className="profile-label">License Number</label>
                            <input
                                className="profile-input"
                                type="text"
                                name="license_number"
                                value={form.license_number}
                                onChange={handleChange}
                                placeholder="e.g. MED-2024-001234"
                            />
                            {errors.license_number && <span className="profile-field-error">{errors.license_number}</span>}
                        </div>

                        <div className="profile-field span-2">
                            <label className="profile-label">License Document</label>
                            <FileUpload
                                file={licenseFile}
                                currentUrl={currentFileUrl}
                                onChange={handleFileChange}
                                error={errors.license_file}
                            />
                        </div>

                    </div>

                    <div className="profile-form-footer">
                        <button className="profile-save-btn" type="submit" disabled={saving}>
                            {saving && <Spinner />}
                            {saving ? 'Saving...' : isRegistered ? 'Save Changes' : 'Submit Registration'}
                        </button>
                    </div>
                </div>
            </form>
        </ClinicLayout>
    );
}
