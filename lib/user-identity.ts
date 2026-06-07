"use client";

const UUID_KEY = "vb_user_uuid";
const NICKNAME_KEY = "vb_nickname";

export function getUserUuid(): string {
  if (typeof window === "undefined") return "";
  let uuid = localStorage.getItem(UUID_KEY);
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(UUID_KEY, uuid);
  }
  return uuid;
}

export function getNickname(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

export function setNickname(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAME_KEY, name);
}
