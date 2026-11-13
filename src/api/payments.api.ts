import { apiClient, ApiError } from './client';
import type {
  PaymentAssetAmount,
  PaymentConfirmationResponse,
  PaymentDestination,
  PaymentPreparationResponse,
  PaymentPreview,
  PaymentReadiness,
  SupportedPaymentAssets,
} from '../types/payment.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseAssetAmount(value: unknown): PaymentAssetAmount | null {
  if (
    !isRecord(value) ||
    typeof value.assetId !== 'string' ||
    value.assetId.length === 0 ||
    typeof value.asset !== 'string' ||
    value.asset.length === 0 ||
    typeof value.chain !== 'string' ||
    value.chain.length === 0 ||
    typeof value.amountAtomic !== 'string' ||
    !/^\d+$/.test(value.amountAtomic) ||
    typeof value.decimals !== 'number' ||
    !Number.isInteger(value.decimals) ||
    value.decimals < 0 ||
    typeof value.amount !== 'string'
  ) {
    return null;
  }

  return {
    assetId: value.assetId,
    asset: value.asset,
    chain: value.chain,
    amountAtomic: value.amountAtomic,
    decimals: value.decimals,
    amount: value.amount,
  };
}

function parsePaymentPreview(value: unknown): PaymentPreview | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !/^[a-f\d]{24}$/i.test(value.id) ||
    typeof value.status !== 'string' ||
    typeof value.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(value.expiresAt)) ||
    typeof value.simulation !== 'boolean'
  ) {
    return null;
  }

  const source = parseAssetAmount(value.source);
  const destinationBase = parseAssetAmount(value.destination);
  const destinationRecord = isRecord(value.destination) ? value.destination : null;
  if (
    !source ||
    !destinationBase ||
    !destinationRecord ||
    typeof destinationRecord.recipient !== 'string'
  ) {
    return null;
  }

  const optionalString = (key: string): string | null | undefined => {
    const field = value[key];
    if (typeof field === 'string') return field;
    if (field === null) return null;
    return undefined;
  };
  const optionalText = (key: string): string | undefined => {
    const field = value[key];
    return typeof field === 'string' ? field : undefined;
  };

  return {
    id: value.id,
    status: value.status,
    source,
    destination: {
      ...destinationBase,
      recipient: destinationRecord.recipient,
    } satisfies PaymentDestination,
    maximumInputAtomic: optionalString('maximumInputAtomic'),
    expiresAt: value.expiresAt,
    sourceTransactionHash: optionalString('sourceTransactionHash'),
    destinationTransactionHash: optionalString('destinationTransactionHash'),
    simulation: value.simulation,
    createdAt: optionalText('createdAt'),
    updatedAt: optionalText('updatedAt'),
    maximumInput: optionalText('maximumInput'),
    estimatedNetworkFeeAtomic: optionalText('estimatedNetworkFeeAtomic'),
    merchant: optionalText('merchant'),
    invoiceId: optionalText('invoiceId'),
    invoiceSource: optionalText('invoiceSource'),
  };
}

function parsePaymentEnvelope(
  value: unknown,
  allowNullPayment: boolean,
): PaymentPreview | null {
  if (!isRecord(value) || value.success !== true) {
    throw new ApiError(502, 'Backend returned an invalid payment response.', value);
  }

  if (allowNullPayment && value.payment === null) {
    return null;
  }

  const payment = parsePaymentPreview(value.payment);
  if (!payment) {
    throw new ApiError(502, 'Backend returned an invalid payment preview.', value);
  }

  return payment;
}

export async function prepareQuotePayment(
  quoteId: string,
): Promise<PaymentPreparationResponse> {
  const response = await apiClient<unknown>(
    `/api/quotes/${encodeURIComponent(quoteId)}/prepare-payment`,
    { method: 'POST' },
  );
  const payment = parsePaymentEnvelope(response, false);
  if (!payment) {
    throw new ApiError(502, 'Backend returned an empty payment preparation.', response);
  }
  return { success: true, payment };
}

