import type { IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';
import apiClient from './client';

export const ocrApi = {
  parseIdCardImage: async (imageBase64: string): Promise<IdCardOcrFields> => {
    const { data } = await apiClient.post<IdCardOcrFields>('/ocr/parse-id-card-image', {
      imageBase64,
    });
    return data;
  },

  parseDriverLicenseImage: async (imageBase64: string): Promise<DriverLicenseOcrFields> => {
    const { data } = await apiClient.post<DriverLicenseOcrFields>(
      '/ocr/parse-driver-license-image',
      { imageBase64 },
    );
    return data;
  },

  parseIdCard: async (texts: string[]): Promise<IdCardOcrFields> => {
    const { data } = await apiClient.post<IdCardOcrFields>('/ocr/parse-id-card', { texts });
    return data;
  },

  parseDriverLicense: async (texts: string[]): Promise<DriverLicenseOcrFields> => {
    const { data } = await apiClient.post<DriverLicenseOcrFields>('/ocr/parse-driver-license', {
      texts,
    });
    return data;
  },
};
