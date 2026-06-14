const QUAGGA_URL = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';

interface QuaggaResult {
  codeResult?: { code?: string };
}

interface QuaggaStatic {
  init(
    config: Record<string, unknown>,
    callback: (err?: Error) => void,
  ): void;
  start(): void;
  stop(): void;
  onDetected(callback: (result: QuaggaResult) => void): void;
  offDetected(callback: (result: QuaggaResult) => void): void;
}

declare global {
  interface Window {
    Quagga?: QuaggaStatic;
  }
}

let loadPromise: Promise<QuaggaStatic> | null = null;

export function loadQuagga(): Promise<QuaggaStatic> {
  if (window.Quagga) return Promise.resolve(window.Quagga);

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${QUAGGA_URL}"]`);
      if (existing) {
        existing.addEventListener('load', () => {
          if (window.Quagga) resolve(window.Quagga);
          else reject(new Error('Quagga failed to load'));
        });
        existing.addEventListener('error', () => reject(new Error('Quagga script error')));
        return;
      }

      const script = document.createElement('script');
      script.src = QUAGGA_URL;
      script.async = true;
      script.onload = () => {
        if (window.Quagga) resolve(window.Quagga);
        else reject(new Error('Quagga failed to load'));
      };
      script.onerror = () => reject(new Error('Quagga script error'));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

export type { QuaggaResult, QuaggaStatic };
