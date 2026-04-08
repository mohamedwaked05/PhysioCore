import { useEffect, useRef, useState } from 'react';

const COUNTRIES = [
    { flag: '🇺🇸', name: 'United States',    code: '+1'   },
    { flag: '🇨🇦', name: 'Canada',            code: '+1'   },
    { flag: '🇬🇧', name: 'United Kingdom',    code: '+44'  },
    { flag: '🇦🇺', name: 'Australia',         code: '+61'  },
    { flag: '🇳🇿', name: 'New Zealand',       code: '+64'  },
    { flag: '🇫🇷', name: 'France',            code: '+33'  },
    { flag: '🇩🇪', name: 'Germany',           code: '+49'  },
    { flag: '🇮🇹', name: 'Italy',             code: '+39'  },
    { flag: '🇪🇸', name: 'Spain',             code: '+34'  },
    { flag: '🇵🇹', name: 'Portugal',          code: '+351' },
    { flag: '🇳🇱', name: 'Netherlands',       code: '+31'  },
    { flag: '🇧🇪', name: 'Belgium',           code: '+32'  },
    { flag: '🇨🇭', name: 'Switzerland',       code: '+41'  },
    { flag: '🇦🇹', name: 'Austria',           code: '+43'  },
    { flag: '🇸🇪', name: 'Sweden',            code: '+46'  },
    { flag: '🇳🇴', name: 'Norway',            code: '+47'  },
    { flag: '🇩🇰', name: 'Denmark',           code: '+45'  },
    { flag: '🇫🇮', name: 'Finland',           code: '+358' },
    { flag: '🇵🇱', name: 'Poland',            code: '+48'  },
    { flag: '🇨🇿', name: 'Czech Republic',    code: '+420' },
    { flag: '🇭🇺', name: 'Hungary',           code: '+36'  },
    { flag: '🇷🇴', name: 'Romania',           code: '+40'  },
    { flag: '🇧🇬', name: 'Bulgaria',          code: '+359' },
    { flag: '🇬🇷', name: 'Greece',            code: '+30'  },
    { flag: '🇷🇸', name: 'Serbia',            code: '+381' },
    { flag: '🇭🇷', name: 'Croatia',           code: '+385' },
    { flag: '🇺🇦', name: 'Ukraine',           code: '+380' },
    { flag: '🇷🇺', name: 'Russia',            code: '+7'   },
    { flag: '🇹🇷', name: 'Turkey',            code: '+90'  },
    { flag: '🇱🇧', name: 'Lebanon',           code: '+961' },
    { flag: '🇯🇴', name: 'Jordan',            code: '+962' },
    { flag: '🇸🇾', name: 'Syria',             code: '+963' },
    { flag: '🇮🇶', name: 'Iraq',              code: '+964' },
    { flag: '🇸🇦', name: 'Saudi Arabia',      code: '+966' },
    { flag: '🇾🇪', name: 'Yemen',             code: '+967' },
    { flag: '🇴🇲', name: 'Oman',              code: '+968' },
    { flag: '🇮🇱', name: 'Israel',            code: '+972' },
    { flag: '🇦🇪', name: 'UAE',               code: '+971' },
    { flag: '🇶🇦', name: 'Qatar',             code: '+974' },
    { flag: '🇧🇭', name: 'Bahrain',           code: '+973' },
    { flag: '🇰🇼', name: 'Kuwait',            code: '+965' },
    { flag: '🇮🇷', name: 'Iran',              code: '+98'  },
    { flag: '🇵🇰', name: 'Pakistan',          code: '+92'  },
    { flag: '🇮🇳', name: 'India',             code: '+91'  },
    { flag: '🇧🇩', name: 'Bangladesh',        code: '+880' },
    { flag: '🇱🇰', name: 'Sri Lanka',         code: '+94'  },
    { flag: '🇳🇵', name: 'Nepal',             code: '+977' },
    { flag: '🇨🇳', name: 'China',             code: '+86'  },
    { flag: '🇯🇵', name: 'Japan',             code: '+81'  },
    { flag: '🇰🇷', name: 'South Korea',       code: '+82'  },
    { flag: '🇻🇳', name: 'Vietnam',           code: '+84'  },
    { flag: '🇹🇭', name: 'Thailand',          code: '+66'  },
    { flag: '🇲🇾', name: 'Malaysia',          code: '+60'  },
    { flag: '🇸🇬', name: 'Singapore',         code: '+65'  },
    { flag: '🇮🇩', name: 'Indonesia',         code: '+62'  },
    { flag: '🇵🇭', name: 'Philippines',       code: '+63'  },
    { flag: '🇪🇬', name: 'Egypt',             code: '+20'  },
    { flag: '🇲🇦', name: 'Morocco',           code: '+212' },
    { flag: '🇹🇳', name: 'Tunisia',           code: '+216' },
    { flag: '🇩🇿', name: 'Algeria',           code: '+213' },
    { flag: '🇿🇦', name: 'South Africa',      code: '+27'  },
    { flag: '🇳🇬', name: 'Nigeria',           code: '+234' },
    { flag: '🇰🇪', name: 'Kenya',             code: '+254' },
    { flag: '🇧🇷', name: 'Brazil',            code: '+55'  },
    { flag: '🇦🇷', name: 'Argentina',         code: '+54'  },
    { flag: '🇲🇽', name: 'Mexico',            code: '+52'  },
    { flag: '🇨🇴', name: 'Colombia',          code: '+57'  },
    { flag: '🇨🇱', name: 'Chile',             code: '+56'  },
    { flag: '🇵🇪', name: 'Peru',              code: '+51'  },
];

