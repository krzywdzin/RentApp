import {
  DOCUMENT_TYPES,
  DOCUMENT_SIDES,
  DocumentType,
  DocumentSide,
  IdCardOcrFields,
  DriverLicenseOcrFields,
} from './document.types';

describe('Document Types', () => {
  it('DocumentType enum has ID_CARD and DRIVER_LICENSE', () => {
    expect(DOCUMENT_TYPES).toContain('ID_CARD');
    expect(DOCUMENT_TYPES).toContain('DRIVER_LICENSE');
    expect(DOCUMENT_TYPES).toHaveLength(2);
  });

  it('DocumentSide has front and back', () => {
    expect(DOCUMENT_SIDES).toContain('front');
    expect(DOCUMENT_SIDES).toContain('back');
    expect(DOCUMENT_SIDES).toHaveLength(2);
  });

  it('IdCardOcrFields interface shape', () => {
    const fields: IdCardOcrFields = {
      firstName: null,
      lastName: null,
      pesel: null,
      documentNumber: null,
      issuedBy: null,
      expiryDate: null,
    };
    expect(fields).toHaveProperty('firstName');
    expect(fields).toHaveProperty('lastName');
    expect(fields).toHaveProperty('pesel');
    expect(fields).toHaveProperty('documentNumber');
    expect(fields).toHaveProperty('issuedBy');
    expect(fields).toHaveProperty('expiryDate');
  });

  it('DriverLicenseOcrFields interface shape', () => {
    const fields: DriverLicenseOcrFields = {
      licenseNumber: null,
      categories: null,
      expiryDate: null,
      bookletNumber: null,
      issuedBy: null,
    };
    expect(fields).toHaveProperty('licenseNumber');
    expect(fields).toHaveProperty('categories');
    expect(fields).toHaveProperty('expiryDate');
    expect(fields).toHaveProperty('bookletNumber');
    expect(fields).toHaveProperty('issuedBy');
  });
});
