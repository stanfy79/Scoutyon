export interface PaymentAssetAmount {
  assetId: string;
  asset: string;
  chain: string;
  amountAtomic: string;
  decimals: number;
  amount: string;
}

export interface PaymentDestination extends PaymentAssetAmount {
  recipient: string;
}

export interface PaymentPreview {
  id: string;
  status: string;
  source: PaymentAssetAmount;
  destination: PaymentDestination;
  maximumInputAtomic?: string | null;
  expiresAt: string;
  sourceTransactionHash?: string | null;
  destinationTransactionHash?: string | null;
  simulation: boolean;
  createdAt?: string;
  updatedAt?: string;
  maximumInput?: string;
  estimatedNetworkFeeAtomic?: string;
  merchant?: string;
  invoiceId?: string;
  invoiceSource?: string;
}

export interface PaymentPreparationResponse {
  success: true;
  payment: PaymentPreview;
}

export interface PaymentConfirmationResponse {
  success: true;
  payment: PaymentPreview | null;
}

export interface SupportedPaymentAsset {
  assetId: string;
  symbol: string;
  blockchain: string;
  decimals: number;
}

export interface SupportedPaymentAssets {
  success: true;
  source: SupportedPaymentAsset[];
  destinations: SupportedPaymentAsset[];
}

export interface PaymentReadiness {
  walletExists: boolean;
  walletId: string | null;
  walletAddress: string | null;
  signerDelegated: boolean;
  signerError: string | null;
  sourceAsset: SupportedPaymentAsset | null;
  sourceAssetError: string | null;
  sourceTokenBalanceAtomic: string | null;
  nativeGasBalanceAtomic: string | null;
  estimatedGasFeeAtomic: string | null;
  chainId: number | null;
  livePaymentsEnabled: boolean;
  ready: boolean;
}
