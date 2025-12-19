export const isTestMode = process.env.APP_MODE === 'TEST';

// In-memory offset for time travel (only active in TEST mode)
let dayOffset = 0;

export const getToday = (): Date => {
    const now = new Date();
    if (isTestMode && dayOffset !== 0) {
        now.setDate(now.getDate() + dayOffset);
    }
    return now;
};

export const advanceDay = (days: number = 1) => {
    if (!isTestMode) return;
    dayOffset += days;
};

export const resetDate = () => {
    if (!isTestMode) return;
    dayOffset = 0;
};

export const getOffset = () => dayOffset;
