import {useTranslations} from 'next-intl';

// rc_* RPCs raise errors whose message is a fixed code (docs/conventions.md, section 5).
// Messages → Errors uses the same codes as keys.
export const rpcErrorCodes = [
  'book_not_found',
  'book_title_required',
  'book_full',
  'recipe_not_found',
  'recipe_title_required',
  'recipe_too_long',
  'rate_limited',
  'photo_not_found',
  // Raised in the browser by lib/photo.ts and saveRecipePhoto, not by an RPC.
  'photo_unreadable',
  'photo_upload_failed',
] as const;
export type RpcErrorCode = (typeof rpcErrorCodes)[number];

type RpcError = {message?: string; details?: string | null} | null | undefined;

export function getRpcErrorCode(error: unknown): RpcErrorCode | 'network' | 'unknown' {
  const failure = error as RpcError;
  if (!failure) return 'unknown';
  const code = failure.message?.trim();
  if ((rpcErrorCodes as readonly string[]).includes(code ?? '')) return code as RpcErrorCode;
  if (code && /fetch|network|failed to fetch/i.test(code)) return 'network';
  return 'unknown';
}

/** Turns an RPC error into a message for the person. */
export function useRpcErrorMessage() {
  const t = useTranslations('Errors');

  return (error: unknown) => {
    const failure = error as RpcError;
    const code = getRpcErrorCode(error);
    if (code === 'rate_limited') {
      // DETAIL says which window is full: 'hour' or 'day' (rc_create_book).
      return t('rate_limited', {period: failure?.details === 'day' ? 'day' : 'hour'});
    }
    return t(code);
  };
}
