/** تفضيلات العرض المحلية (الرسوم المتحركة والاحتفالات) */

const ANIM_KEY = "abqor-animations";

export function loadAnimations(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ANIM_KEY) !== "0";
}

export function setAnimations(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANIM_KEY, value ? "1" : "0");
  document.documentElement.classList.toggle("no-anim", !value);
}

export function applyAnimations(value: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("no-anim", !value);
}
