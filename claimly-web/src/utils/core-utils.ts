import { toast } from "sonner";

import { ToastType } from "@/constraints/enums/core-enums";

export const keysToCamelCase = (data: any): any => {
  if (Array.isArray(data)) return data.map(keysToCamelCase);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), keysToCamelCase(value)]));
  }
  return data;
};

export const keysToSnakeCase = (data: any): any => {
  if (Array.isArray(data)) return data.map(keysToSnakeCase);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), keysToSnakeCase(value)]));
  }
  return data;
};

export const showToastMessage = (type: ToastType, message: string) => {
  if (type === ToastType.SUCCESS) toast.success(message);
  else toast.error(message);
};
