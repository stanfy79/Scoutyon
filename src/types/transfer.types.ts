export interface TransferQuotePreview {
  kind: 'swap_preview';
  quoteId: string;
  correlationId?: string;
  source: { asset: string; network: string; amount: string; amountAtomic?: string };
  destination: { asset: string; network: string; amount: string; minimumAmount: string | null; amountAtomic?: string };
  expiresAt: string;
  estimatedTimeSeconds: number | null;
  executable: false;
  feeDisclosure?: string;
  message?: string;
}

export interface PreparedTransfer {
  id: string;
  previewId: string;
  status: string;
  source: { symbol: string; blockchain: string; decimals: number; amountAtomic: string; tokenAddress: string; chainId: number };
  destination: { symbol: string; blockchain: string; decimals: number; recipient: string; amountAtomic: string; minimumAmountAtomic: string };
  depositAddress: string;
  depositMemo?: string | null;
  expiresAt: string;
  sourceTransactionHash?: string | null;
  destinationTransactionHash?: string | null;
  destinationExplorerUrl?: string | null;
}

export interface TransferExecutableQuote {
  kind: 'swap_executable_quote';
  transfer: PreparedTransfer;
}

export interface PrivyWalletAction {
  type: 'privy_wallet_send_transaction';
  transferId: string;
  sessionId: string;
  walletId: string;
  from: string;
  chainId: number;
  caip2: string;
  transaction: { to: string; data: string; value: string };
  reviewedTransfer: {
    sourceSymbol: string;
    sourceBlockchain: string;
    amountAtomic: string;
    tokenContract: string;
    recipient: string;
    destinationSymbol: string;
    destinationBlockchain: string;
    destinationRecipient: string;
    expectedAmountOutAtomic: string;
    minimumAmountOutAtomic: string;
    expiresAt: string;
  };
}
