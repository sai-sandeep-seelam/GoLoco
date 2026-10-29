import { setZXingModuleOverrides } from '@yudiel/react-qr-scanner';
import zxingReaderWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

/**
 * By default the QR decoder (a WebAssembly file) is downloaded at runtime from the
 * jsDelivr CDN. This points it at the copy bundled with our own site instead, so
 * nothing is fetched from a third-party host.
 *
 * The zxing-wasm version in package.json must match the one barcode-detector uses.
 */
setZXingModuleOverrides({
  locateFile: (path, prefix) =>
    path.endsWith('.wasm') ? zxingReaderWasmUrl : prefix + path,
});
