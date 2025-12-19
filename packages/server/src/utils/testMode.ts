export const isTestMode = process.env.APP_MODE === 'TEST';

// In-memory offset for time travel (only active in TEST mode)
// Using hours for finer granularity (12h for reminder testing)
let hourOffset = 0;

export const getToday = (): Date => {
    const now = new Date();
    if (isTestMode && hourOffset !== 0) {
        now.setTime(now.getTime() + hourOffset * 60 * 60 * 1000);
    }
    return now;
};

export const advanceDay = (days: number = 1) => {
    if (!isTestMode) return;
    hourOffset += days * 24;
};

export const advanceHours = (hours: number = 1) => {
    if (!isTestMode) return;
    hourOffset += hours;
};

export const resetDate = () => {
    if (!isTestMode) return;
    hourOffset = 0;
};

export const getOffset = () => hourOffset / 24; // Return as days for display
