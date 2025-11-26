# Alerting Configuration

This document describes the alerting rules for monitoring the Employee Profile Management System.

## Alert Channels

Configure alerts to be sent to one or more channels:

### Slack Integration

```yaml
# alertmanager.yml
receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
```

### Email Integration

```yaml
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'team@yourcompany.com'
        from: 'alerts@yourcompany.com'
        smarthost: 'smtp.yourprovider.com:587'
        auth_username: 'alerts@yourcompany.com'
        auth_password: '<password>'
```

### PagerDuty Integration

```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        severity: 'critical'
```

---

## Prometheus Alert Rules

Create file `prometheus/alert-rules.yml`:

```yaml
groups:
  # ==========================================================================
  # Application Health Alerts
  # ==========================================================================
  - name: application-health
    rules:
      # Application is down
      - alert: ApplicationDown
        expr: up{job="epms"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
          description: "The EPMS application has been down for more than 1 minute."

      # Health check failing
      - alert: HealthCheckFailing
        expr: probe_success{job="epms-health"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Health check failing"
          description: "The /api/health endpoint has been failing for 2 minutes."

  # ==========================================================================
  # Error Rate Alerts
  # ==========================================================================
  - name: error-rates
    rules:
      # High error rate (>5% of requests)
      - alert: HighErrorRate
        expr: |
          sum(rate(trpc_errors_total[5m]))
          / sum(rate(trpc_calls_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for the last 5 minutes."

      # Critical error rate (>10% of requests)
      - alert: CriticalErrorRate
        expr: |
          sum(rate(trpc_errors_total[5m]))
          / sum(rate(trpc_calls_total[5m])) > 0.10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical error rate"
          description: "Error rate is above 10% - immediate attention required."

      # Specific procedure errors
      - alert: AuthenticationErrors
        expr: rate(trpc_errors_total{procedure=~"auth.*"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Authentication errors elevated"
          description: "Authentication procedure errors are elevated."

  # ==========================================================================
  # Performance Alerts
  # ==========================================================================
  - name: performance
    rules:
      # Slow API responses (p99 > 2s)
      - alert: SlowApiResponses
        expr: |
          histogram_quantile(0.99,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API responses"
          description: "99th percentile response time is above 2 seconds."

      # Very slow API responses (p99 > 5s)
      - alert: VerySlowApiResponses
        expr: |
          histogram_quantile(0.99,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Very slow API responses"
          description: "99th percentile response time is above 5 seconds."

      # Slow database queries
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.99,
            rate(db_query_duration_seconds_bucket[5m])
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries"
          description: "Database query p99 latency is above 1 second."

  # ==========================================================================
  # Rate Limiting Alerts
  # ==========================================================================
  - name: rate-limiting
    rules:
      # High rate limit hits
      - alert: HighRateLimitHits
        expr: rate(rate_limit_exceeded_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit violations"
          description: "More than 10 rate limit violations per minute."

      # Possible attack (very high rate limit hits)
      - alert: PossibleBruteForceAttack
        expr: rate(rate_limit_exceeded_total{preset="auth"}[5m]) > 50
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Possible brute force attack"
          description: "Very high auth rate limit violations - possible attack."

  # ==========================================================================
  # Resource Alerts
  # ==========================================================================
  - name: resources
    rules:
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          process_resident_memory_bytes / 1024 / 1024 > 500
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Application is using more than 500MB of memory."

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Database connections are near the limit."

  # ==========================================================================
  # Business Alerts
  # ==========================================================================
  - name: business
    rules:
      # No logins for extended period (during business hours)
      - alert: NoUserActivity
        expr: |
          increase(trpc_calls_total{procedure="auth.login"}[1h]) == 0
          and hour() >= 9 and hour() <= 17
          and day_of_week() >= 1 and day_of_week() <= 5
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "No user activity"
          description: "No login activity during business hours for 2 hours."

      # Unusual spike in feedback creation
      - alert: UnusualFeedbackSpike
        expr: |
          rate(trpc_calls_total{procedure="feedback.create"}[10m])
          > 3 * avg_over_time(rate(trpc_calls_total{procedure="feedback.create"}[10m])[24h:10m])
        for: 15m
        labels:
          severity: info
        annotations:
          summary: "Unusual feedback activity"
          description: "Feedback creation rate is 3x higher than usual."
```

