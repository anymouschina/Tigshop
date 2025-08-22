// 获取地址列表类型
export interface RegionFilterState {
    data: [];
    code: number;
    message: string;
}

export interface AddressFilterParams {
    page: number;
    size: number;
}

export interface AddressResponse {
    code: number;
    message: string;
    data: AddressData;
}

export interface AddressData {
    records: AddressFilterResult[];
    total: number;
    size: number;
    current: number;
    pages: number;
}

export interface AddressFilterResult {
    regionName: string;
    addressId: number;
    userId: number;
    consignee: string;
    email: string;
    regionNames: string[];
    address: string;
    telephone: string;
    mobile: string;
    isSelected: number;
    isDefault: number;
}

/* 地址详情 */
export interface AddressDetailResponse {
    data: Item;
    code: number;
    message: string;
}

export interface Item {
    addressId: number;
    addressTag: string;
    userId: number;
    consignee: string;
    email: string;
    regionIds: number[];
    regionNames: string[];
    address: string;
    postcode: string;
    telephone: string;
    mobile: string;
    isDefault: number;
    isSelected: number;
}
