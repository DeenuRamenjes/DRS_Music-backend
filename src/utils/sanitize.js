// Sanitize optional string values
export const sanitizeOptionalString = (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};
