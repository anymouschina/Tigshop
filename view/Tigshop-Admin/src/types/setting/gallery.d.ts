
export interface GalleryDetail {
    galleryId?: number;
    parentId?: number;
    galleryAdminId?: number;
    galleryName?: string;
    gallerySort?: number;
    galleryThumb?:string;
    shopId?: number;
    name?: string;
    sort?: number;
}
export interface GalleryFormResult {
    errcode:number;
    message:string;
    records: GalleryFormState[];
}

export interface GalleryFormState {
    galleryId: number;
    id: number;
    parentId: number;
    galleryAdminId: number;
    galleryName: string;
    name: string;
    gallerySort: number;
    galleryThumb: string;
    shopId: number;
    galleryPics: any[]
}


export interface VideoDetail {
    videoUrl: string;
    videoName: string;
    galleryId?: any;
    videoCover: string;
    format: string;
    duration: string;
    size: string;
}