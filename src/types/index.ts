export type ViewId = 'dashboard' | 'gate' | 'dsa' | 'habits' | 'career';

// --- View 1: Command Center ---
export type PhaseId = 'phase1' | 'phase2';
export type DayTypeId = 'weekday' | 'weekend_gf' | 'weekend_grind';
export type ScheduleKey = 'phase1_weekday' | 'phase2_weekday' | 'weekend_gf' | 'weekend_grind';

export type BlockCategory = 'health' | 'gate' | 'dsa' | 'work' | 'commute' | 'personal' | 'project' | 'sleep';

export interface TimeBlock {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM" (equal to startTime for cutoff milestone like 00:00)
  title: string;
  subtitle: string;
  category: BlockCategory;
}

export type ScheduleMap = Record<ScheduleKey, TimeBlock[]>;

export interface NonNegotiableItem {
  id: string;
  label: string;
}

export interface DailyHistoryEntry {
  date: string; // YYYY-MM-DD
  completionPct: number; // 0-100
  blocksCompleted: number;
  blocksTotal: number;
  nonNegotiablesHit: number;
  nonNegotiablesTotal: number;
}

export interface TodayState {
  date: string; // YYYY-MM-DD
  phase: PhaseId;
  dayType: DayTypeId;
  completedBlockIds: string[];
  completedNonNegotiableIds: string[];
}

// --- View 2: GATE CSE 2027 Tracker ---
export type GateTier = 1 | 2 | 3;
export type SubjectStatus = 'Not Started' | 'In Progress' | 'PYQs Done' | 'Revised';

export interface GateSubtopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface GateSubject {
  id: string;
  name: string;
  tier: GateTier;
  weightageMarks: number;
  targetWindow: string;
  status: SubjectStatus;
  revisionPct: number; // 0-100
  pyqsSolved: number;
  subtopics: GateSubtopic[];
}

export type MockTestType = 'Subject' | 'Full Mock';
export type MockShift = '9:30 AM' | '2:30 PM';

export interface MockTestEntry {
  id: string;
  date: string; // YYYY-MM-DD
  testName: string;
  type: MockTestType;
  rawMarks: number; // out of 100
  accuracy: number; // 0-100
  negativeMarksLost: number;
  shift: MockShift;
}

export type MistakeTag = 'Formula Gap' | 'Silly Error' | 'MSQ Edge Case' | 'Concept Gap';

export interface MistakeEntry {
  id: string;
  createdAt: string; // YYYY-MM-DD
  subject: string;
  topic: string;
  tag: MistakeTag;
  whatWentWrong: string;
  ruleToRemember: string;
}

// --- View 3: C++ DSA & AlgoHunt Tracker ---
export interface DsaWeek {
  id: string;
  weekNumber: number;
  dateRange: string;
  title: string;
  targetCount: number;
}

export interface CTracingGapItem {
  id: string;
  label: string;
  detail: string;
  checked: boolean;
}

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';
export type SolvedMode = 'Yes' | 'With Hint';

export interface DsaProblem {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  url: string;
  weekId: string;
  difficulty: ProblemDifficulty;
  timeTakenMins: number;
  solvedSolo: SolvedMode;
  stlUsed: string[];
  patternTrigger: string;
  reattemptResolved?: boolean;
}

// --- View 4: Morning Run & Sleep Shift ---
export interface SleepLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:MM (24h)
  wakeTime: string; // HH:MM (24h)
  notes: string;
}

export interface RunLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  protocol: string;
  effort: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface RunChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

// --- View 5: Job Hunt & Weekend Projects ---
export type JobStatus = 'Applied' | 'OA' | 'Interview' | 'Offer' | 'Rejected';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  link: string;
  dateApplied: string; // YYYY-MM-DD
  status: JobStatus;
  notes: string;
}

export interface ProjectDeliverable {
  id: string;
  title: string;
  completed: boolean;
}

export interface WeekendProject {
  id: string;
  name: string;
  repoUrl: string;
  stack: string;
  targetWeekend: string;
  deliverables: ProjectDeliverable[];
}

// --- Complete Persisted Backup Payload ---
export interface WarRoomBackup {
  schemaVersion: number;
  exportedAt: string;
  data: {
    schedules: ScheduleMap;
    todayState: TodayState;
    dailyHistory: Record<string, DailyHistoryEntry>;
    gateSubjects: GateSubject[];
    mockTests: MockTestEntry[];
    mistakes: MistakeEntry[];
    cTracingChecklist: CTracingGapItem[];
    dsaProblems: DsaProblem[];
    sleepLogs: SleepLogEntry[];
    runLogs: RunLogEntry[];
    runChecklist: RunChecklistItem[];
    jobApplications: JobApplication[];
    weekendProjects: WeekendProject[];
  };
}
