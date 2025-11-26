/**
 * Application Metrics
 *
 * Provides Prometheus-compatible metrics for monitoring and alerting.
 * Tracks request latencies, error rates, and business metrics.
 *
 * @see https://prometheus.io/docs/concepts/metric_types/
 */

/**
 * Metric types following Prometheus conventions
 */
type MetricType = 'counter' | 'gauge' | 'histogram';

interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

interface HistogramValue {
  sum: number;
  count: number;
  buckets: Map<number, number>;
  labels: Record<string, string>;
}

/**
 * Simple in-memory metrics store
 * In production, this would be replaced with prom-client or similar
 */
class MetricsRegistry {
  private counters: Map<string, MetricValue[]> = new Map();
  private gauges: Map<string, MetricValue> = new Map();
  private histograms: Map<string, HistogramValue[]> = new Map();
  private metadata: Map<string, { type: MetricType; help: string }> = new Map();

  /**
   * Register a metric with metadata
   */
  register(name: string, type: MetricType, help: string): void {
    this.metadata.set(name, { type, help });
  }

  /**
   * Increment a counter
   */
  incCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.getLabelKey(name, labels);
    const existing = this.counters.get(key) || [];
    const current = existing.find(m => this.labelsMatch(m.labels, labels));

    if (current) {
      current.value += value;
      current.timestamp = Date.now();
    } else {
      existing.push({ value, labels, timestamp: Date.now() });
      this.counters.set(key, existing);
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getLabelKey(name, labels);
    this.gauges.set(key, { value, labels, timestamp: Date.now() });
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ): void {
    const key = this.getLabelKey(name, labels);
    let existing = this.histograms.get(key);

    if (!existing) {
      existing = [];
      this.histograms.set(key, existing);
    }

    let histogram = existing.find(h => this.labelsMatch(h.labels, labels));

    if (!histogram) {
      histogram = {
        sum: 0,
        count: 0,
        buckets: new Map(buckets.map(b => [b, 0])),
        labels,
      };
      existing.push(histogram);
    }

    histogram.sum += value;
    histogram.count += 1;

    // Update bucket counts
    for (const bucket of buckets) {
      if (value <= bucket) {
        histogram.buckets.set(bucket, (histogram.buckets.get(bucket) || 0) + 1);
      }
    }
  }

