
export interface RegionFilterParams {
    page?: number,
    size?: number,
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
    id?:number;
    parentId:number;
    regionId?:number;
}

export interface RegionFilterResult {
    records: RegionFilterState[];
    filter: {
        page: number;
    };
    total: number;
    data?: Object;
}

export interface RegionFilterState {
    regionId: number;
    isHot?: number;
    id?:number;
    regionName?: string;
    firstWord?: string;
    parentId?: number;

}

export interface RegionFormResult {
    item: RegionFormState;
}

export interface RegionFormState {
    regionId?:number;
    regionName?:number;
    isHot?: number;
    parentName?: string;
    parentId?: number;
}
