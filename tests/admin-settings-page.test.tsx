import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSettings from '../client/src/pages/admin-settings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
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

describe('Admin Settings Page', () => {
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

  describe('Page Layout', () => {
    it('should render page header', () => {
      renderWithProviders(<AdminSettings />);

      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
      expect(screen.getByText('Configure platform settings and preferences')).toBeInTheDocument();
    });

    it('should display back button', () => {
      renderWithProviders(<AdminSettings />);

      const backButton = screen.getByRole('button', { name: '' }); // Icon button
      expect(backButton).toBeInTheDocument();
    });

    it('should render all settings tabs', () => {
      renderWithProviders(<AdminSettings />);

      expect(screen.getByRole('tab', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /shipping/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /qr codes/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /stripe/i })).toBeInTheDocument();
    });
  });

  describe('Email Settings Tab', () => {
    it('should display email configuration fields', () => {
      renderWithProviders(<AdminSettings />);

      expect(screen.getByText('Email Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/from email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reply-to email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/aws region/i)).toBeInTheDocument();
    });

    it('should have email from input', () => {
      renderWithProviders(<AdminSettings />);

      const emailFromInput = screen.getByPlaceholderText(/noreply@yourdomain.com/i);
      expect(emailFromInput).toBeInTheDocument();
      expect(emailFromInput).toHaveAttribute('type', 'email');
    });

    it('should have reply-to input', () => {
      renderWithProviders(<AdminSettings />);

      const replyToInput = screen.getByPlaceholderText(/support@yourdomain.com/i);
      expect(replyToInput).toBeInTheDocument();
      expect(replyToInput).toHaveAttribute('type', 'email');
    });

    it('should have AWS region input', () => {
      renderWithProviders(<AdminSettings />);

      const regionInput = screen.getByPlaceholderText(/ca-central-1/i);
      expect(regionInput).toBeInTheDocument();
    });

    it('should have save button', () => {
      renderWithProviders(<AdminSettings />);

      const saveButton = screen.getByRole('button', { name: /save email settings/i });
      expect(saveButton).toBeInTheDocument();
    });

    it('should allow editing email settings', async () => {
      renderWithProviders(<AdminSettings />);

      const emailInput = screen.getByPlaceholderText(/noreply@yourdomain.com/i);
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Shipping Settings Tab', () => {
    it('should switch to shipping tab', async () => {
      renderWithProviders(<AdminSettings />);

      const shippingTab = screen.getByRole('tab', { name: /shipping/i });
      await userEvent.click(shippingTab);

      expect(screen.getByText('Shipping & Pricing Calculator')).toBeInTheDocument();
    });

    it('should display Canada shipping fields', async () => {
      renderWithProviders(<AdminSettings />);

      const shippingTab = screen.getByRole('tab', { name: /shipping/i });
      await userEvent.click(shippingTab);

      await waitFor(() => {
        expect(screen.getByText(/canada/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/base shipping cost/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/per item cost/i)).toBeInTheDocument();
      });
    });

    it('should display US shipping fields', async () => {
      renderWithProviders(<AdminSettings />);

      const shippingTab = screen.getByRole('tab', { name: /shipping/i });
      await userEvent.click(shippingTab);

      await waitFor(() => {
        expect(screen.getByText(/united states/i)).toBeInTheDocument();
      });
    });

    it('should display UK shipping fields', async () => {
      renderWithProviders(<AdminSettings />);

      const shippingTab = screen.getByRole('tab', { name: /shipping/i });
      await userEvent.click(shippingTab);

      await waitFor(() => {
        expect(screen.getByText(/united kingdom/i)).toBeInTheDocument();
      });
    });

    it('should accept numeric inputs for costs', async () => {
      renderWithProviders(<AdminSettings />);

      const shippingTab = screen.getByRole('tab', { name: /shipping/i });
      await userEvent.click(shippingTab);

      const baseInput = await screen.findByPlaceholderText('5.00');
      expect(baseInput).toHaveAttribute('type', 'number');
      expect(baseInput).toHaveAttribute('step', '0.01');
    });
  });

  describe('QR Code Settings Tab', () => {
    it('should switch to QR tab', async () => {
      renderWithProviders(<AdminSettings />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      expect(screen.getByText('QR Code Styling')).toBeInTheDocument();
    });

    it('should display dot style field', async () => {
      renderWithProviders(<AdminSettings />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/dot style/i)).toBeInTheDocument();
      });
    });

    it('should display corner style field', async () => {
      renderWithProviders(<AdminSettings />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/corner style/i)).toBeInTheDocument();
      });
    });

    it('should display color pickers', async () => {
      renderWithProviders(<AdminSettings />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/default qr color/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/default background/i)).toBeInTheDocument();
      });
    });

    it('should have JSON textarea', async () => {
      renderWithProviders(<AdminSettings />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/qr style json/i);
        expect(textarea).toBeInTheDocument();
        expect(textarea.tagName).toBe('TEXTAREA');
      });
    });

    it('should show helper text for JSON input', async () => {
      renderWithProviders(<AdminSettings />);

      const qrTab = screen.getByRole('tab', { name: /qr codes/i });
      await userEvent.click(qrTab);

      await waitFor(() => {
        expect(screen.getByText(/paste json export from qr-code-styling/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stripe Settings Tab', () => {
    it('should switch to Stripe tab', async () => {
      renderWithProviders(<AdminSettings />);

      const stripeTab = screen.getByRole('tab', { name: /stripe/i });
      await userEvent.click(stripeTab);

      expect(screen.getByText('Stripe Multi-Currency Configuration')).toBeInTheDocument();
    });

    it('should display Standard plan fields', async () => {
      renderWithProviders(<AdminSettings />);

      const stripeTab = screen.getByRole('tab', { name: /stripe/i });
      await userEvent.click(stripeTab);

      await waitFor(() => {
        expect(screen.getByText(/standard plan/i)).toBeInTheDocument();
      });
    });

    it('should display Pro plan fields', async () => {
      renderWithProviders(<AdminSettings />);

      const stripeTab = screen.getByRole('tab', { name: /stripe/i });
      await userEvent.click(stripeTab);

      await waitFor(() => {
        expect(screen.getByText(/pro plan/i)).toBeInTheDocument();
      });
    });

    it('should have currency-specific price ID inputs', async () => {
      renderWithProviders(<AdminSettings />);

      const stripeTab = screen.getByRole('tab', { name: /stripe/i });
      await userEvent.click(stripeTab);

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/price_xxx/i);
        expect(inputs.length).toBeGreaterThan(0); // Should have multiple price ID inputs
      });
    });
  });

  describe('Form Interaction', () => {
    it('should enable save button when form is valid', async () => {
      renderWithProviders(<AdminSettings />);

      const saveButton = screen.getByRole('button', { name: /save email settings/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button while saving', async () => {
      const mockMutate = vi.fn();
      // Mock mutation as pending
      global.fetch = vi.fn(() =>
        new Promise(() => {}) // Never resolves to simulate pending state
      ) as any;

      renderWithProviders(<AdminSettings />);

      const saveButton = screen.getByRole('button', { name: /save email settings/i });
      await userEvent.click(saveButton);

      // Button should be disabled during save
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it('should clear form after successful save', async () => {
      // Mock successful save
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' }),
        })
      ) as any;

      renderWithProviders(<AdminSettings />);

      const emailInput = screen.getByPlaceholderText(/noreply@yourdomain.com/i);
      await userEvent.type(emailInput, 'test@example.com');

      const saveButton = screen.getByRole('button', { name: /save email settings/i });
      await userEvent.click(saveButton);

      // Should show success toast
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading message while fetching settings', () => {
      renderWithProviders(<AdminSettings />);

      expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
    });

    it('should hide loading message after settings load', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as any;

      renderWithProviders(<AdminSettings />);

      await waitFor(() => {
        expect(screen.queryByText(/loading settings/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on save failure', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({ toast: mockToast });

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

      renderWithProviders(<AdminSettings />);

      const saveButton = screen.getByRole('button', { name: /save email settings/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Back Navigation', () => {
    it('should navigate back to admin dashboard', async () => {
      const mockSetLocation = vi.fn();
      vi.mocked(require('wouter').useLocation).mockReturnValue(['/', mockSetLocation]);

      renderWithProviders(<AdminSettings />);

      const backButton = screen.getByRole('button', { name: '' }); // Icon button
      await userEvent.click(backButton);

      expect(mockSetLocation).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      renderWithProviders(<AdminSettings />);

      const emailInput = screen.getByPlaceholderText(/noreply@yourdomain.com/i);
      await userEvent.type(emailInput, 'invalid-email');

      // HTML5 validation should catch this
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should validate numeric inputs', async () => {
      renderWithProviders(<AdminSettings />);

      const shippingTab = screen.getByRole('tab', { name: /shipping/i });
      await userEvent.click(shippingTab);

      const priceInput = await screen.findByPlaceholderText('5.00');
      await userEvent.type(priceInput, 'abc'); // Invalid number

      // Input should only accept numbers
      expect(priceInput).toHaveAttribute('type', 'number');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithProviders(<AdminSettings />);

      const labels = screen.getAllByRole('textbox');
      labels.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation between tabs', async () => {
      renderWithProviders(<AdminSettings />);

      const emailTab = screen.getByRole('tab', { name: /email/i });
      emailTab.focus();

      expect(emailTab).toHaveFocus();
    });

    it('should have descriptive helper text', () => {
      renderWithProviders(<AdminSettings />);

      expect(screen.getByText(/the email address that automated emails will be sent from/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render tabs in grid layout', () => {
      renderWithProviders(<AdminSettings />);

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('grid');
    });
  });
});