export async function confirmPayment(paymentId: string): Promise<PaymentConfirmationResponse> {
  const response = await apiClient<unknown>(
    `/api/payments/${encodeURIComponent(paymentId)}/confirm`,
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    },
  );
  const payment = parsePaymentEnvelope(response, true);
  return { success: true, payment };
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentPreview> {
  const response = await apiClient<unknown>(
    `/api/payments/${encodeURIComponent(paymentId)}/status`,
  );
  const payment = parsePaymentEnvelope(response, false);
  if (!payment) {
    throw new ApiError(502, 'Backend returned an empty payment status.', response);
  }
  return payment;
}

export async function getPaymentReadiness(): Promise<PaymentReadiness> {
  const response = await apiClient<unknown>('/api/payments/readiness');
  if (
    !isRecord(response) ||
    response.success !== true ||
    !isRecord(response.readiness)
  ) {
    throw new ApiError(502, 'Backend returned an invalid payment readiness response.', response);
  }
  const readiness = response.readiness;
  const nullableString = (key: string): string | null | undefined => {
    const value = readiness[key];
    return typeof value === 'string' ? value : value === null ? null : undefined;
  };
  const walletId = nullableString('walletId');
  const walletAddress = nullableString('walletAddress');
  const signerError = nullableString('signerError');
  const sourceAssetError = nullableString('sourceAssetError');
  const sourceTokenBalanceAtomic = nullableString('sourceTokenBalanceAtomic');
  const nativeGasBalanceAtomic = nullableString('nativeGasBalanceAtomic');
  const estimatedGasFeeAtomic = nullableString('estimatedGasFeeAtomic');
  const sourceAsset = readiness.sourceAsset as SupportedPaymentAssets['source'][number] | null;
  const chainId = readiness.chainId as number | null;
  if (sourceAsset !== null && !isSupportedPaymentAsset(sourceAsset)) {
    throw new ApiError(502, 'Backend returned an invalid source asset.', response);
  }
  if (
    typeof readiness.walletExists !== 'boolean' ||
    walletId === undefined ||
    walletAddress === undefined ||
    typeof readiness.signerDelegated !== 'boolean' ||
    signerError === undefined ||
    sourceAssetError === undefined ||
    sourceTokenBalanceAtomic === undefined ||
    nativeGasBalanceAtomic === undefined ||
    estimatedGasFeeAtomic === undefined ||
    (typeof chainId !== 'number' && chainId !== null) ||
    typeof readiness.livePaymentsEnabled !== 'boolean' ||
    typeof readiness.ready !== 'boolean'
  ) {
    throw new ApiError(502, 'Backend returned invalid payment readiness fields.', response);
  }
  return {
    walletExists: readiness.walletExists,
    walletId,
    walletAddress,
    signerDelegated: readiness.signerDelegated,
    signerError,
    sourceAsset,
    sourceAssetError,
    sourceTokenBalanceAtomic,
    nativeGasBalanceAtomic,
    estimatedGasFeeAtomic,
    chainId,
    livePaymentsEnabled: readiness.livePaymentsEnabled,
    ready: readiness.ready,
  };
}

export async function getSupportedPaymentAssets(): Promise<SupportedPaymentAssets> {
  const response = await apiClient<unknown>('/api/payments/supported-assets');
  if (
    !isRecord(response) ||
    response.success !== true ||
    !Array.isArray(response.source) ||
    !Array.isArray(response.destinations)
  ) {
    throw new ApiError(502, 'Backend returned an invalid supported-assets response.', response);
  }

  const sourceAssets = response.source as unknown[];
  const destinationAssets = response.destinations as unknown[];
  if (!sourceAssets.every(isSupportedPaymentAsset) || !destinationAssets.every(isSupportedPaymentAsset)) {
    throw new ApiError(502, 'Backend returned an invalid supported-assets response.', response);
  }

  return {
    success: true,
    source: sourceAssets as SupportedPaymentAssets['source'],
    destinations: destinationAssets as SupportedPaymentAssets['destinations'],
  };
}

function isSupportedPaymentAsset(value: unknown): value is SupportedPaymentAssets['source'][number] {
  return (
    isRecord(value) &&
    typeof value.assetId === 'string' &&
    typeof value.symbol === 'string' &&
    typeof value.blockchain === 'string' &&
    typeof value.decimals === 'number' &&
    Number.isInteger(value.decimals) &&
    value.decimals >= 0
  );
}
