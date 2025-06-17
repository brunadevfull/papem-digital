import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisplayProvider } from '@/context/DisplayContext';
import NoticeDisplay from '@/components/NoticeDisplay';
import App from '@/App';

// Mock fetch globally
global.fetch = vi.fn();

const mockFetch = (data: any) => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
};

describe('Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NoticeDisplay', () => {
    it('should render notice display component', () => {
      mockFetch({ success: true, notices: [], total: 0, active: 0 });
      mockFetch({ success: true, documents: [] });
      
      render(
        <DisplayProvider>
          <NoticeDisplay />
        </DisplayProvider>
      );

      expect(screen.getByText(/avisos/i)).toBeInTheDocument();
    });

    it('should display notices when available', async () => {
      const mockNotices = [
        {
          id: 1,
          title: 'Test Notice',
          content: 'Test content',
          priority: 'high',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      mockFetch({ success: true, notices: mockNotices, total: 1, active: 1 });
      mockFetch({ success: true, documents: [] });

      render(
        <DisplayProvider>
          <NoticeDisplay />
        </DisplayProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Notice')).toBeInTheDocument();
      });
    });
  });

  describe('App Component', () => {
    it('should render main app', () => {
      mockFetch({ success: true, notices: [], total: 0, active: 0 });
      mockFetch({ success: true, documents: [] });

      render(<App />);
      
      expect(screen.getByText(/Marinha do Brasil/i)).toBeInTheDocument();
    });

    it('should navigate between routes', async () => {
      mockFetch({ success: true, notices: [], total: 0, active: 0 });
      mockFetch({ success: true, documents: [] });

      render(<App />);

      // Test navigation to admin
      const adminLink = screen.getByRole('link', { name: /admin/i });
      if (adminLink) {
        await userEvent.click(adminLink);
        await waitFor(() => {
          expect(screen.getByText(/configurações/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('DisplayContext', () => {
    it('should provide display context', () => {
      mockFetch({ success: true, notices: [], total: 0, active: 0 });
      mockFetch({ success: true, documents: [] });

      const TestComponent = () => {
        const { notices, isLoading } = useDisplay();
        return (
          <div>
            <span>Notices: {notices.length}</span>
            <span>Loading: {isLoading.toString()}</span>
          </div>
        );
      };

      render(
        <DisplayProvider>
          <TestComponent />
        </DisplayProvider>
      );

      expect(screen.getByText(/Notices: 0/)).toBeInTheDocument();
    });
  });
});