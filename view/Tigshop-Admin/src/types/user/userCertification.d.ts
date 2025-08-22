// 列表查询时筛选参数类型
export interface UserCompanyFilterParams {
    page?: number;
    size?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
    username?: string;
}

export interface UserCompanyFilterResult {
    records: UserCompanyFilterState[];
    filter: UserCompanyFilterParams;
    total: number;
}

// 获取列表返回参数类型
export interface UserCompanyFilterState {
    statusText?: string;
    id?: number;
    userId: number;
    contactName?: string;
    contactMobile?: number;
    companyName?: string;
    companyData?: {
        contactName?: string;
        contactMobile?: number;
        companyName?: string;
        corporateName?: string;
        contactPhone?: string;
        documentType?: number;
        documentNumber?: number;
        sex?: number;
        residentialAddress?: string;
        certificateValidityPeriod?: number;
        certificateValidityPeriodDate?: any[];
        certificateValidityPeriodEnd?: any;
        frontOfPhoto?: any[];
        backOfPhoto?: any[];
        licenseAddrProvinceName?: string;
        businessScope?: string;
        businessLicenseId?: string;
        operatingTermType?: number;
        operatingTermTypeDate?: any[];
        businessLicenseImg?: any[];
        operatingTermTypeEnd?: string;
        businessLicenseAddress?: string;
    };
    status?: number;
    auditRemark?: string;
    auditTime?: string;
    addTime?: string;
    username?: string;
    isCompanyAuth?: number;
    user?: {
        userId?: number;
        username?: string;
        mobile?: number;
        isCompanyAuth?: number;
    }
}


export interface UserCompanyFormResult {
    item: UserCompanyFormState;
}
// 获取详情返回参数类型
export interface UserCompanyFormState {
    statusText?: string;
    id?: number;
    userId?: number;
    contactName?: string;
    contactMobile?: string;
    companyName?: string;
    companyData: {
        birthday?: string;
        contactName?: string;
        contactMobile?: number;
        companyName?: string;
        corporateName?: string;
        contactPhone?: string;
        documentType?: number;
        documentNumber?: number;
        sex?: number;
        residentialAddress?: string;
        certificateValidityPeriod?: number;
        certificateValidityPeriodDate: any[];
        certificateValidityPeriodEnd?: any;
        frontOfPhoto: any[];
        backOfPhoto: any[];
        licenseAddrProvinceName?: string;
        businessScope?: string;
        businessLicenseId?: string;
        operatingTermType?: number;
        operatingTermTypeDate: any[];
        businessLicenseImg: any[];
        operatingTermTypeEnd?: string;
        businessLicenseAddress?: string;
    };
    status?: number;
    auditRemark?: string;
    auditTime?: string;
    addTime?: string;
    username?: string;
    isCompanyAuth?: number;
    user?: {
        userId?: number;
        username?: string;
        mobile?: number;
        isCompanyAuth?: number;
    }
    type?: number;
    typeText?: string;
    corporateName?: string;
}
