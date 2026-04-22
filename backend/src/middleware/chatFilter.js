/**
 * Anti-Leakage Chat Filter Middleware
 * Blocks phone numbers, social media handles, and payment app references
 * from being shared in chat messages.
 * 
 * SRS Section 6.1 — CRITICAL for revenue protection
 */

const prisma = require('../config/prisma');

// ─── Blocked keyword list (case-insensitive) ───
const BLOCKED_KEYWORDS = [
  'whatsapp', 'watsapp', 'watsap', 'whatsap', 'wp', 'whtsap',
  'instagram', 'insta', 'ig', 'handle',
  'telegram', 'tg', 'signal', 'discord', 'dc',
  'snapchat', 'snap', 'sc',
  'gpay', 'google pay', 'paytm', 'phonepe', 'phone pe',
  'upi', 'bhim', 'payment', 'pay direct', 'offline',
  'my number', 'mera number', 'mera no', 'my no', 'dial',
  'call me on', 'msg me on', 'message me on', 'connect',
  'personal number', 'personal no', 'mobile',
  'facebook', 'fb', 'twitter', 'zoom', 'google meet', 'skype',
];

// ─── Regex patterns for phone number detection ───
const PHONE_PATTERNS = [
  /\b\d{10}\b/g,                          // Plain 10 digits
  /\b\d{5}[\s\-]?\d{5}\b/g,              // 5+5 with space/dash
  /\b(\d[\s]*){10,}\b/g,                  // 10+ digits with spaces
  /\+91[\s\-]?\d{10}\b/g,                // +91 prefix
  /\b\d{3}[\s\-]\d{3}[\s\-]\d{4}\b/g,    // 3-3-4 pattern
  /\b\d{4}[\s\-]\d{3}[\s\-]\d{3}\b/g,    // 4-3-3 pattern
];

// ─── UPI ID pattern ───
const UPI_PATTERN = /[a-zA-Z0-9_.+-]+@[a-zA-Z]{2,}/g;

/**
 * Filter a message and return sanitized version
 * @param {string} rawText - Original message text
 * @returns {{ sanitized: string, isFiltered: boolean, matchedPatterns: string[] }}
 */
function filterMessage(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { sanitized: rawText, isFiltered: false, matchedPatterns: [] };
  }

  let sanitized = rawText;
  let isFiltered = false;
  const matchedPatterns = [];

  // 1. Check blocked keywords
  const lowerText = sanitized.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      // Replace the keyword with [Blocked]
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      sanitized = sanitized.replace(regex, '[Blocked]');
      isFiltered = true;
      matchedPatterns.push(`keyword:${keyword}`);
    }
  }

  // 2. Check phone number patterns
  for (const pattern of PHONE_PATTERNS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, '[Number Blocked]');
      isFiltered = true;
      matchedPatterns.push('phone_number');
    }
  }

  // 3. Check UPI IDs
  if (UPI_PATTERN.test(sanitized)) {
    UPI_PATTERN.lastIndex = 0;
    sanitized = sanitized.replace(UPI_PATTERN, '[UPI Blocked]');
    isFiltered = true;
    matchedPatterns.push('upi_id');
  }

  return { sanitized, isFiltered, matchedPatterns };
}

/**
 * Log a Red Alert to the database when filter triggers
 * @param {object} params
 */
async function logRedAlert({ userId, sessionId, originalContent, matchedPatterns }) {
  try {
    await prisma.adminAlert.create({
      data: {
        type: 'CONTACT_SHARING',
        userId,
        sessionId,
        blockedContent: originalContent.substring(0, 500),
        matchedPatterns,
        isResolved: false,
      }
    });

    // Also emit to admin via socket if available
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('admin_red_alert', {
        type: 'CONTACT_SHARING',
        userId,
        sessionId,
        matchedPatterns,
        timestamp: new Date(),
      });
    } catch (socketErr) {
      // Socket may not be ready during tests
    }
  } catch (err) {
    console.error('❌ [RED_ALERT] Failed to log:', err.message);
  }
}

module.exports = { filterMessage, logRedAlert, BLOCKED_KEYWORDS };
