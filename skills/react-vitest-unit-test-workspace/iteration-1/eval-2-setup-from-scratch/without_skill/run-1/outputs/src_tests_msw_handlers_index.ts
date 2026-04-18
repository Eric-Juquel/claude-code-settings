import { http, HttpResponse } from "msw";

/**
 * Default MSW request handlers shared across the test suite.
 * Add feature-specific handlers here or override them inside individual tests
 * with `server.use(...)` for one-off scenarios.
 *
 * @example
 * // Override in a single test
 * server.use(
 *   http.get("/api/users", () => HttpResponse.json({ error: "Forbidden" }, { status: 403 }))
 * );
 */
export const handlers = [
  // Example: mock a health-check endpoint
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),
];
