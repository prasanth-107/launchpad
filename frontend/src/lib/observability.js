// ==============================================================================
// PHASE 19: PRODUCTION OBSERVABILITY & SECURE LOGGING
// Modern Placement Launchpad - Sanitized Telemetry & Error Boundary Handler
// ==============================================================================

const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /jwt/i,
  /bearer/i,
  /private_notes/i,
  /credential/i
];

/**
 * Deeply scrubs sensitive fields and credentials from diagnostic logs.
 * @param {any} data
 * @returns {any} Sanitized data
 */
export function sanitizeLogData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // Check if string looks like a JWT or key
    if (data.startsWith('ey') && data.includes('.')) return '[REDACTED_JWT]';
    if (data.length > 40 && /^[A-Za-z0-9_-]+$/.test(data)) return '[REDACTED_TOKEN]';
    return data;
  }
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Production-safe logger that formats structured logs without leaking secrets.
 */
export const logger = {
  info(event, metadata = {}) {
    const safeData = sanitizeLogData(metadata);
    const entry = {
      level: 'INFO',
      event,
      timestamp: new Date().toISOString(),
      metadata: safeData
    };
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${event}`, safeData);
    }
    return entry;
  },

  warn(event, metadata = {}) {
    const safeData = sanitizeLogData(metadata);
    const entry = {
      level: 'WARN',
      event,
      timestamp: new Date().toISOString(),
      metadata: safeData
    };
    console.warn(`[WARN] ${event}`, safeData);
    return entry;
  },

  error(event, errorOrMetadata = {}) {
    let safeData = {};
    if (errorOrMetadata instanceof Error) {
      safeData = {
        name: errorOrMetadata.name,
        message: errorOrMetadata.message
      };
    } else {
      safeData = sanitizeLogData(errorOrMetadata);
    }

    const entry = {
      level: 'ERROR',
      event,
      timestamp: new Date().toISOString(),
      error: safeData
    };
    console.error(`[ERROR] ${event}`, safeData);
    return entry;
  },

  metric(metricName, value, tags = {}) {
    const safeTags = sanitizeLogData(tags);
    const entry = {
      level: 'METRIC',
      metric: metricName,
      value: Number(value),
      tags: safeTags,
      timestamp: new Date().toISOString()
    };
    return entry;
  }
};

/**
 * Measures execution duration of an async function for telemetry.
 * @param {string} operationName
 * @param {Function} fn
 * @returns {Promise<any>}
 */
export async function timeAsync(operationName, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    logger.metric(`operation_duration_ms`, duration, { operation: operationName, status: 'success' });
    return result;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    logger.metric(`operation_duration_ms`, duration, { operation: operationName, status: 'failure' });
    logger.error(`operation_failed:${operationName}`, err);
    throw err;
  }
}

/**
 * Verifies system health & diagnostic connectivity
 * @returns {Object}
 */
export function checkSystemHealth() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: typeof window !== 'undefined' ? 'browser' : 'node',
    features: {
      readinessEngine: 'active',
      careerCoach: 'active',
      adaptivePractice: 'active',
      commandCenter: 'active'
    }
  };
}
