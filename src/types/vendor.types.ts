export type VendorVerificationStatus =
  | 'verified'
  | 'corroborated'
  | 'unverified'
  | 'contradicted'
  | 'unavailable';

export type VendorDiscoveryStatus = 'pending' | 'completed' | 'failed' | 'no_results';

export interface VendorEvidence {
  source: string;
  url?: string;
  collectedAt: string;
  status: VendorVerificationStatus;
  summary: string;
}

export interface Vendor {
  _id: string;
  name: string;
  website?: string;
  domain?: string;
  description?: string;
  location?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  categories: string[];
  products: string[];
  pricing?: {
    currency?: string;
    typicalPrice?: number;
    notes?: string;
  };
  shipping?: {
    countries?: string[];
    notes?: string;
  };
  refundPolicy?: string;
  paymentMethods: string[];
  verificationStatus: VendorVerificationStatus;
  reliabilityScore: number;
  evidence: VendorEvidence[];
  verifiedAt?: string | null;
  lastReviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDiscoveryInput {
  requirement: string;
  category?: string;
  keywords?: string[];
  budget?: {
    currency?: string;
    minimum?: number;
    maximum?: number;
  };
  location?: string;
  specifications?: string[];
  preferredCharacteristics?: string[];
  constraints?: string[];
  candidateUrls?: string[];
}

export interface VendorDiscoveryResult {
  vendorId?: string;
  name: string;
  domain?: string;
  website?: string;
  summary?: string;
  reliabilityScore?: number;
  verificationStatus?: VendorVerificationStatus;
}

export interface VendorDiscovery {
  _id: string;
  requirement: string;
  status: VendorDiscoveryStatus;
  results: VendorDiscoveryResult[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorDiscoveryResponse {
  success: true;
  discovery: VendorDiscovery;
  vendors: Vendor[];
}
