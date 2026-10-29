import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import '../../utils/zxingSetup';

/**
 * Thin wrapper around the camera QR scanner. Loaded lazily by the Check-in page so the
 * scanner library and its decoder stay out of the main bundle.
 *
 * Props:
 *   onCode(code)          — called with the text of a scanned QR
 *   onCameraError(error)  — called with { kind, message } when the camera cannot start
 *   paused                — freeze the scanner (e.g. while a check-in request is running)
 */
export default function QrScanner({ onCode, onCameraError, paused }) {
  return (
    <Scanner
      formats={['qr_code']}
      constraints={{ facingMode: 'environment' }}
      paused={paused}
      sound={false}
      onScan={(codes) => {
        const value = codes?.[0]?.rawValue;
        if (value) onCode(value);
      }}
      onError={(err) => onCameraError({ kind: err?.kind || 'unknown', message: err?.message || '' })}
      styles={{ container: { width: '100%', maxWidth: '420px', margin: '0 auto', borderRadius: '0.75rem', overflow: 'hidden' } }}
    />
  );
}
