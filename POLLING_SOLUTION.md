# n8n Polling Solution for Long-Running Workflows

## Problem
The n8n workflow takes 2-3 minutes to complete, but was timing out due to:
- nginx/proxy 504 Gateway Timeout (typically 60-120 seconds)
- Browser/network timeouts
- Long HTTP connections being unstable

## Solution: Async Polling Pattern

### How It Works

1. **Initial Request**: Frontend sends request to `/api/n8n-proxy`
2. **Quick Response**: Proxy returns immediately with a `trackingId` and status `processing`
3. **Polling**: Frontend polls `/api/n8n-proxy/status/{trackingId}` every 5 seconds
4. **Completion**: When workflow completes, status endpoint returns the final result

### API Endpoints

#### 1. `/api/n8n-proxy` (POST)
- Starts the n8n workflow
- Returns tracking ID for polling
- Timeout: 30 seconds (for initial connection)

**Response:**
```json
{
  "success": true,
  "status": "processing",
  "trackingId": "req_1234567890_abc123",
  "message": "Workflow started successfully",
  "estimatedTime": "2-3 minutes"
}
```

#### 2. `/api/n8n-proxy/status/{trackingId}` (GET)
- Check workflow status
- Returns current state or final result

**Processing Response:**
```json
{
  "success": true,
  "trackingId": "req_1234567890_abc123",
  "status": "processing",
  "processingTime": 45000
}
```

**Completed Response:**
```json
{
  "success": true,
  "trackingId": "req_1234567890_abc123",
  "status": "completed",
  "result": {
    // Full article data
  },
  "processingTime": 180000
}
```

#### 3. `/api/n8n-proxy/callback` (POST)
- Optional: For n8n to report completion (if supported)
- Updates internal status store

### Frontend Implementation

The frontend now:
1. Makes initial request with 60-second timeout
2. If gets tracking ID, starts polling every 5 seconds
3. Updates UI with progress stages based on elapsed time
4. Continues for up to 3+ minutes (40 polling attempts)
5. Handles completion or timeout gracefully

### n8n Workflow Integration

#### Option 1: Status Store (Current)
- Uses in-memory Map to track workflow status
- Works without n8n changes
- Limited to single server instance

#### Option 2: n8n Callback (Recommended)
- Add HTTP node at end of n8n workflow:
  ```
  POST {callbackUrl}
  {
    "trackingId": "{trackingId}",
    "success": true,
    "result": {...}
  }
  ```

#### Option 3: n8n Status Endpoint
- If n8n supports workflow status queries
- Add status check endpoint to n8n

### Testing

Use the test endpoints to verify polling works:

1. **Test Workflow**: `POST /api/test-n8n`
2. **Test Status**: `GET /api/test-n8n/status/{trackingId}`

The test simulates:
- Immediate response with tracking ID
- 10 seconds of "processing" status
- Then returns mock article data

### Benefits

1. **No Timeouts**: Initial request completes quickly
2. **Real-time Updates**: UI can show progress during polling
3. **Resilient**: Handles network interruptions gracefully
4. **Scalable**: Works with load balancers and multiple servers
5. **User-Friendly**: Better UX with progress indication

### Environment Variables

```env
# Required for callback URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# n8n URLs
N8N_WEBHOOK_URL=http://localhost:5678/webhook/input-webhook-sce
```

### Error Handling

- Initial connection failures: Immediate error response
- Polling failures: Retry with exponential backoff
- Workflow failures: Error status with details
- Timeouts: Graceful degradation with helpful messages

This solution eliminates the 504 Gateway Timeout issues while providing a better user experience for long-running content generation workflows.
