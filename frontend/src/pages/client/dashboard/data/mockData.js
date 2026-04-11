// Mock data — Client Dashboard
// Replace with real API calls in Sprint 4

export const mockMetrics = {
    adherenceRate: 87,
    painLevel: 3,
    recoveryProgress: 64,
};

export const mockWeeklyDays = [
    { id: 'mon', label: 'Monday',    short: 'M', date: 'Apr 7',  completion: 100, status: 'complete' },
    { id: 'tue', label: 'Tuesday',   short: 'T', date: 'Apr 8',  completion: 80,  status: 'partial'  },
    { id: 'wed', label: 'Wednesday', short: 'W', date: 'Apr 9',  completion: 0,   status: 'rest'     },
    { id: 'thu', label: 'Thursday',  short: 'T', date: 'Apr 10', completion: 60,  status: 'partial'  },
    { id: 'fri', label: 'Friday',    short: 'F', date: 'Apr 11', completion: 0,   status: 'upcoming' },
    { id: 'sat', label: 'Saturday',  short: 'S', date: 'Apr 12', completion: 0,   status: 'rest'     },
    { id: 'sun', label: 'Sunday',    short: 'S', date: 'Apr 13', completion: 0,   status: 'upcoming' },
];

export const mockPainTrend = [
    { week: 'Week 1', level: 7,  maxLevel: 10 },
    { week: 'Week 2', level: 6,  maxLevel: 10 },
    { week: 'Week 3', level: 4,  maxLevel: 10 },
    { week: 'Week 4', level: 3,  maxLevel: 10 },
];

export const mockMilestones = [
    { id: 1, type: 'streak',   label: 'Current Streak',    value: '7 days',          achieved: true  },
    { id: 2, type: 'sessions', label: 'Sessions Completed', value: '14 sessions',    achieved: true  },
    { id: 3, type: 'perfect',  label: 'Perfect Week',       value: 'Week 3',         achieved: true  },
    { id: 4, type: 'pain',     label: 'Pain Reduction',     value: '−57% from start', achieved: true  },
    { id: 5, type: 'target',   label: 'Goal Completion',    value: '3 / 5 goals',    achieved: false },
];

export const mockTodayExercises = [
    { id: 1, name: 'Hip Flexor Stretch',  sets: 3, reps: 15,   duration: '2 min', tags: ['mobility', 'hip'],       difficulty: 'easy',     substitute: 'Supine Hip Flexor Stretch', restTime: 1 },
    { id: 2, name: 'Quad Strengthening',  sets: 4, reps: 12,   duration: '4 min', tags: ['strength', 'quad'],      difficulty: 'moderate', substitute: 'Wall Sit',                  restTime: 2 },
    { id: 3, name: 'Calf Raises',         sets: 3, reps: 20,   duration: '3 min', tags: ['strength', 'balance'],   difficulty: 'easy',     substitute: 'Seated Calf Raises',        restTime: 1 },
    { id: 4, name: 'Balance Board',       sets: 2, reps: null, duration: '5 min', tags: ['balance', 'core'],       difficulty: 'moderate', substitute: 'Single Leg Stand',          restTime: 2 },
    { id: 5, name: 'Hamstring Curl',      sets: 3, reps: 10,   duration: '3 min', tags: ['strength', 'hamstring'], difficulty: 'hard',     substitute: 'Prone Hip Extension',      restTime: 2 },
    { id: 6, name: 'Seated Leg Press',    sets: 3, reps: 12,   duration: '4 min', tags: ['strength', 'knee'],      difficulty: 'moderate', substitute: 'Bodyweight Squat',          restTime: 2 },
];

export const mockWeeklySchedule = {
    mon: {
        label: 'Monday', date: 'Apr 7', isRest: false, status: 'complete',
        estimatedTime: '28 min', difficulty: 'Moderate',
        exercises: [
            { id: 1,  name: 'Hip Flexor Stretch',  sets: 3, reps: 15,   duration: '2 min', tags: ['mobility'] },
            { id: 2,  name: 'Quad Strengthening',  sets: 4, reps: 12,   duration: '4 min', tags: ['strength'] },
            { id: 3,  name: 'Calf Raises',         sets: 3, reps: 20,   duration: '3 min', tags: ['strength'] },
        ],
    },
    tue: {
        label: 'Tuesday', date: 'Apr 8', isRest: false, status: 'partial',
        estimatedTime: '35 min', difficulty: 'Moderate',
        exercises: [
            { id: 4,  name: 'Balance Board',       sets: 2, reps: null, duration: '5 min', tags: ['balance']  },
            { id: 5,  name: 'Hamstring Curl',      sets: 3, reps: 10,   duration: '3 min', tags: ['strength'] },
            { id: 6,  name: 'Seated Leg Press',    sets: 3, reps: 12,   duration: '4 min', tags: ['strength'] },
            { id: 7,  name: 'Side Leg Raises',     sets: 3, reps: 15,   duration: '3 min', tags: ['mobility'] },
        ],
    },
    wed: {
        label: 'Wednesday', date: 'Apr 9', isRest: true, status: 'rest',
        estimatedTime: null, difficulty: null, exercises: [],
    },
    thu: {
        label: 'Thursday', date: 'Apr 10', isRest: false, status: 'partial',
        estimatedTime: '30 min', difficulty: 'Hard',
        exercises: [
            { id: 1,  name: 'Hip Flexor Stretch',      sets: 3, reps: 15,   duration: '2 min', tags: ['mobility']           },
            { id: 8,  name: 'Single Leg Squat',        sets: 3, reps: 8,    duration: '4 min', tags: ['strength', 'balance'] },
            { id: 9,  name: 'Resistance Band Walk',    sets: 2, reps: null, duration: '5 min', tags: ['mobility', 'hip']     },
        ],
    },
    fri: {
        label: 'Friday', date: 'Apr 11', isRest: false, status: 'upcoming',
        estimatedTime: '32 min', difficulty: 'Moderate',
        exercises: [
            { id: 4,  name: 'Balance Board',           sets: 2, reps: null, duration: '5 min', tags: ['balance']  },
            { id: 10, name: 'Seated Knee Extension',   sets: 3, reps: 15,   duration: '3 min', tags: ['strength', 'knee'] },
            { id: 6,  name: 'Seated Leg Press',        sets: 3, reps: 12,   duration: '4 min', tags: ['strength'] },
        ],
    },
    sat: {
        label: 'Saturday', date: 'Apr 12', isRest: true, status: 'rest',
        estimatedTime: null, difficulty: null, exercises: [],
    },
    sun: {
        label: 'Sunday', date: 'Apr 13', isRest: false, status: 'upcoming',
        estimatedTime: '20 min', difficulty: 'Easy',
        exercises: [
            { id: 1,  name: 'Hip Flexor Stretch',  sets: 3, reps: 15,   duration: '2 min',  tags: ['mobility']           },
            { id: 11, name: 'Light Walking',        sets: 1, reps: null, duration: '15 min', tags: ['cardio', 'recovery'] },
        ],
    },
};
