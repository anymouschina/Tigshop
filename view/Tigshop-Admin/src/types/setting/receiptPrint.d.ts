export interface PrintListParams {
    page?: number,
    size?: number,
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
    id?:number;
    printName?: string;
    printSn?: string;
    status?: 1 | 2;
    platform?: number; 
}

export interface PrintListResponse {
    records: PrintListItem;
    total: number;
    size: number;
    current: number;
    pages: number;
}

export interface PrintListItem {
   addTime?: string;
   platformText?: string;
   printId?: number;
   printName?: string;
   printSn?: string;
   status?: number;
   statusText?: string;
   updateTime?: string;
}

export interface PrintDetailParams {
    id:number;
}

export interface PrintUdateStatusParams {
   field: string;
   id: number;
   val: string;
}

export interface PrintDeleteParams {
    id:number;
    adminNote?: string;
}

export interface PrintConfigParams {
    printId: number;
}

export interface PrintDetailResponse {
    addTime?: string;
    platform?: number;
    platformText?: string;
    printId?: number;
    printKey?: string;
    printName?: string;
    printNumber?: number;
    printSn?: string;
    shopId?: number;
    status?: number;
    statusText?: string;
    thirdAccount?: string;
    thirdKey?: string;
    updateTime?: string;
}

export interface PrintCreateParams {
    printId: number | undefined;
    printKey: string;
    printName: string;
    printNumber?: number;
    printSn: string;
    thirdAccount: string;
    thirdKey: string;
    status: number;
    autoPrint: number
}


export interface PrintConfigResponse {
    addTime?: string;
    id?: number;
    printId?: number;
    template?: PrintTemplateItem[];
    type?: number;
    typeDesc?: string;
    updateTime?: string;
}

export interface PrintTemplateItem {
    options?: PrintTemplateOption[];
    title?: string;
}

export interface PrintTemplateOption {
    choose?: boolean;
    chooseTitle?: string;
    templateValue?: string;
    value?: string;
}