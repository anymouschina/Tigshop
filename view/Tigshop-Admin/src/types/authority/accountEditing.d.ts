// 获取详情返回参数类型

export interface AccountEditingFilterParams {}
export interface AccountEditingFormState {
    avatar: string;
    defAvatar: string;
    username: string;
    email: string;
    mobile: string;
    id: string;
}
export interface AccountPassWordEditingFormState {
    mobile?: string;
    code?: string;
    // oldPassword: string;
    password: string;
    pwdConfirm: string;
}

export interface AccountMobileEditingFormState {
    mobile: string;
    code: string;
}
export interface AdminInfoFormState {
    adminId?: number;
    username?: string;
    id?: string;
    mobile?: string;
    avatar?: string;
    password?: string;
    pwdConfirm?: string;
    oldPassword?: string;
    email?: string;
    addTime?: string;
    authList?: string[];
    suppliersId?: number;
    roleId?: number;
    shopId?: number;
    parentId?: number;
    menuTag?: string[];
    orderExport?: string[];
    extra?: string[];
    adminUser?: {
        mobile: string;
        username?: string;
    };
}

export interface UserInfo {
    userId: number;
    adminId: number;
    avatar: string;
    username: string;
    authList: string;
    shopId: string;
    parentId: string;
    suppliersId: string;
    lastTime: string;
}
