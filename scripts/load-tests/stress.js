import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TENANT_ID = __ENV.TENANT_ID || "birthhub-alpha";
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || "owner@birthub.local";
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || "password123";
const TASK_URL = __ENV.WEBHOOK_URL || `${BASE_URL}/api/v1/tasks`;
const READINESS_URL = __ENV.READINESS_URL || `${BASE_URL}/api/v1/health/readiness`;
const DEEP_HEALTH_URL = __ENV.DEEP_HEALTH_URL || `${BASE_URL}/api/v1/health/deep`;
const EXPECT_READINESS_DEGRADED = __ENV.EXPECT_READINESS_DEGRADED === "true";
const EXPECT_DEEP_HEALTH_DEGRADED = __ENV.EXPECT_DEEP_HEALTH_DEGRADED === "true";

export const options = {
  scenarios: {
    auth_spike: {
      exec: "authSpike",
      executor: "ramping-arrival-rate",
      maxVUs: 120,
      preAllocatedVUs: 40,
      stages: [
        { duration: "2m", target: 10 },
        { duration: "3m", target: 40 },
        { duration: "2m", target: 80 },
        { duration: "1m", target: 0 }
      ],
      timeUnit: "1s"
    },
    task_flood: {
      duration: "8m",
      exec: "taskFlood",
      executor: "constant-arrival-rate",
      maxVUs: 240,
      preAllocatedVUs: 80,
      rate: 45,
      startTime: "30s",
      timeUnit: "1s"
    },
    readiness_probe: {
      duration: "8m",
      exec: "readinessProbe",
      executor: "constant-vus",
      vus: 8
    },
    deep_health_probe: {
      duration: "8m",
      exec: "deepHealthProbe",
      executor: "constant-vus",
      vus: 4
    }
  },
  thresholds: {
    "http_req_duration{scenario:auth_spike}": ["p(95)<900", "p(99)<1500"],
    "http_req_duration{scenario:task_flood}": ["p(95)<1500", "p(99)<2500"],
    "http_req_duration{scenario:readiness_probe}": ["p(99)<1000"],
    "http_req_duration{scenario:deep_health_probe}": ["p(99)<2500"],
    "http_req_failed{scenario:auth_spike}": ["rate<0.05"],
    "http_req_failed{scenario:task_flood}": ["rate<0.10"]
  }
};

function buildCookieHeader(loginResponse) {
  const csrfCookie = loginResponse.cookies?.bh360_csrf?.[0]?.value;

  if (!csrfCookie) {
    return "";
  }

  return `bh360_csrf=${csrfCookie}`;
}

function login(tags) {
  const loginPayload = JSON.stringify({
    email: LOGIN_EMAIL,
    password: LOGIN_PASSWORD,
    tenantId: TENANT_ID
  });
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { "Content-Type": "application/json" },
    tags
  });

  check(loginResponse, {
    "login returns 200": (response) => response.status === 200
  });

  return {
    cookieHeader: buildCookieHeader(loginResponse),
    csrfToken: loginResponse.json("session.csrfToken"),
    loginResponse,
    sessionToken: loginResponse.json("session.token")
  };
}

function buildTaskHeaders(authState) {
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": TENANT_ID
  };

  if (authState.cookieHeader) {
    headers.Cookie = authState.cookieHeader;
  }

  if (authState.csrfToken) {
    headers["x-csrf-token"] = authState.csrfToken;
  }

  if (authState.sessionToken) {
    headers.Authorization = `Bearer ${authState.sessionToken}`;
  }

  return headers;
}

function checkOperationalProbe(response, degradedExpected) {
  return degradedExpected
    ? response.status === 200 || response.status === 503
    : response.status === 200;
}

export function authSpike() {
  login({ endpoint: "auth_login" });
  sleep(1);
}

export function taskFlood() {
  const authState = login({ endpoint: "auth_login_for_tasks" });
  const webhookPayload = JSON.stringify({
    agentId: "ceo-pack",
    approvalRequired: false,
    estimatedCostBRL: 0.5,
    executionMode: "LIVE",
    payload: {
      scenario: "task_flood",
      tenantId: TENANT_ID,
      timestamp: Date.now()
    },
    type: "sync-session"
  });
  const webhookResponse = http.post(TASK_URL, webhookPayload, {
    headers: buildTaskHeaders(authState),
    tags: { endpoint: "task_flood" }
  });

  check(webhookResponse, {
    "task accepted, throttled or backpressured": (response) =>
      response.status === 200 ||
      response.status === 202 ||
      response.status === 429 ||
      response.status === 503
  });

  sleep(1);
}

export function readinessProbe() {
  const response = http.get(READINESS_URL, {
    tags: { endpoint: "readiness_probe" }
  });

  check(response, {
    "readiness matches expected state": (currentResponse) =>
      checkOperationalProbe(currentResponse, EXPECT_READINESS_DEGRADED)
  });

  sleep(1);
}

export function deepHealthProbe() {
  const response = http.get(DEEP_HEALTH_URL, {
    tags: { endpoint: "deep_health_probe" }
  });

  check(response, {
    "deep health matches expected state": (currentResponse) =>
      checkOperationalProbe(currentResponse, EXPECT_DEEP_HEALTH_DEGRADED)
  });

  sleep(1);
}

function formatNumber(value, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : "n/a";
}

function readMetricValue(data, metricName, valueName) {
  return data.metrics?.[metricName]?.values?.[valueName];
}

function readThresholdStatus(data, metricName, thresholdName) {
  return data.metrics?.[metricName]?.thresholds?.[thresholdName]?.ok === true ? "PASS" : "FAIL";
}

export function handleSummary(data) {
  const summaryLines = [
    "# BirthHub360 K6 Resilience Summary",
    `generatedAt: ${new Date().toISOString()}`,
    `baseUrl: ${BASE_URL}`,
    `tenantId: ${TENANT_ID}`,
    `taskUrl: ${TASK_URL}`,
    `readinessUrl: ${READINESS_URL}`,
    `deepHealthUrl: ${DEEP_HEALTH_URL}`,
    `expectReadinessDegraded: ${EXPECT_READINESS_DEGRADED}`,
    `expectDeepHealthDegraded: ${EXPECT_DEEP_HEALTH_DEGRADED}`,
    `http_reqs.rate: ${formatNumber(readMetricValue(data, "http_reqs", "rate"))} req/s`,
    `iterations.rate: ${formatNumber(readMetricValue(data, "iterations", "rate"))} it/s`,
    `http_req_duration.p(95): ${formatNumber(readMetricValue(data, "http_req_duration", "p(95)"))} ms`,
    `http_req_duration.p(99): ${formatNumber(readMetricValue(data, "http_req_duration", "p(99)"))} ms`,
    `http_req_failed.rate: ${formatNumber(readMetricValue(data, "http_req_failed", "rate"), 4)}`,
    `threshold.auth_spike.p(95)<900: ${readThresholdStatus(data, "http_req_duration{scenario:auth_spike}", "p(95)<900")}`,
    `threshold.task_flood.p(95)<1500: ${readThresholdStatus(data, "http_req_duration{scenario:task_flood}", "p(95)<1500")}`
  ];
  const textSummary = `${summaryLines.join("\n")}\n`;

  return {
    "artifacts/performance/k6/resilience-summary.json": JSON.stringify(data, null, 2),
    "artifacts/performance/k6/resilience-summary.txt": textSummary,
    stdout: textSummary
  };
}
