import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeAll(() => {
  // Setup global test environment
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  // Cleanup after all tests
});