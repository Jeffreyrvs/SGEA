import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
  },
};

const mockSupabaseService = {
  getAuthClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

// ============ US-01: Registro ============
describe('AuthService - register', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // Caso 1: registro exitoso
  it('debe retornar mensaje de éxito al registrar correctamente', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uuid-123' } },
      error: null,
    });

    const result = await service.register({
      email: 'test@correo.com',
      password: '12345678',
      username: 'testuser',
    });

    expect(result).toEqual({
      message: 'Registro exitoso. Revisa tu correo para confirmar cuenta',
    });
  });

  // Caso 2: correo duplicado o datos inválidos
  it('debe lanzar BadRequestException si Supabase retorna error', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });

    await expect(
      service.register({
        email: 'existente@correo.com',
        password: '12345678',
        username: 'testuser',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // Caso 3: password débil
  it('debe lanzar BadRequestException si la contraseña es débil', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'Password should be at least 6 characters' },
    });

    await expect(
      service.register({
        email: 'test@correo.com',
        password: '123',
        username: 'testuser',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

// ============ US-02: Login ============
describe('AuthService - login', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // Caso 1: login exitoso
  it('debe retornar tokens al iniciar sesión correctamente', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'uuid-123', email: 'test@correo.com' },
        session: {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          expires_in: 3600,
        },
      },
      error: null,
    });

    const result = await service.login({
      email: 'test@correo.com',
      password: '12345678',
    });

    expect(result).toEqual({
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-123',
      expires_in: 3600,
    });
  });

  // Caso 2: credenciales incorrectas
  it('debe lanzar UnauthorizedException con mensaje genérico si las credenciales son incorrectas', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      service.login({
        email: 'test@correo.com',
        password: 'passwordincorrecto',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // Caso 3: correo no verificado
  it('debe lanzar UnauthorizedException si el correo no está verificado', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Email not confirmed' },
    });

    await expect(
      service.login({
        email: 'test@correo.com',
        password: '12345678',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // Caso 4: verificar que el mensaje es genérico (no revela cuál campo es erróneo)
  it('debe retornar siempre el mismo mensaje sin importar qué credencial es incorrecta', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      service.login({
        email: 'noexiste@correo.com',
        password: '12345678',
      }),
    ).rejects.toThrow('Credenciales incorrectas');
  });
});