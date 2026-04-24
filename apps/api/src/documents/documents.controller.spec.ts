import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            getDocuments: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get(DocumentsController);
  });

  describe('uploadDocumentPhoto (RODO guard)', () => {
    it('rejects uploads with 410 Gone so document photos never reach the backend', async () => {
      await expect(controller.uploadDocumentPhoto('00000000-0000-0000-0000-000000000001', 'ID_CARD' as any, 'front' as any, {} as any, 'user-1')).rejects.toBeInstanceOf(HttpException);

      try {
        await controller.uploadDocumentPhoto('00000000-0000-0000-0000-000000000001', 'ID_CARD' as any, 'front' as any, {} as any, 'user-1');
      } catch (err) {
        expect((err as HttpException).getStatus()).toBe(HttpStatus.GONE);
      }
    });
  });

  describe('getDocuments (admin-only legacy access)', () => {
    it('stays available so admin can audit and purge legacy uploaded documents', async () => {
      const result = await controller.getDocuments('00000000-0000-0000-0000-000000000001');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
