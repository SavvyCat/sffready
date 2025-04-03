import { NextResponse } from "next/server";

// In-memory store for rate limiting
let ipRequestMap = new Map();

// Rate limit configuration - MODIFIED VALUES
const INITIAL_COOLDOWN = 0; // No delay between first requests
const MAX_INITIAL_REQUESTS = 4;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (was 12 hours)

export async function middleware(request) {
  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith("/api/generate-build")) {
    return NextResponse.next();
  }

  // Get the client's IP address
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // Get current timestamp
  const now = Date.now();

  // Initialize or get existing request data for this IP
  if (!ipRequestMap.has(ip)) {
    ipRequestMap.set(ip, {
      totalRequests: 0,
      lastRequestTime: now,
      isLimited: false,
      cooldownEnds: 0,
      resetTime: now + RESET_INTERVAL, // Set initial reset time 24 hours from now
    });
  }

  let requestData = ipRequestMap.get(ip);

  // Check if it's time to reset the counter (24 hours have passed)
  if (now >= requestData.resetTime) {
    requestData = {
      totalRequests: 0,
      lastRequestTime: now,
      isLimited: false,
      cooldownEnds: 0,
      resetTime: now + RESET_INTERVAL,
    };
    ipRequestMap.set(ip, requestData);
  }

  // Check if user is currently in a cooldown period
  if (requestData.isLimited && now < requestData.cooldownEnds) {
    const timeRemaining = Math.ceil((requestData.cooldownEnds - now) / 1000);

    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${timeRemaining} seconds.`,
        resetTime: new Date(requestData.resetTime).toISOString(),
        waitTime: timeRemaining,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(timeRemaining),
          "X-Rate-Limit-Reset": new Date(requestData.resetTime).toISOString(),
        },
      }
    );
  }

  // If cooldown has ended, reset the limited status
  if (requestData.isLimited && now >= requestData.cooldownEnds) {
    requestData.isLimited = false;
  }

  // Calculate cooldown period based on total requests
  const calculateCooldown = (totalRequests) => {
    if (totalRequests < MAX_INITIAL_REQUESTS) {
      return INITIAL_COOLDOWN; // No cooldown for first requests
    } else {
      // Gentler exponential increase: (requests-10) * 5 seconds
      const additionalRequests = (totalRequests + 1 - MAX_INITIAL_REQUESTS) * 4;
      return Math.min(5 * additionalRequests, 250); // Cap at 2 minutes max
    }
  };

  // Calculate time between requests
  const timeSinceLastRequest = now - requestData.lastRequestTime;
  const requiredCooldown = calculateCooldown(requestData.totalRequests) * 1000; // convert to ms

  if (timeSinceLastRequest < requiredCooldown) {
    // User is trying to request too quickly - set limited status
    requestData.isLimited = true;
    requestData.cooldownEnds = now + (requiredCooldown - timeSinceLastRequest);

    const timeRemaining = Math.ceil((requestData.cooldownEnds - now) / 1000);
    const resetTimeRemaining = Math.ceil(
      (requestData.resetTime - now) / 1000 / 60
    ); // minutes

    ipRequestMap.set(ip, requestData);

    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${timeRemaining} seconds. Rate limits will reset in ${resetTimeRemaining} minutes.`,
        resetTime: new Date(requestData.resetTime).toISOString(),
        waitTime: timeRemaining,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(timeRemaining),
          "X-Rate-Limit-Reset": new Date(requestData.resetTime).toISOString(),
        },
      }
    );
  }

  // Request is allowed - update tracking data
  requestData.totalRequests += 1;
  requestData.lastRequestTime = now;
  ipRequestMap.set(ip, requestData);

  // Add rate limit info to the response headers
  const response = NextResponse.next();
  const nextCooldown = calculateCooldown(requestData.totalRequests);
  const resetTimeRemaining = Math.ceil(
    (requestData.resetTime - now) / 1000 / 60
  ); // minutes

  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((now + nextCooldown * 1000) / 1000))
  );
  response.headers.set(
    "X-Rate-Limit-Policy",
    `Linear: ${nextCooldown}s cooldown for next request. Resets in ${resetTimeRemaining} minutes.`
  );
  response.headers.set(
    "X-Rate-Limit-Reset-Time",
    new Date(requestData.resetTime).toISOString()
  );

  // Clean up old entries every hour to prevent memory leaks
  if (now % (60 * 60 * 1000) < 1000) {
    for (const [key, value] of ipRequestMap.entries()) {
      if (now > value.resetTime) {
        ipRequestMap.delete(key);
      }
    }
  }

  return response;
}

// Configure middleware to run only for specific paths
export const config = {
  matcher: ["/api/generate-build"],
};
