export interface TransferPrepareRequest {
  intent: 'transfer_prepare_request';
  status: string;
  transferDetails: {
    sourceAsset: string;
    sourceAssetId: string;
    sourceNetwork: string;
    destinationAsset: string;
    destinationAssetId: string;
    destinationNetwork: string;
    amount: string;
    amountAtomicUnits: string;
    recipientAddress: string;
  };
  requiresExplicitConfirmation: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseTransferPrepareRequest(content: string): TransferPrepareRequest | null {
  const trimmed = content.trim();
  const candidate = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.intent !== 'transfer_prepare_request' || !isRecord(parsed.transferDetails)) return null;
  const details = parsed.transferDetails;
  const requiredStrings = [
    details.sourceAsset, details.sourceAssetId, details.sourceNetwork,
    details.destinationAsset, details.destinationAssetId, details.destinationNetwork,
    details.amount, details.amountAtomicUnits, details.recipientAddress,
  ];
  if (!requiredStrings.every(isNonEmptyString) || typeof parsed.status !== 'string' || typeof parsed.requiresExplicitConfirmation !== 'boolean') return null;

  return {
    intent: 'transfer_prepare_request',
    status: parsed.status,
    transferDetails: {
      sourceAsset: details.sourceAsset as string,
      sourceAssetId: details.sourceAssetId as string,
      sourceNetwork: details.sourceNetwork as string,
      destinationAsset: details.destinationAsset as string,
      destinationAssetId: details.destinationAssetId as string,
      destinationNetwork: details.destinationNetwork as string,
      amount: details.amount as string,
      amountAtomicUnits: details.amountAtomicUnits as string,
      recipientAddress: details.recipientAddress as string,
    },
    requiresExplicitConfirmation: parsed.requiresExplicitConfirmation,
  };
}
