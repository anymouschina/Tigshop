
export const getAdminType = (): string | null => {
    return localStorage.getItem("adminType");
};

export const loginOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("adminType");
    localStorage.removeItem("config");
    localStorage.removeItem("lastOpenTime");
    localStorage.removeItem("licensedData");
    localStorage.removeItem("menus");
    localStorage.removeItem("region");
    localStorage.removeItem("routers");
    localStorage.removeItem("shopId");
    localStorage.removeItem("theme");
    localStorage.removeItem("user");
    localStorage.removeItem("decorate");
    localStorage.removeItem("version");
    localStorage.removeItem("vendor");
};