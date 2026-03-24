describe('ContractsService', () => {
  // CONT-01: Contract creation
  it.todo('creates contract from rental data');
  it.todo('freezes contractData as JSON snapshot');
  it.todo('generates contract number in KITEK/YYYY/MMDD/XXXX format');

  // CONT-01: Content hash
  it.todo('generates content hash from frozen data');

  // CONT-02: Signature handling
  it.todo('stores signature PNG in MinIO');
  it.todo('transitions contract status to PARTIALLY_SIGNED on first signature');
  it.todo('transitions contract status to SIGNED when all signatures collected');

  // CONT-03: PDF generation
  it.todo('generates PDF after all signatures collected');

  // CONT-04: Email delivery
  it.todo('sends email with PDF attachment after generation');

  // CONT-05: Annex
  it.todo('creates annex on rental.extended event');
  it.todo('generates annex PDF');
  it.todo('emails annex PDF to customer');
});
