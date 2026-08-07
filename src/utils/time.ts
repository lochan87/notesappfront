/**
 * Returns a human-friendly relative time string.
 * e.g. "just now", "5 minutes ago", "3 hours ago", "2 days ago"
 */
export const timeAgo = (dateString: string): string => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);
  const diffWk  = Math.floor(diffDay / 7);
  const diffMo  = Math.floor(diffDay / 30);
  const diffYr  = Math.floor(diffDay / 365);

  if (diffSec < 60)   return 'just now';
  if (diffMin < 60)   return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr  < 24)   return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay < 7)    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffWk  < 5)    return `${diffWk} week${diffWk !== 1 ? 's' : ''} ago`;
  if (diffMo  < 12)   return `${diffMo} month${diffMo !== 1 ? 's' : ''} ago`;
  return `${diffYr} year${diffYr !== 1 ? 's' : ''} ago`;
};

/**
 * Formats a date as "Aug 7, 2026" for tooltips / titles.
 */
export const formatShortDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
