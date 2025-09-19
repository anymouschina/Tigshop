export class UploadEntity {
  id: number;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  type: string;
  related_id?: number;
  description?: string;
  status: number;
  user_id?: number;
  created_at: Date;
  updated_at: Date;

  constructor(partial: Partial<UploadEntity>) {
    Object.assign(this, partial);
  }
}