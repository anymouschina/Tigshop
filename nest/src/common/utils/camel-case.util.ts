/**
 * 将下划线命名转换为驼峰式命名
 * @param str 字符串
 * @param ucfirst 首字母是否大写
 * @returns 转换后的字符串
 */
export function convertUnderline(str: string, ucfirst = true): string {
  const words = str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const result = words.replace(/\s+/g, '');
  return ucfirst ? result : result.charAt(0).toLowerCase() + result.slice(1);
}

/**
 * 将下划线命名数组转换为驼峰式命名数组
 * @param data 原数据
 * @param ucfirst 首字母是否大写
 * @returns 转换后的数据
 */
export function camelCase(data: any, ucfirst = false): any {
  if (!data) {
    return data;
  }

  // 如果不是对象，直接返回（处理字符串、数字等基本类型）
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => camelCase(item, ucfirst));
  }

  // 如果是对象，处理每个属性
  const result: any = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const newKey = convertUnderline(key, ucfirst);
      result[newKey] = camelCase(data[key], ucfirst);
    }
  }

  return result;
}