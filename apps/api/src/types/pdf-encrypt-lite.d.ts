declare module '@pdfsmaller/pdf-encrypt-lite' {
  export function encryptPDF(input: Uint8Array, password: string): Promise<Uint8Array>;
}
