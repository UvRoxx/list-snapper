import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.AWS_REGION = 'ca-central-1';
process.env.AWS_SES_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SES_SECRET_ACCESS_KEY = 'test-secret';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_REPLY_TO = 'support@example.com';
process.env.BASE_URL = 'http://localhost:5173';

// Global test utilities
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