function parsePhone(value) {
    if (!value) return { code: '+1', number: '' };
    const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
        if (value.startsWith(c.code)) {
            return { code: c.code, number: value.slice(c.code.length).trim() };
        }
    }
    return { code: '+1', number: value };
}

export default function PhoneInput({ value, onChange, name, disabled, error, placeholder }) {
    const { code: initCode, number: initNumber } = parsePhone(value);
    const [dialCode, setDialCode] = useState(initCode);
    const [number, setNumber]     = useState(initNumber);
    const [open, setOpen]         = useState(false);
    const [search, setSearch]     = useState('');
    const wrapRef = useRef(null);

    // Sync when external value changes (e.g. on profile load)
    useEffect(() => {
        const { code, number: num } = parsePhone(value);
        setDialCode(code);
        setNumber(num);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const emit = (code, num) => {
        const combined = num ? `${code} ${num}` : '';
        onChange({ target: { name, value: combined } });
    };

    const selectCode = (code) => {
        setDialCode(code);
        setOpen(false);
        setSearch('');
        emit(code, number);
    };

    const handleNumber = (e) => {
        const num = e.target.value;
        setNumber(num);
        emit(dialCode, num);
    };

    const filtered = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    );

    const selected = COUNTRIES.find(c => c.code === dialCode) ?? COUNTRIES[0];

    return (
        <div
            ref={wrapRef}
            className={`ui-phone-input${error ? ' error' : ''}${disabled ? ' ui-phone-input--disabled' : ''}`}
        >
            <div className="ui-phone-dial-wrap">
                <button
                    type="button"
                    className="ui-phone-dial-btn"
                    onClick={() => !disabled && setOpen(o => !o)}
                    disabled={disabled}
                    tabIndex={disabled ? -1 : 0}
                >
                    <span>{selected.flag}</span>
                    <span>{dialCode}</span>
                    <svg className="ui-phone-dial-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>

                {open && (
                    <div className="ui-phone-dial-dropdown">
                        <input
                            className="ui-phone-dial-search"
                            type="text"
                            placeholder="Search country..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="ui-phone-dial-list">
                            {filtered.map((c, i) => (
                                <div
                                    key={`${c.code}-${i}`}
                                    className={`ui-phone-dial-option${c.code === dialCode ? ' active' : ''}`}
                                    onMouseDown={() => selectCode(c.code)}
                                >
                                    <span>{c.flag}</span>
                                    <span>{c.name}</span>
                                    <span className="dial-code">{c.code}</span>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    No results
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <input
                className="ui-phone-number-input"
                type="tel"
                placeholder={placeholder ?? 'Phone number'}
                value={number}
                onChange={handleNumber}
                disabled={disabled}
            />
        </div>
    );
}