  /**
   * Get metrics in Prometheus text format
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, values] of this.counters) {
      const name = key.split('{')[0];
      const meta = this.metadata.get(name);
      if (meta) {
        lines.push(`# HELP ${name} ${meta.help}`);
        lines.push(`# TYPE ${name} counter`);
      }
      for (const v of values) {
        lines.push(`${name}${this.formatLabels(v.labels)} ${v.value}`);
      }
    }

    // Gauges
    const gaugeNames = new Set<string>();
    for (const [key, value] of this.gauges) {
      const name = key.split('{')[0];
      if (!gaugeNames.has(name)) {
        const meta = this.metadata.get(name);
        if (meta) {
          lines.push(`# HELP ${name} ${meta.help}`);
          lines.push(`# TYPE ${name} gauge`);
        }
        gaugeNames.add(name);
      }
      lines.push(`${name}${this.formatLabels(value.labels)} ${value.value}`);
    }

    // Histograms
    for (const [key, histograms] of this.histograms) {
      const name = key.split('{')[0];
      const meta = this.metadata.get(name);
      if (meta) {
        lines.push(`# HELP ${name} ${meta.help}`);
        lines.push(`# TYPE ${name} histogram`);
      }
      for (const h of histograms) {
        const sortedBuckets = Array.from(h.buckets.entries()).sort((a, b) => a[0] - b[0]);
        let cumulative = 0;
        for (const [bucket, count] of sortedBuckets) {
          cumulative += count;
          lines.push(`${name}_bucket${this.formatLabels({ ...h.labels, le: bucket.toString() })} ${cumulative}`);
        }
        lines.push(`${name}_bucket${this.formatLabels({ ...h.labels, le: '+Inf' })} ${h.count}`);
        lines.push(`${name}_sum${this.formatLabels(h.labels)} ${h.sum}`);
        lines.push(`${name}_count${this.formatLabels(h.labels)} ${h.count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get metrics as JSON
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, values] of this.counters) {
      result[key] = values;
    }

    for (const [key, value] of this.gauges) {
      result[key] = value;
    }

    for (const [key, histograms] of this.histograms) {
      result[key] = histograms.map(h => ({
        ...h,
        buckets: Object.fromEntries(h.buckets),
      }));
    }

    return result;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private getLabelKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    return '{' + entries.map(([k, v]) => `${k}="${v}"`).join(',') + '}';
  }

  private labelsMatch(a: Record<string, string>, b: Record<string, string>): boolean {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k, i) => k === keysB[i] && a[k] === b[k]);
  }
}

// Global metrics registry
export const metrics = new MetricsRegistry();

// Register standard metrics
metrics.register('http_requests_total', 'counter', 'Total number of HTTP requests');
metrics.register('http_request_duration_seconds', 'histogram', 'HTTP request duration in seconds');
metrics.register('http_requests_in_flight', 'gauge', 'Number of HTTP requests currently being processed');
metrics.register('trpc_calls_total', 'counter', 'Total number of tRPC procedure calls');
metrics.register('trpc_call_duration_seconds', 'histogram', 'tRPC call duration in seconds');
metrics.register('trpc_errors_total', 'counter', 'Total number of tRPC errors');
metrics.register('db_queries_total', 'counter', 'Total number of database queries');
metrics.register('db_query_duration_seconds', 'histogram', 'Database query duration in seconds');
metrics.register('rate_limit_exceeded_total', 'counter', 'Total number of rate limit exceeded events');
metrics.register('active_sessions', 'gauge', 'Number of active user sessions');
metrics.register('ai_polish_requests_total', 'counter', 'Total AI feedback polish requests');
metrics.register('ai_polish_duration_seconds', 'histogram', 'AI feedback polish duration in seconds');

// Business metrics
metrics.register('users_total', 'gauge', 'Total number of users');
metrics.register('feedback_total', 'gauge', 'Total number of feedback entries');
metrics.register('absences_total', 'gauge', 'Total number of absence requests');
metrics.register('notifications_unread_total', 'gauge', 'Total number of unread notifications');

/**
 * Record an HTTP request
 */
export function recordHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationSeconds: number
): void {
  const labels = {
    method,
    path: normalizePath(path),
    status: statusCode.toString(),
  };

  metrics.incCounter('http_requests_total', labels);
  metrics.observeHistogram('http_request_duration_seconds', durationSeconds, labels);
}

/**
 * Record a tRPC call
 */
export function recordTrpcCall(
  procedure: string,
  type: 'query' | 'mutation' | 'subscription',
  success: boolean,
  durationSeconds: number
): void {
  const labels = {
    procedure,
    type,
    success: success.toString(),
  };

  metrics.incCounter('trpc_calls_total', labels);
  metrics.observeHistogram('trpc_call_duration_seconds', durationSeconds, labels);

  if (!success) {
    metrics.incCounter('trpc_errors_total', { procedure, type });
  }
}

/**
 * Record a database query
 */
export function recordDbQuery(
  operation: string,
  model: string,
  durationSeconds: number
): void {
  const labels = { operation, model };
  metrics.incCounter('db_queries_total', labels);
  metrics.observeHistogram('db_query_duration_seconds', durationSeconds, labels);
}

/**
 * Record a rate limit exceeded event
 */
export function recordRateLimitExceeded(identifier: string, preset: string): void {
  metrics.incCounter('rate_limit_exceeded_total', { preset });
}

/**
 * Update business metrics gauges
 */
export function updateBusinessMetrics(counts: {
  users?: number;
  feedback?: number;
  absences?: number;
  unreadNotifications?: number;
}): void {
  if (counts.users !== undefined) {
    metrics.setGauge('users_total', counts.users);
  }
  if (counts.feedback !== undefined) {
    metrics.setGauge('feedback_total', counts.feedback);
  }
  if (counts.absences !== undefined) {
    metrics.setGauge('absences_total', counts.absences);
  }
  if (counts.unreadNotifications !== undefined) {
    metrics.setGauge('notifications_unread_total', counts.unreadNotifications);
  }
}

/**
 * Normalize path for metrics (remove IDs)
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/[a-z0-9]{24,}/gi, '/:id') // MongoDB-style IDs
    .replace(/\/[a-z0-9-]{36}/gi, '/:id') // UUIDs
    .replace(/\/c[a-z0-9]{24}/gi, '/:id') // CUIDs
    .replace(/\/\d+/g, '/:id'); // Numeric IDs
}

/**
 * Timer utility for measuring durations
 */
export function startTimer(): () => number {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e9; // Convert nanoseconds to seconds
  };
}
