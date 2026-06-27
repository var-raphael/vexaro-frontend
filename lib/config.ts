// lib/config.ts
export const SITE_URL = "https://quorel.vercel.app";
export const SITE_NAME = "Quorel";

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
export const API_BASE = `${SITE_URL}/api`;