// @ts-nocheck
export class ResponseUtil {
  static success(data: any = null, message: string = "Success") {
    return {
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  static error(message: string = "Error", code: number = 400) {
    return {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    };
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
