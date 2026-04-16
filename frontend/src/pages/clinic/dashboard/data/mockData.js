// Mock data — Clinic Dashboard
// Replace with real API calls in Sprint 4

export const mockClinicStats = {
    activePatients: 24,
    pendingRequests: 7,
    safetyFlags: 3,
};

export const mockAccessRequests = [
    { id: 1, clientName: 'Ahmad Khalil',   initials: 'AK', condition: 'Knee rehabilitation post ACL surgery', payment: 'Cash',             requestedAt: '2h ago'  },
    { id: 2, clientName: 'Nour Saleh',     initials: 'NS', condition: 'Chronic lower back pain management',   payment: 'Insurance',         requestedAt: '5h ago'  },
    { id: 3, clientName: 'Khalil Habib',   initials: 'KH', condition: 'Shoulder impingement recovery',        payment: 'Cash',             requestedAt: '1d ago'  },
    { id: 4, clientName: 'Rima Younes',    initials: 'RY', condition: 'Post-fracture ankle rehab',            payment: 'Insurance',         requestedAt: '1d ago'  },
    { id: 5, clientName: 'Tarek Nassif',   initials: 'TN', condition: 'Hip flexor strain recovery',           payment: 'Cash',             requestedAt: '2d ago'  },
    { id: 6, clientName: 'Lara Khoury',    initials: 'LK', condition: 'Cervical spine physiotherapy',         payment: 'Bank Transfer',    requestedAt: '2d ago'  },
    { id: 7, clientName: 'Georges Azar',   initials: 'GA', condition: 'Sports injury — hamstring tear',       payment: 'Cash',             requestedAt: '3d ago'  },
];

export const mockSafetyFlags = [
    { id: 1,  patientName: 'Sara Mansour',   initials: 'SM', issue: 'Reported sudden pain spike (9/10) after session',         priority: 'high',   flaggedAt: '1h ago'   },
    { id: 2,  patientName: 'Omar Diab',      initials: 'OD', issue: 'Missed 4 consecutive sessions without contact',            priority: 'high',   flaggedAt: '3h ago'   },
    { id: 3,  patientName: 'Hana Frem',      initials: 'HF', issue: 'Reported dizziness during prescribed exercises',           priority: 'medium', flaggedAt: '6h ago'   },
    { id: 4,  patientName: 'Ziad Tawk',      initials: 'ZT', issue: 'Pain levels not improving after 3 weeks of treatment',     priority: 'medium', flaggedAt: '1d ago'   },
    { id: 5,  patientName: 'Maya Karam',     initials: 'MK', issue: 'Reported difficulty completing warm-up routine',           priority: 'medium', flaggedAt: '1d ago'   },
    { id: 6,  patientName: 'Fares Noun',     initials: 'FN', issue: 'Minor adherence drop (−12%) this week',                    priority: 'low',    flaggedAt: '2d ago'   },
    { id: 7,  patientName: 'Celine Aoun',    initials: 'CA', issue: 'Skipped cool-down exercises twice this week',              priority: 'low',    flaggedAt: '2d ago'   },
    { id: 8,  patientName: 'Elias Gerges',   initials: 'EG', issue: 'Has not submitted feedback for 5 days',                    priority: 'low',    flaggedAt: '3d ago'   },
];

export const mockActivePatients = [
    { id: 1,  name: 'Omar Hassan',    initials: 'OH', condition: 'Lower back pain',              adherence: 87, painLevel: 3,  painStatus: 'Improving',  weeksActive: 4  },
    { id: 2,  name: 'Layla Nasser',   initials: 'LN', condition: 'Knee ACL recovery',            adherence: 92, painLevel: 2,  painStatus: 'Improving',  weeksActive: 6  },
    { id: 3,  name: 'Jad Samaha',     initials: 'JS', condition: 'Shoulder impingement',         adherence: 74, painLevel: 5,  painStatus: 'Stable',     weeksActive: 2  },
    { id: 4,  name: 'Rita Haddad',    initials: 'RH', condition: 'Hip flexor strain',            adherence: 95, painLevel: 2,  painStatus: 'Improving',  weeksActive: 8  },
    { id: 5,  name: 'Karim Bou',      initials: 'KB', condition: 'Cervical spine rehab',         adherence: 61, painLevel: 6,  painStatus: 'Worsening',  weeksActive: 1  },
    { id: 6,  name: 'Danielle Abi',   initials: 'DA', condition: 'Ankle fracture recovery',      adherence: 88, painLevel: 3,  painStatus: 'Improving',  weeksActive: 5  },
    { id: 7,  name: 'Samer Lahoud',   initials: 'SL', condition: 'Sports injury — hamstring',    adherence: 79, painLevel: 4,  painStatus: 'Stable',     weeksActive: 3  },
    { id: 8,  name: 'Nadine Khalil',  initials: 'NK', condition: 'Post-surgery knee rehab',      adherence: 83, painLevel: 4,  painStatus: 'Stable',     weeksActive: 5  },
];

