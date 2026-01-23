import { Language } from '../../types.ts';

export const translations = {
    en: {
        title: "The Ground Court Finder🔍",
        search: "Search venues...",
        filter: "Filter",
        mtrStation: "MTR Station",
        walkingDistance: "Walking Distance",
        min: "min",
        admin: "Admin",
        login: "Login",
        logout: "Logout",
        addVenue: "Add Venue",
        editVenue: "Edit Venue",
        deleteVenue: "Delete",
        save: "Save",
        cancel: "Cancel",
        explore: "Explore",
        saved: "Saved",
        bookNow: "Book Now",
        copyAddress: "Copy Address",
        addressCopied: "Address Copied!",
        viewDetails: "View Details",
        ceilingHeight: "Ceiling Height",
        startingPrice: "Starting from",
        amenities: "Amenities",
        pricing: "Pricing",
        contact: "Contact via WhatsApp",
        noVenues: "No venues found",
        allStations: "All Stations",
        allDistances: "All Distances",
        lessThan5: "< 5 min",
        lessThan10: "< 10 min",
        walk: "walk",
        findEvents: "Find Events"
    },
    zh: {
        title: "The Ground Court Finder🔍",
        search: "搜尋場地...",
        filter: "篩選",
        mtrStation: "港鐵站",
        walkingDistance: "步行距離",
        min: "分鐘",
        admin: "管理員",
        login: "登入",
        logout: "登出",
        addVenue: "新增場地",
        editVenue: "編輯場地",
        deleteVenue: "刪除",
        save: "儲存",
        cancel: "取消",
        saved: "已儲存",
        explore: "探索",
        bookNow: "立即預訂",
        copyAddress: "複製地址",
        addressCopied: "地址已複製！",
        viewDetails: "查看詳情",
        ceilingHeight: "樓底高度",
        startingPrice: "起",
        amenities: "設施",
        pricing: "收費",
        contact: "透過 WhatsApp 聯絡",
        noVenues: "找不到場地",
        allStations: "所有車站",
        allDistances: "所有距離",
        lessThan5: "< 5 分鐘",
        lessThan10: "< 10 分鐘",
        walk: "步行",
        findEvents: "尋找活動"
    }
};

export function translate(language: Language, key: string): string {
    const selected = translations[language] || {};
    // @ts-ignore - indexing via key
    return selected[key] || key;
}