/** Reads the JWT signing secret from the environment. Throws if unset so we
 * never silently sign/verify tokens with a hardcoded fallback. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}
