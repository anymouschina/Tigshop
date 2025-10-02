// @ts-nocheck
export const toMoneyString = (value: any): string => {
  try {
    if (value === null || value === undefined) return "0.00";
    const num = typeof value === "string" ? Number(value) : Number(value?.toString?.() ?? value);
    if (Number.isNaN(num)) return "0.00";
    return num.toFixed(2);
  } catch {
    return "0.00";
  }
};

export const toWeightString = (value: any): string => {
  try {
    if (value === null || value === undefined) return "0.000";
    const num = typeof value === "string" ? Number(value) : Number(value?.toString?.() ?? value);
    if (Number.isNaN(num)) return "0.000";
    return num.toFixed(3);
  } catch {
    return "0.000";
  }
};

export const toDateTime = (ts: any): string => {
  try {
    const n = Number(ts);
    if (!n) return "";
    const d = new Date(n * 1000);
    const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  } catch {
    return "";
  }
};
