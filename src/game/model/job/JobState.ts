export const JOB_STATE = {
    incomplete: 1,
    complete: 2,
    canceled: 3,
} as const
export type JobState = typeof JOB_STATE[keyof typeof JOB_STATE]
