import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Create a fresh QueryClient for each test to avoid state leaking between tests
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests so failures surface immediately
        retry: false,
        // Disable stale-time so tests always fetch fresh
        staleTime: 0,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
}

function AllProviders({ children, initialEntries = ["/"] }: AllProvidersProps) {
  const queryClient = makeQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

/**
 * Custom render that wraps the component under test with all app-level providers.
 * Use this instead of RTL's `render` in every test file.
 *
 * @example
 * const { getByRole } = renderWithProviders(<MyComponent />);
 */
function renderWithProviders(
  ui: ReactElement,
  { initialEntries, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...options,
  });
}

// Re-export everything from RTL so tests only need one import
export * from "@testing-library/react";
export { renderWithProviders as render };
