
export interface AdminRoleFilterParams {
    page: number;
    size: number;
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
}

export interface AdminRoleFilterResult {
    records: AdminRoleFilterState[];
    filter: {
        page: number;
    };
    total: number;
}

export interface AdminRoleFilterState {
    roleId: number;
    roleName?: string;
    roleDesc?: string;
}

export interface AdminRoleFormState {
    roleId?: number;
    roleName?: string;
    roleDesc?: string;
    authorityList?: string[];
}
