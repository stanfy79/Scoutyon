export type BackendSyncStatus = 'idle' | 'syncing' | 'completed' | 'failed';
export type WalletProvisioningStatus = 'pending' | 'completed' | 'failed' | 'not_provisioned';

export interface ScoutyonUser {
  id: string; // Local MongoDB User ID
  privyUserId?: string;
  email: string | null;
  name?: string;
  walletAddress: string | null;
  chainType?: string;
  walletId: string | null;
  walletStatus: WalletProvisioningStatus;
  accountStatus?: string;
}

export interface SyncUserResponse {
  success: true;
  user: {
    id: string;
    privyUserId: string;
    email: string | null;
    accountStatus?: string;
    wallet: {
      id: string | null;
      address: string | null;
      chainType?: string;
      provisioningStatus: WalletProvisioningStatus;
    };
  };
}

export interface AuthContextType {
  user: ScoutyonUser | null;
  privyUser: any | null;
  ready: boolean;
  authenticated: boolean;
  backendSyncStatus: BackendSyncStatus;
  syncError: string | null;
  getAccessToken: () => Promise<string | null>;
  syncUser: () => Promise<void>;
  logout: () => Promise<void>;
}
