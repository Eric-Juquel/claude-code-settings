import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW Node server used in Vitest (jsdom environment).
 * Started/reset/closed in src/tests/setup.ts.
 */
export const server = setupServer(...handlers);
