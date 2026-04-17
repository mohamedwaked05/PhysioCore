<?php

namespace App\Data;

class PredefinedExercises
{
    private static array $library = [
        'acl' => [
            ['name' => 'Quad Sets',                  'sets' => 3, 'reps' => 15, 'notes' => 'Tighten thigh muscle while lying flat',            'alternative_exercise' => null],
            ['name' => 'Straight Leg Raises',         'sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => 'Short Arc Quads'],
            ['name' => 'Heel Slides',                 'sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => null],
            ['name' => 'Terminal Knee Extension',     'sets' => 3, 'reps' => 15, 'notes' => 'Use resistance band around back of knee',         'alternative_exercise' => null],
            ['name' => 'Mini Squats',                 'sets' => 3, 'reps' => 12, 'notes' => '0–45 degrees only, keep chest up',                'alternative_exercise' => 'Wall Slides'],
            ['name' => 'Calf Raises',                 'sets' => 3, 'reps' => 20, 'notes' => null,                                              'alternative_exercise' => 'Seated Calf Raises'],
            ['name' => 'Single Leg Balance',          'sets' => 3, 'reps' => 1,  'notes' => '30 seconds per set',                              'alternative_exercise' => 'Balance Board'],
        ],
        'lower_back' => [
            ['name' => 'Pelvic Tilts',                'sets' => 3, 'reps' => 15, 'notes' => 'Flatten lower back against floor',                'alternative_exercise' => null],
            ['name' => 'Knee-to-Chest Stretch',       'sets' => 3, 'reps' => 10, 'notes' => 'Hold 5 seconds each rep',                         'alternative_exercise' => null],
            ['name' => 'Bridge',                      'sets' => 3, 'reps' => 15, 'notes' => 'Hold 2 seconds at top',                           'alternative_exercise' => 'Single Leg Bridge'],
            ['name' => 'Bird Dog',                    'sets' => 3, 'reps' => 10, 'notes' => 'Alternate sides, keep core engaged',              'alternative_exercise' => null],
            ['name' => 'Cat-Cow Stretch',             'sets' => 2, 'reps' => 10, 'notes' => 'Slow controlled breathing',                       'alternative_exercise' => null],
            ['name' => 'Dead Bug',                    'sets' => 3, 'reps' => 10, 'notes' => 'Lower back stays flat on floor',                  'alternative_exercise' => null],
        ],
        'shoulder_impingement' => [
            ['name' => 'Pendulum Exercise',           'sets' => 3, 'reps' => 10, 'notes' => 'Lean forward, let arm hang, small circles',       'alternative_exercise' => null],
            ['name' => 'Shoulder Blade Squeeze',      'sets' => 3, 'reps' => 15, 'notes' => 'Hold 5 seconds each rep',                         'alternative_exercise' => null],
            ['name' => 'External Rotation (band)',    'sets' => 3, 'reps' => 15, 'notes' => 'Elbow at 90 degrees, elbow stays at side',        'alternative_exercise' => null],
            ['name' => 'Side-Lying External Rotation','sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => 'Prone External Rotation'],
            ['name' => 'Wall Slides',                 'sets' => 3, 'reps' => 12, 'notes' => 'Arms slide up wall, maintain contact',            'alternative_exercise' => null],
            ['name' => 'Sleeper Stretch',             'sets' => 3, 'reps' => 1,  'notes' => 'Hold 30 seconds per side',                        'alternative_exercise' => null],
        ],
        'hip_flexor' => [
            ['name' => 'Hip Flexor Stretch (kneeling)','sets' => 3, 'reps' => 1, 'notes' => 'Hold 30–45 seconds each side',                   'alternative_exercise' => 'Standing Hip Flexor Stretch'],
            ['name' => 'Supine Hip Flexor Stretch',   'sets' => 3, 'reps' => 1,  'notes' => 'Hold 30 seconds',                                 'alternative_exercise' => null],
            ['name' => 'Bridge',                      'sets' => 3, 'reps' => 15, 'notes' => 'Focus on squeezing glutes at top',                'alternative_exercise' => null],
            ['name' => 'Clamshells',                  'sets' => 3, 'reps' => 15, 'notes' => 'Use resistance band if comfortable',              'alternative_exercise' => null],
            ['name' => 'Side Leg Raises',             'sets' => 3, 'reps' => 15, 'notes' => 'Keep pelvis neutral',                             'alternative_exercise' => null],
            ['name' => 'Reverse Lunge',               'sets' => 3, 'reps' => 10, 'notes' => 'Step back, keep front knee over ankle',           'alternative_exercise' => 'Split Squat'],
        ],
        'cervical_spine' => [
            ['name' => 'Chin Tucks',                  'sets' => 3, 'reps' => 10, 'notes' => 'Hold 5 seconds, avoid jutting jaw',              'alternative_exercise' => null],
            ['name' => 'Cervical Rotation',           'sets' => 2, 'reps' => 10, 'notes' => 'Slow and controlled, stop if pain increases',    'alternative_exercise' => null],
            ['name' => 'Cervical Side Bend Stretch',  'sets' => 2, 'reps' => 1,  'notes' => 'Hold 20–30 seconds each side',                   'alternative_exercise' => null],
            ['name' => 'Shoulder Shrugs',             'sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => null],
            ['name' => 'Scapular Retraction',         'sets' => 3, 'reps' => 15, 'notes' => 'Squeeze shoulder blades together',               'alternative_exercise' => null],
            ['name' => 'Upper Trapezius Stretch',     'sets' => 2, 'reps' => 1,  'notes' => 'Hold 30 seconds each side',                      'alternative_exercise' => null],
        ],
        'ankle' => [
            ['name' => 'Ankle Circles',               'sets' => 3, 'reps' => 10, 'notes' => 'Clockwise and counter-clockwise',                'alternative_exercise' => null],
            ['name' => 'Alphabet Tracing',            'sets' => 2, 'reps' => 1,  'notes' => 'Trace alphabet with big toe in air',             'alternative_exercise' => null],
            ['name' => 'Towel Scrunches',             'sets' => 3, 'reps' => 15, 'notes' => 'Scrunch towel with toes',                        'alternative_exercise' => null],
            ['name' => 'Calf Raises',                 'sets' => 3, 'reps' => 20, 'notes' => 'Hold top 2 seconds',                             'alternative_exercise' => 'Seated Calf Raises'],
            ['name' => 'Single Leg Balance',          'sets' => 3, 'reps' => 1,  'notes' => '20–30 seconds per set',                          'alternative_exercise' => null],
            ['name' => 'Resistance Band Dorsiflexion','sets' => 3, 'reps' => 15, 'notes' => 'Pull foot up against band resistance',           'alternative_exercise' => null],
        ],
        'hamstring' => [
            ['name' => 'Standing Hamstring Stretch',  'sets' => 3, 'reps' => 1,  'notes' => 'Hold 30 seconds each leg',                       'alternative_exercise' => 'Seated Hamstring Stretch'],
            ['name' => 'Prone Leg Curl',              'sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => 'Seated Leg Curl'],
            ['name' => 'Nordic Hamstring Curl',       'sets' => 3, 'reps' => 8,  'notes' => 'Eccentric phase only if pain is present',        'alternative_exercise' => null],
            ['name' => 'Bridge',                      'sets' => 3, 'reps' => 15, 'notes' => 'Focus on hamstring contraction',                  'alternative_exercise' => 'Single Leg Bridge'],
            ['name' => 'Romanian Deadlift',           'sets' => 3, 'reps' => 10, 'notes' => 'Start with bodyweight, hinge at hip',            'alternative_exercise' => 'Good Mornings'],
            ['name' => 'Side-Lying Hip Extension',    'sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => null],
        ],
        'knee_osteoarthritis' => [
            ['name' => 'Quad Sets',                   'sets' => 3, 'reps' => 15, 'notes' => 'Tighten quad, hold 5 seconds',                   'alternative_exercise' => null],
            ['name' => 'Straight Leg Raises',         'sets' => 3, 'reps' => 15, 'notes' => null,                                              'alternative_exercise' => null],
            ['name' => 'Seated Knee Extension',       'sets' => 3, 'reps' => 15, 'notes' => 'Slow controlled movement',                       'alternative_exercise' => null],
            ['name' => 'Step-Ups',                    'sets' => 3, 'reps' => 10, 'notes' => 'Low step height (4–6 inches)',                   'alternative_exercise' => 'Seated Leg Press'],
            ['name' => 'Calf Raises',                 'sets' => 3, 'reps' => 20, 'notes' => null,                                              'alternative_exercise' => 'Seated Calf Raises'],
            ['name' => 'Hamstring Stretch',           'sets' => 3, 'reps' => 1,  'notes' => 'Hold 30 seconds each side',                      'alternative_exercise' => null],
        ],
    ];

    public static function byInjuryType(string $type): array
    {
        return self::$library[$type] ?? [];
    }

    public static function all(): array
    {
        return self::$library;
    }

    public static function types(): array
    {
        return array_keys(self::$library);
    }
}
