export const pricingConfig = {
  version: '2026-09-v1',
  currency: 'USD',
  skus: {
    textSearchIdsOnly: { sku: 'External Search IDs Only', perThousand: 0 },
    placeDetailsEnterprise: { sku: 'External Detail Fetch', perThousand: 6 },
  },
};

export function estimateGoogleCost(textSearchCalls: number, placeDetailsCalls: number) {
  return Number(
    (
      (textSearchCalls * pricingConfig.skus.textSearchIdsOnly.perThousand) / 1000 +
      (placeDetailsCalls * pricingConfig.skus.placeDetailsEnterprise.perThousand) / 1000
    ).toFixed(4)
  );
}
