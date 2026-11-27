export type AuthLinkOtpType = 'invite' | 'recovery' | 'signup' | 'magiclink' | 'email_change' | 'email';
const OTP_TYPES = new Set<AuthLinkOtpType>(['invite', 'recovery', 'signup', 'magiclink', 'email_change', 'email']);
export interface ParsedAuthLink {
  code: string | null; tokenHash: string | null; tokenType: AuthLinkOtpType | null;
  accessToken: string | null; refreshToken: string | null; error: string | null;
}
export function parseAuthLink(url: string): ParsedAuthLink {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const rawType = parsed.searchParams.get('type') ?? hash.get('type');
  const error = parsed.searchParams.get('error_description') ?? parsed.searchParams.get('error_code')
    ?? parsed.searchParams.get('error') ?? hash.get('error_description') ?? hash.get('error_code') ?? hash.get('error');
  return {
    code: parsed.searchParams.get('code'),
    tokenHash: parsed.searchParams.get('token_hash') ?? hash.get('token_hash'),
    tokenType: rawType && OTP_TYPES.has(rawType as AuthLinkOtpType) ? rawType as AuthLinkOtpType : null,
    accessToken: hash.get('access_token'), refreshToken: hash.get('refresh_token'), error,
  };
}
