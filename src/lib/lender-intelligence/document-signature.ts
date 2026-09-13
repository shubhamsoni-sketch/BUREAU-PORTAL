const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

function startsWith(bytes: Buffer, signature: Buffer) {
  return bytes.length >= signature.length && bytes.subarray(0, signature.length).equals(signature);
}

function hasZipSignature(bytes: Buffer) {
  return (
    startsWith(bytes, Buffer.from([0x50, 0x4b, 0x03, 0x04])) ||
    startsWith(bytes, Buffer.from([0x50, 0x4b, 0x05, 0x06])) ||
    startsWith(bytes, Buffer.from([0x50, 0x4b, 0x07, 0x08]))
  );
}

function hasOoxmlPackage(bytes: Buffer, packageRoot: 'word/' | 'xl/') {
  if (!hasZipSignature(bytes)) return false;
  const packageText = bytes.toString('latin1');
  return (
    packageText.includes('[Content_Types].xml') &&
    packageText.includes(packageRoot) &&
    !packageText.toLowerCase().includes('vbaproject.bin')
  );
}

function includesAsciiOrUtf16Le(bytes: Buffer, marker: string) {
  const ascii = bytes.toString('latin1').toLowerCase();
  const utf16 = bytes.toString('utf16le').toLowerCase();
  return ascii.includes(marker.toLowerCase()) || utf16.includes(marker.toLowerCase());
}

function hasUnsafeLegacyOfficeContent(bytes: Buffer) {
  return ['_VBA_PROJECT', 'VBA', 'Macros'].some((marker) => includesAsciiOrUtf16Le(bytes, marker));
}

function hasUnsafePdfContent(bytes: Buffer) {
  const content = bytes.toString('latin1').toLowerCase();
  return ['/javascript', '/launch', '/embeddedfile'].some((marker) => content.includes(marker));
}

export function hasValidLenderDocumentSignature(bytes: Buffer, mimeType: string) {
  if (!bytes.length) return false;
  if (mimeType === 'application/pdf') {
    return startsWith(bytes, Buffer.from('%PDF-', 'ascii')) && !hasUnsafePdfContent(bytes);
  }
  if (mimeType === 'application/msword' || mimeType === 'application/vnd.ms-excel') {
    return startsWith(bytes, OLE_SIGNATURE) && !hasUnsafeLegacyOfficeContent(bytes);
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return hasOoxmlPackage(bytes, 'word/');
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return hasOoxmlPackage(bytes, 'xl/');
  return false;
}
