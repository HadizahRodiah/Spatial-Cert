declare module 'qrcode' {
  interface QRCodeRenderersOptions {
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high';
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<void>;

  export function toDataURL(
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<string>;
}
