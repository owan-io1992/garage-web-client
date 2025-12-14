declare module "*.json" {
  const value: { version: string; [key: string]: unknown };
  export default value;
}

declare const __APP_VERSION__: string;