export const mockClientFeedback = [
    { id: 1, patientId: 1, patientName: 'Omar Hassan',   initials: 'OH', message: 'Feeling much better today. The new stretches helped with morning stiffness significantly.', painLevel: 3, effortLevel: 6, submittedAt: '30 min ago' },
    { id: 2, patientId: 2, patientName: 'Layla Nasser',  initials: 'LN', message: 'Completed all exercises. Slight discomfort in the knee during step-ups but manageable.', painLevel: 4, effortLevel: 8, submittedAt: '2h ago'     },
    { id: 3, patientId: 4, patientName: 'Rita Haddad',   initials: 'RH', message: 'Best session yet! Hip feels noticeably stronger. Very happy with the progress.', painLevel: 2, effortLevel: 7, submittedAt: '4h ago'     },
    { id: 4, patientId: 5, patientName: 'Karim Bou',     initials: 'KB', message: 'Struggled with the rotation exercises. Neck pain got worse toward the end of the session.', painLevel: 7, effortLevel: 9, submittedAt: '6h ago'     },
    { id: 5, patientId: 7, patientName: 'Samer Lahoud',  initials: 'SL', message: 'Good session overall. Hamstring feels tight but no sharp pain. Continuing as planned.', painLevel: 4, effortLevel: 5, submittedAt: '8h ago'     },
];

export const mockPatientFeedbackHistory = {
    1: {
        patientName: 'Omar Hassan',
        initials: 'OH',
        condition: 'Lower back pain',
        adherence: 87,
        weeksActive: 4,
        reports: [
            { id: 1, date: 'Apr 16, 2026', painLevel: 3, effortLevel: 6, message: 'Feeling much better today. The new stretches helped with morning stiffness significantly.', exercisesCompleted: 5, exercisesTotal: 6 },
            { id: 2, date: 'Apr 14, 2026', painLevel: 4, effortLevel: 7, message: 'Completed most exercises. A bit tired today but pushed through. Lower back tightness is reducing.', exercisesCompleted: 4, exercisesTotal: 6 },
            { id: 3, date: 'Apr 12, 2026', painLevel: 5, effortLevel: 8, message: 'Tough session. Pain was higher than usual after the leg raises. Took extra rest.', exercisesCompleted: 3, exercisesTotal: 6 },
            { id: 4, date: 'Apr 10, 2026', painLevel: 4, effortLevel: 6, message: 'Gradual improvement. Noticed less discomfort when bending forward.', exercisesCompleted: 6, exercisesTotal: 6 },
            { id: 5, date: 'Apr 8, 2026',  painLevel: 6, effortLevel: 7, message: 'First full week done. Still painful but motivated. The exercises make sense.', exercisesCompleted: 5, exercisesTotal: 6 },
        ],
    },
    2: {
        patientName: 'Layla Nasser',
        initials: 'LN',
        condition: 'Knee ACL recovery',
        adherence: 92,
        weeksActive: 6,
        reports: [
            { id: 1, date: 'Apr 16, 2026', painLevel: 4, effortLevel: 8, message: 'Completed all exercises. Slight discomfort in the knee during step-ups but manageable.', exercisesCompleted: 6, exercisesTotal: 6 },
            { id: 2, date: 'Apr 14, 2026', painLevel: 3, effortLevel: 7, message: 'Knee feels much more stable this week. Balance exercises are getting easier.', exercisesCompleted: 6, exercisesTotal: 6 },
            { id: 3, date: 'Apr 12, 2026', painLevel: 3, effortLevel: 7, message: 'Progressing well. Managed to do the squat variations without swelling.', exercisesCompleted: 5, exercisesTotal: 6 },
        ],
    },
    5: {
        patientName: 'Karim Bou',
        initials: 'KB',
        condition: 'Cervical spine rehab',
        adherence: 61,
        weeksActive: 1,
        reports: [
            { id: 1, date: 'Apr 16, 2026', painLevel: 7, effortLevel: 9, message: 'Struggled with the rotation exercises. Neck pain got worse toward the end of the session.', exercisesCompleted: 3, exercisesTotal: 6 },
            { id: 2, date: 'Apr 14, 2026', painLevel: 6, effortLevel: 8, message: 'First session was hard. Neck very stiff. Hoping it gets easier.', exercisesCompleted: 4, exercisesTotal: 6 },
        ],
    },
};

export const mockAdherenceTrend = [
    { label: 'W1', value: 72 },
    { label: 'W2', value: 78 },
    { label: 'W3', value: 81 },
    { label: 'W4', value: 85 },
    { label: 'W5', value: 83 },
    { label: 'W6', value: 88 },
];

export const mockPainTrend = [
    { label: 'W1', value: 72 },
    { label: 'W2', value: 65 },
    { label: 'W3', value: 58 },
    { label: 'W4', value: 49 },
    { label: 'W5', value: 42 },
    { label: 'W6', value: 35 },
];

export const mockActivityData = [
    { label: 'Mon', value: 4 },
    { label: 'Tue', value: 6 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 7 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 2 },
    { label: 'Sun', value: 1 },
];
