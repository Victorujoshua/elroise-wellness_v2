ALTER TABLE services
ADD COLUMN IF NOT EXISTS class_start_times time[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN services.class_start_times IS
'Fixed timetable start times. Empty array means slots are generated
from practitioner shifts as before. When populated, only these times
are offered, and only when a practitioner is actually available.';
