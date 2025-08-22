export interface ProfitsharingSetting {
    billingNode: number;
    collectionNode: number;
    collectionTimeSetting: number;
    collectionMethod: number;
    collectionAccountType: number;
    splitPaymentMethod: number;

    storeGeneralServiceFeeRate: number;
    storeWithdrawalFeeRate: number;

    storefrontGeneralServiceFeeRate: number;
    storefrontWithdrawalFeeRate: number;

    supplierGeneralServiceFeeRate: number;
    supplierWithdrawalFeeRate: number;
}
export interface withdrawalSetting {
    withdrawalReceiptMethod: number[] | string;
    withdrawalEnabled: number;
    minAmount: number;
    maxAmount: number;
    withdrawalFrequencyUnit: number;
    withdrawalFrequencyCount: number;
    withdrawalReviewMethod: number;
    withdrawalDescription: string;
}