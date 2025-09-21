// @ts-nocheck
export class ResponseUtil {
  static success(data: any = null, message: string = "Success") {
    return data;
  }

  static error(message: string = "Error", code: number = 400) {
    return  null;
  }

  static paginate(items: any[], total: number, page: number, size: number) {
    return {
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }
}
