export {};
declare global {
  interface Window {
    open(url?: string | URL | null, target?: string, features?: string): Window | null;
  }
}
