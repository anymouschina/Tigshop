// 下划线转大驼峰
export function toPascalCase(str: string): string {
    const words = str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    return words.join("");
}

// 下划线转小驼峰
export function toCamelCase(str: string): string {
    const words = str.split("_").map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)));
    return words.join("");
}
// 首字母转大写
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const fillZero = (value: number) => {
    return value >= 10 ? value : `0${value}`;
};

export const isNumber = (value: unknown): value is number => {
    return typeof value === "number";
};

export function formatDate(value: Date | number | string | undefined | null, isSecond = false): string | undefined {
    if (!value) {
        return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = fillZero(date.getMonth() + 1);
    const day = fillZero(date.getDate());
    const hour = fillZero(date.getHours());
    const minute = fillZero(date.getMinutes());
    const second = fillZero(date.getSeconds());

    return isSecond ? `${year}-${month}-${day} ${hour}:${minute}:${second}` : `${year}-${month}-${day}`;
}

export function getDays(day: any, type: string) {
    const date = new Date();
    if (type === "sub") {
        date.setTime(date.getTime() - 3600 * 1000 * 24 * day);
    }
    if (type === "add") {
        date.setTime(date.getTime() + 3600 * 1000 * 24 * day);
    }
    return date;
}
export function getDaysBetweenDates(dateString: any) {
    // 将日期字符串转换为 Date 对象
    const date1: any = new Date(dateString[0]);
    const date2: any = new Date(dateString[1]);

    // 计算两个日期之间的毫秒差
    const diffInMilliseconds = date2 - date1;

    // 将毫秒差转换为天数
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    // 返回绝对值，确保结果为正数
    return Math.abs(diffInDays);
}
// 获取assets静态资源
export const getAssetsFile = (url: any) => {
    return new URL(url, import.meta.url).href;
};

export function extractContent(str: string): string {
    if (!str) return "";

    const keywords = {
        "../assets/avatar/": "def",
        "img/gallery/": "one"
    };

    for (const [keyword, value] of Object.entries(keywords)) {
        if (str.includes(keyword)) {
            return value;
        }
    }

    return "";
}

import { useConfigStore } from "@/store/config";
export function getShopLink(patn: string, shopId: any) {
    const config = useConfigStore();
    const domain = config.get("pcDomain") ? config.get("pcDomain") : config.get("h5Domain");
    return domain + "/" + patn + "/" + shopId;
}

export const copyDomText = (val: string): void => {
    // 获取需要复制的元素以及元素内的文本内容
    const text = val;
    // 添加一个input元素放置需要的文本内容
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    // 选中并复制文本到剪切板
    input.select();
    document.execCommand("copy");
    // 移除input元素
    document.body.removeChild(input);
};

/**
 *
 * @param data
 * @returns  {AnyObject}
 */
export const formatArguments = (data: any) => {
    const result: any = {};
    if (typeof data === "object") {
        const dataKeys = Object.keys(data);
        for (const key of dataKeys) {
            const value = data[key];
            // 检查值是否为 null 或 undefined
            if (value === null || value === undefined || value === "") {
                continue;
            }
            if (typeof value === "object") {
                // 如果值是数组，检查其长度是否为 0
                if (Array.isArray(value) && value.length === 0) {
                    continue;
                } else if (Object.keys(value).length === 0) {
                    continue;
                }
            }
            result[key] = value;
        }
    }
    return result;
};

export const isNotEmpty = (data: any) => {
    if (Array.isArray(data)) {
        return data.length > 0;
    }
    if (typeof data === "object" && data !== null) {
        return Object.keys(data).length > 0;
    }
    return false;
};

/**
 * 判断是否是json字符串
 * @param str
 * @returns boolean
 */
export const isJsonString = (str: string): boolean => {
    if (typeof str !== "string") return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === "[object Object]" || type === "[object Array]";
    } catch (e) {
        return false;
    }
};

import { nextTick } from "vue";
export function useScrollToElement(elementId: string, containerId: string, firstElementId?: string) {
    const scrollToElement = async () => {
        await nextTick();
        const element = document.getElementById(elementId);
        const container = document.getElementById(containerId);
        const firstElement = firstElementId == elementId ? document.getElementById(firstElementId) : null;

        if (container) {
            let targetTop = 0;
            if (firstElement) {
                targetTop = 0;
            } else if (element) {
                const elementRect = element.getBoundingClientRect();
                targetTop = elementRect.top - container.getBoundingClientRect().top + container.scrollTop;
            } else {
                return; // 如果没有找到元素，则不进行滚动
            }
            const startPosition = container.scrollTop;
            const distance = targetTop - startPosition;
            const duration = 1;
            let start: number | null = null;
            const animateScroll = (timestamp: number) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                container.scrollTop = startPosition + distance * Math.min(progress / duration, 1);
                if (progress < duration) {
                    window.requestAnimationFrame(animateScroll);
                }
            };

            window.requestAnimationFrame(animateScroll);
        }
    };
    return {
        scrollToElement
    };
}

function updateUrlAndTriggerEvent(point: string) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("point", point);
    history.pushState({}, "", newUrl.toString());
    window.dispatchEvent(new Event("urlchange"));
}
export function setupIntersectionObserver() {
    const options = {
        root: document.getElementById("scrollContainer"),
        rootMargin: "0px",
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const targetId = entry.target.getAttribute("id");
                if (targetId) {
                    updateUrlAndTriggerEvent(targetId);
                }
            }
        });
    }, options);
    const elements = document.querySelectorAll("#scrollContainer .title");
    elements.forEach((element) => {
        observer.observe(element);
    });
}

/**
 * 脱敏字符串
 * @param str 原始字符串
 * @param front 保留前几位
 * @param end 保留后几位
 * @param maskChar 替换字符，默认 *
 * @returns 脱敏后的字符串
 */
export function maskString(str: string, front: number = 2, end: number = 2, maskChar: string = "*"): string {
    if (!str) return "";
    const len = str.length;
    if (front + end >= len) return str;
    const maskedLen = len - front - end;
    return str.slice(0, front) + maskChar.repeat(maskedLen) + str.slice(len - end);
}
