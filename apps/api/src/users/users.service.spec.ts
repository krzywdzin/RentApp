describe('UsersService', () => {
  it.todo('createUser() creates user with null passwordHash');
  it.todo('createUser() generates setup token with 72h expiry');
  it.todo('createUser() sends setup password email');
  it.todo('findByEmail() returns user when found');
  it.todo('findByEmail() returns null when not found');
  it.todo('requestPasswordReset() generates reset token with 1h expiry');
  it.todo('requestPasswordReset() does not throw for non-existent email');
});
