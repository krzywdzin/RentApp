// E2E test stubs for Customer Portal endpoints — Wave 0
// Implementation will be added in Plan 03

describe('Customer Portal (e2e)', () => {
  // PORTAL-01: Magic link authentication
  describe('POST /portal/auth/exchange', () => {
    it.todo('should exchange valid token for JWT');
    it.todo('should reject expired token');
    it.todo('should reject invalid token');
    it.todo('should reject non-existent customer');
    it.todo('should return JWT with portal type claim');
  });

  // PORTAL-02: Portal data access
  describe('GET /portal/rentals', () => {
    it.todo('should return all rentals for authenticated customer');
    it.todo('should include vehicle info in response');
    it.todo('should include contract info when available');
    it.todo('should reject requests without portal token');
  });

  describe('GET /portal/rentals/:id', () => {
    it.todo('should return rental detail with contract PDF URL');
    it.todo('should return 404 for rental belonging to different customer');
    it.todo('should include return inspection summary if returned');
  });
});
