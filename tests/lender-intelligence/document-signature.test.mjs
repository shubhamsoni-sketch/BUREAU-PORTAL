import assert from 'node:assert/strict';
import test from 'node:test';
import { hasValidLenderDocumentSignature } from '../../src/lib/lender-intelligence/document-signature.ts';

test('private document upload verifies PDF, OOXML, and legacy Office signatures', () => {
  assert.equal(hasValidLenderDocumentSignature(Buffer.from('%PDF-1.7\n'), 'application/pdf'), true);
  assert.equal(
    hasValidLenderDocumentSignature(
      Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from('[Content_Types].xml word/document.xml'),
      ]),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ),
    true
  );
  assert.equal(
    hasValidLenderDocumentSignature(
      Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from('[Content_Types].xml xl/workbook.xml'),
      ]),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ),
    true
  );
  assert.equal(
    hasValidLenderDocumentSignature(
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      'application/vnd.ms-excel'
    ),
    true
  );
});

test('private document upload rejects empty, disguised, mismatched, and unknown files', () => {
  assert.equal(hasValidLenderDocumentSignature(Buffer.alloc(0), 'application/pdf'), false);
  assert.equal(
    hasValidLenderDocumentSignature(Buffer.from('MZ executable'), 'application/pdf'),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(Buffer.from('%PDF-1.7'), 'application/vnd.ms-excel'),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 'application/zip'),
    false
  );
  const genericZip = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('random.txt'),
  ]);
  const wrongPackage = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('[Content_Types].xml xl/workbook.xml'),
  ]);
  const macroPackage = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('[Content_Types].xml word/document.xml word/vbaProject.bin'),
  ]);
  assert.equal(
    hasValidLenderDocumentSignature(
      genericZip,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(
      wrongPackage,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(
      macroPackage,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ),
    false
  );
});

test('private document upload rejects active PDF and legacy Office macro content', () => {
  assert.equal(
    hasValidLenderDocumentSignature(Buffer.from('%PDF-1.7 /JavaScript'), 'application/pdf'),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(Buffer.from('%PDF-1.7 /Launch'), 'application/pdf'),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(Buffer.from('%PDF-1.7 /EmbeddedFile'), 'application/pdf'),
    false
  );
  const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  assert.equal(
    hasValidLenderDocumentSignature(
      Buffer.concat([ole, Buffer.from('_VBA_PROJECT')]),
      'application/msword'
    ),
    false
  );
  assert.equal(
    hasValidLenderDocumentSignature(
      Buffer.concat([ole, Buffer.from('Macros', 'utf16le')]),
      'application/vnd.ms-excel'
    ),
    false
  );
});
