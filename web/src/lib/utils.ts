import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskPhone(phone: string) {
  if (phone.length !== 11) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(7);
}