---

## Alertmanager Configuration

Create file `alertmanager/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'default'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    # Critical alerts go to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true

    # All alerts go to Slack
    - match_re:
        severity: critical|warning
      receiver: 'slack-notifications'

    # Info alerts only go to email
    - match:
        severity: info
      receiver: 'email-notifications'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true

  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
        title: '{{ if eq .Status "firing" }}🔥{{ else }}✅{{ end }} {{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
        actions:
          - type: button
            text: 'View Runbook'
            url: 'https://wiki.yourcompany.com/runbooks/{{ .CommonLabels.alertname }}'
          - type: button
            text: 'Silence'
            url: '{{ template "__alertmanagerURL" . }}/#/silences/new?filter=%7B{{ range .CommonLabels.SortedPairs }}{{ .Name }}%3D%22{{ .Value }}%22%2C{{ end }}%7D'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'
        severity: 'critical'
        description: '{{ .CommonAnnotations.summary }}'
        details:
          description: '{{ .CommonAnnotations.description }}'
          alertname: '{{ .CommonLabels.alertname }}'

  - name: 'email-notifications'
    email_configs:
      - to: 'team@yourcompany.com'
        send_resolved: true
        headers:
          Subject: '[{{ .Status | toUpper }}] {{ .CommonAnnotations.summary }}'

inhibit_rules:
  # Don't send warning if critical is already firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

---

## GitHub Actions Alerts

For deployments via GitHub Actions, add notifications:

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    # ... deployment steps ...

  notify-success:
    needs: deploy
    if: success()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack on Success
        uses: slackapi/slack-github-action@v1.24.0
        with:
          channel-id: 'C0XXXXXXXXX'
          payload: |
            {
              "text": "✅ Deployment successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Deployment Successful*\n*Branch:* ${{ github.ref_name }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

  notify-failure:
    needs: deploy
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack on Failure
        uses: slackapi/slack-github-action@v1.24.0
        with:
          channel-id: 'C0XXXXXXXXX'
          payload: |
            {
              "text": "❌ Deployment failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Deployment Failed*\n*Branch:* ${{ github.ref_name }}\n*Commit:* ${{ github.sha }}\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Logs>"
                  }
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

---

## Sentry Alerts

Configure alerts in Sentry dashboard:

1. **Issue Alerts** (per-error):
   - Alert when error occurs 10+ times in 1 hour
   - Alert on new issues in production
   - Alert on regressions

2. **Metric Alerts** (aggregated):
   - Alert when error rate > 5%
   - Alert when p95 latency > 2s
   - Alert when crash-free rate < 99%

### Sentry Alert via API

```typescript
// This is configured in Sentry dashboard, but here's the webhook format:
{
  "action": "triggered",
  "data": {
    "event": {
      "title": "Error: Something went wrong",
      "culprit": "app/api/trpc/[trpc]/route.ts",
      "url": "https://sentry.io/...",
    }
  }
}
```

---

## Quick Setup Checklist

- [ ] Set up Slack webhook URL
- [ ] Configure Prometheus with alert rules
- [ ] Deploy Alertmanager
- [ ] Add GitHub Secrets for Slack notifications
- [ ] Configure Sentry issue/metric alerts
- [ ] Test alerts with synthetic failures
- [ ] Document on-call rotation
- [ ] Create runbooks for each alert type

---

## Alert Response Runbooks

### ApplicationDown
1. Check deployment status in GitHub Actions
2. SSH to server / check container logs
3. Verify database connectivity
4. Check for resource exhaustion
5. Rollback if recent deployment

### HighErrorRate
1. Check error logs in Sentry
2. Identify error pattern
3. Check recent deployments
4. Verify external service status
5. Consider rollback if caused by deployment

### SlowApiResponses
1. Check database query performance
2. Check for N+1 queries
3. Verify caching is working
4. Check external API latencies
5. Scale up if resource constrained

### PossibleBruteForceAttack
1. Review login attempts in audit log
2. Check rate limiting is working
3. Consider IP blocking
4. Notify security team
5. Enable additional monitoring
