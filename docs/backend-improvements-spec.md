# Backend Improvement Spec for Frontend Scalability

## Goal
Provide backend endpoints and response contracts that reduce frontend polling cost, avoid full-table client scans, and simplify manual code review.

## 1) Pattern Hit Count Aggregate Endpoint

### Problem
The frontend currently paginates through all patterns to compute total hit count sums (optionally excluding noise), which does unnecessary network and client work.

### New Endpoint
`GET /api/patterns/stats/hit-count-sum`

### Query Params
- `include_noise` (boolean, optional, default `false`)

### Response
```json
{
  "status": "ok",
  "include_noise": true,
  "pattern_count": 803,
  "hit_count_sum": 1525531,
  "computed_at": "2026-06-28T16:01:00Z"
}
```

### Notes
- Uses effective classification where available.
- If `include_noise=false`, exclude `noise` class from the aggregate.
- Response should be fast enough for periodic dashboard/settings refresh.

## 2) Pattern Summary Endpoint for Side List

### Problem
Main layout and logs screen frequently fetch all patterns for labels/classification mapping.

### New Endpoint
`GET /api/patterns/summary`

### Query Params
- `limit` (optional)
- `offset` (optional)
- `classification` (optional)

### Response
```json
{
  "items": [
    {
      "id": 42,
      "title": "Health Check - Drop at Listener",
      "pattern_text": "health_check <IP> status ok",
      "classification": "noise",
      "effective_classification": "noise",
      "hit_count": 858057,
      "filter_at_listener": true,
      "first_seen_at": "2026-06-01T00:00:00Z",
      "last_seen_at": "2026-06-28T16:00:00Z"
    }
  ],
  "limit": 200,
  "offset": 0,
  "total": 803
}
```

### Notes
- Should omit heavy fields not needed for list rendering (`ai_explanation`, etc.).
- Intended for high-frequency UI refresh with lower payload size.

## 3) Consistent Pagination Contract Across Logs Endpoints

### Problem
Some frontend code defensively checks array vs paginated responses.

### Recommendation
Standardize list endpoints to always return:
```json
{
  "items": [...],
  "limit": 100,
  "offset": 0,
  "total": 12345
}
```

### Affected Endpoints
- `GET /api/logs`
- `GET /api/logs/recent` (option A: keep array and document; option B: migrate to paginated response)
- `GET /api/alerts`
- `GET /api/patterns`

## 4) Listener Filter Observability

### Problem
When `filter_at_listener=true`, dropped logs are not visible in DB and operators have limited confirmation.

### New Endpoint
`GET /api/listener/filter-stats`

### Response
```json
{
  "status": "ok",
  "refresh_interval_seconds": 60,
  "last_refresh_at": "2026-06-28T16:00:00Z",
  "active_filter_patterns": 14,
  "dropped_logs_last_minute": 12450,
  "dropped_logs_last_15m": 176430,
  "top_filter_pattern_ids": [42, 2318, 2350]
}
```

### Notes
- This is optional but strongly improves trust in filter-at-listener operations.

## 5) Error Contract Consistency

### Recommendation
Use consistent error envelope:
```json
{
  "error": {
    "code": "PATTERN_NOT_FOUND",
    "message": "Pattern not found"
  }
}
```

### Benefits
- Predictable user messaging in frontend
- Easier central error handling/interceptors

## Migration Plan
1. Add new aggregate endpoint (`hit-count-sum`) first.
2. Add `patterns/summary` endpoint.
3. Align list endpoint contracts and document any legacy exceptions.
4. Add optional filter observability endpoint.

## Success Criteria
- Settings health no longer fetches full pattern list just to compute hit count sum.
- Pattern side list payload size reduced.
- Frontend removes array-vs-paginated fallbacks.
- Operators can verify listener filter activity without DB artifacts.
