import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReturnProtocolDto } from './create-return-protocol.dto';

describe('CreateReturnProtocolDto', () => {
  function createDto(overrides: Partial<Record<string, unknown>> = {}) {
    const plain = {
      rentalId: 'some-rental-id',
      cleanliness: 'CZYSTY',
      customerSignatureBase64: 'iVBORw0KGgoAAAANSUhEUg==',
      workerSignatureBase64: 'iVBORw0KGgoAAAANSUhEUg==',
      ...overrides,
    };
    return plainToInstance(CreateReturnProtocolDto, plain);
  }

  it('should accept valid cleanliness values CZYSTY, BRUDNY, DO_MYCIA', async () => {
    for (const val of ['CZYSTY', 'BRUDNY', 'DO_MYCIA']) {
      const dto = createDto({ cleanliness: val });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should reject invalid cleanliness value', async () => {
    const dto = createDto({ cleanliness: 'INVALID' });
    const errors = await validate(dto);
    const cleanlinessError = errors.find((e) => e.property === 'cleanliness');
    expect(cleanlinessError).toBeDefined();
  });

  it('should require customerSignatureBase64 and workerSignatureBase64 as non-empty strings', async () => {
    const dto = createDto({
      customerSignatureBase64: '',
      workerSignatureBase64: '',
    });
    // Empty strings should fail IsNotEmpty
    const errors = await validate(dto);
    const sigErrors = errors.filter(
      (e) =>
        e.property === 'customerSignatureBase64' ||
        e.property === 'workerSignatureBase64',
    );
    expect(sigErrors.length).toBeGreaterThanOrEqual(2);
  });

  it('should accept optional cleanlinessNote and otherNotes', async () => {
    const dto = createDto({
      cleanlinessNote: 'Some note about cleanliness',
      otherNotes: 'Other observations',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid without optional fields', async () => {
    const dto = createDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
