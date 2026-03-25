import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#4F46E5',
              colorLink: '#4F46E5',
              colorSuccess: '#16A34A',
              colorWarning: '#D97706',
              colorError: '#DC2626',
              colorTextBase: '#1E293B',
              colorBgBase: '#FFFFFF',
              borderRadius: 8,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
              boxShadow: 'none',
              boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.08)',
            },
            components: {
              Layout: {
                siderBg: '#1E293B',
                triggerBg: '#1E293B',
              },
              Menu: {
                darkItemBg: '#1E293B',
                darkSubMenuItemBg: '#0F172A',
                darkItemSelectedBg: '#4F46E5',
                darkItemHoverBg: '#334155',
                itemBorderRadius: 8,
              },
              Button: {
                fontWeight: 500,
              },
              Table: {
                headerBg: '#F8FAFC',
                rowHoverBg: '#EEF2FF',
              },
            },
          }}
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfigProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
