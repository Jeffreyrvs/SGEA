import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    console.log('Mi URL de Supabase es:', url);
    this.client = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  getClient(token?: string): SupabaseClient {
    if (token) {
      return createClient(
        this.config.get<string>('SUPABASE_URL')!,
        this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      );
    }
    return this.client;
  }

  getAuthenticatedClient(accessToken: string): SupabaseClient {
    return createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );
  }

  // Fresh stateless client for auth operations (login, register, password reset).
  // Never share this instance — signInWithPassword() mutates internal session state,
  // so reusing a single client across requests causes one user's session to overwrite another's.
  getAuthClient(): SupabaseClient {
    return createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
}