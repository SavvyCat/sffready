import { NextResponse } from "next/server";

// In-memory store for rate limiting
// Note: This will reset on server restarts or when Vercel's serverless functions cold start
let ipRequestMap = new Map();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 * 3; // 3 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 2; // Maximum 3 requests per minute

export async function middleware(request) {
  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith("/api/generate-build")) {
    return NextResponse.next();
  }

  // Get the client's IP address
  // Vercel automatically sets x-forwarded-for
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // Get current timestamp
  const now = Date.now();

  // Initialize or get existing request data for this IP
  if (!ipRequestMap.has(ip)) {
    ipRequestMap.set(ip, {
      count: 0,
      windowStart: now,
    });
  }

  let requestData = ipRequestMap.get(ip);

  // Reset the window if it has expired
  if (now - requestData.windowStart > RATE_LIMIT_WINDOW) {
    requestData = {
      count: 0,
      windowStart: now,
    };
    ipRequestMap.set(ip, requestData);
  }

  // Increment request count
  requestData.count++;
  ipRequestMap.set(ip, requestData);

  // If rate limit exceeded, return 429 Too Many Requests
  if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
    const timeRemaining = Math.ceil(
      (requestData.windowStart + RATE_LIMIT_WINDOW - now) / 1000
    );

    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${timeRemaining} seconds.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(
            Math.ceil((requestData.windowStart + RATE_LIMIT_WINDOW) / 1000)
          ),
          "Retry-After": String(timeRemaining),
        },
      }
    );
  }

  // Add rate limit headers to the response
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS_PER_WINDOW));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(MAX_REQUESTS_PER_WINDOW - requestData.count)
  );
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((requestData.windowStart + RATE_LIMIT_WINDOW) / 1000))
  );

  return response;
}

// Configure middleware to run only for specific paths
export const config = {
  matcher: ["/api/generate-build"],
};
