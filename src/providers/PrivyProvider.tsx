import React from 'react';
import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export const PrivyProvider: React.FC<PrivyProviderWrapperProps> = ({ children }) => {
  const appId = (import.meta.env.VITE_PRIVY_APP_ID as string) || '';

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#6366F1',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'off',
          },
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
};
