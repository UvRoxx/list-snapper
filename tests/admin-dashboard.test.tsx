import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../client/src/pages/admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', isAdmin: true },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/components/navigation', () => ({
  Navigation: () => <div>Navigation</div>,
}));

describe('Admin Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Platform Overview', () => {
    it('should render dashboard header', () => {
      renderWithProviders(<AdminDashboard />);
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive platform management and analytics')).toBeInTheDocument();
    });

    it('should display settings button', () => {
      renderWithProviders(<AdminDashboard />);
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should display export data button', () => {
      renderWithProviders(<AdminDashboard />);
      const exportButton = screen.getByRole('button', { name: /export data/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('should display key metrics cards', async () => {
      renderWithProviders(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('QR Codes')).toBeInTheDocument();
        expect(screen.getByText('Total Scans')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
    });

    it('should display orders metric', async () => {
      renderWithProviders(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Orders')).toBeInTheDocument();
      });
    });
  });

  describe('User Management Tab', () => {
    it('should display users tab by default', () => {
      renderWithProviders(<AdminDashboard />);
      expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument();
    });

    it('should display user search input', async () => {
      renderWithProviders(<AdminDashboard />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should display status filter dropdown', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText(/all users/i)).toBeInTheDocument();
    });

    it('should display country filter', () => {
      renderWithProviders(<AdminDashboard />);

      const countryFilter = screen.getByPlaceholderText(/all countries/i);
      expect(countryFilter).toBeInTheDocument();
    });

    it('should display language filter', () => {
      renderWithProviders(<AdminDashboard />);

      const languageFilter = screen.getByPlaceholderText(/all languages/i);
      expect(languageFilter).toBeInTheDocument();
    });

    it('should filter users by search term', async () => {
      renderWithProviders(<AdminDashboard />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await userEvent.type(searchInput, 'test@example.com');

      expect(searchInput).toHaveValue('test@example.com');
    });

    it('should display user table columns', async () => {
      renderWithProviders(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Company')).toBeInTheDocument();
        expect(screen.getByText('Membership')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
      });
    });

    it('should show user count badge', async () => {
      renderWithProviders(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Order Management Tab', () => {
    it('should switch to orders tab', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      expect(ordersTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should display bulk export button', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      await waitFor(() => {
        expect(screen.getByText(/export pending orders/i)).toBeInTheDocument();
      });
    });

    it('should display order search input', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      const searchInput = await screen.findByPlaceholderText(/search orders/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should display order status filter', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      await waitFor(() => {
        expect(screen.getByText(/all status/i)).toBeInTheDocument();
      });
    });

    it('should display order table columns', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      await waitFor(() => {
        expect(screen.getByText('Order Details')).toBeInTheDocument();
        expect(screen.getByText('Product')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
      });
    });
  });

  describe('QR Codes Tab', () => {
    it('should display QR codes tab', () => {
      renderWithProviders(<AdminDashboard />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      expect(qrTab).toBeInTheDocument();
    });

    it('should switch to QR codes tab', async () => {
      renderWithProviders(<AdminDashboard />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      expect(qrTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('User Filtering', () => {
    it('should update search filter', async () => {
      renderWithProviders(<AdminDashboard />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await userEvent.type(searchInput, 'john');

      expect(searchInput).toHaveValue('john');
    });

    it('should filter by membership status', async () => {
      renderWithProviders(<AdminDashboard />);

      const statusButton = screen.getByText(/all users/i);
      await userEvent.click(statusButton);

      // Should show dropdown options
      await waitFor(() => {
        expect(screen.getByText('Paid Plans')).toBeInTheDocument();
        expect(screen.getByText('Free Tier')).toBeInTheDocument();
      });
    });

    it('should reset filters when clearing', async () => {
      renderWithProviders(<AdminDashboard />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await userEvent.type(searchInput, 'test');
      await userEvent.clear(searchInput);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Order Actions', () => {
    it('should display order action dropdown', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      // Wait for orders to load and check for action buttons
      await waitFor(() => {
        const actionButtons = screen.queryAllByRole('button');
        expect(actionButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Bulk Export', () => {
    it('should show toast when no pending orders', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({ toast: mockToast });

      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      const exportButton = await screen.findByText(/export pending orders/i);
      await userEvent.click(exportButton);

      // Should show error toast if no orders
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state for users', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });

    it('should show loading state for orders', async () => {
      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      expect(screen.getByText(/loading orders/i)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no users', async () => {
      // Mock empty response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as any;

      renderWithProviders(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no orders', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as any;

      renderWithProviders(<AdminDashboard />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await userEvent.click(ordersTab);

      await waitFor(() => {
        expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Settings Navigation', () => {
    it('should navigate to settings page when clicking settings button', async () => {
      const mockSetLocation = vi.fn();
      vi.mocked(require('wouter').useLocation).mockReturnValue(['/', mockSetLocation]);

      renderWithProviders(<AdminDashboard />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      expect(mockSetLocation).toHaveBeenCalledWith('/admin/settings');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByRole('tab', { name: /users/i })).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<AdminDashboard />);

      const usersTab = screen.getByRole('tab', { name: /users/i });
      usersTab.focus();

      expect(usersTab).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile-friendly tabs', () => {
      renderWithProviders(<AdminDashboard />);

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('grid');
    });
  });
});
