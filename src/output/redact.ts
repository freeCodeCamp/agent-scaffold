const AWS_KEY_PREFIX_PATTERN = /(?:AKIA|ASIA|AROA|AIDA|ACCA|ANPA|ABIA|AGPA)[A-Z0-9]{12,}/g;
const URL_CREDS_PATTERN = /https?:\/\/[^@\s]+@/g;
const CREDENTIAL_CONTEXT_PATTERN =
  /(?:access_key_id|secret_access_key|accessKeyId|secretAccessKey|secret|password|token|key|credential|auth)\s*[=:]\s*([A-Za-z0-9/+=]{21,})/gi;
const HEX_CREDENTIAL_CONTEXT_PATTERN =
  /(?:secret|password|token|key|credential|auth|access_key_id|secret_access_key)\s*[=:]\s*([a-f0-9]{32,})/gi;
const JSON_CREDENTIAL_PATTERN =
  /"(?:secret|password|token|key|credential|auth|access_key_id|secret_access_key|accessKeyId|secretAccessKey)"\s*:\s*"[^"]+"/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

function maskAwsKey(match: string): string {
  return match.slice(0, 4) + "****" + match.slice(-4);
}

function maskUrlCreds(match: string): string {
  const atIndex = match.lastIndexOf("@");
  const protocolEnd = match.indexOf("://") + 3;
  return match.slice(0, protocolEnd) + "****:****@" + match.slice(atIndex + 1);
}

export function redact(value: string): string {
  let result = value;
  result = result.replace(URL_CREDS_PATTERN, maskUrlCreds);
  result = result.replace(AWS_KEY_PREFIX_PATTERN, maskAwsKey);
  result = result.replace(BEARER_PATTERN, "Bearer ****");
  result = result.replace(JSON_CREDENTIAL_PATTERN, (match) => {
    const colonIndex = match.indexOf(":");
    return match.slice(0, colonIndex + 1) + '"****"';
  });
  result = result.replace(CREDENTIAL_CONTEXT_PATTERN, (_match, _secret, _offset, _full) => {
    const eqIndex = _match.indexOf("=");
    const colonIndex = _match.indexOf(":");
    const sepIndex =
      eqIndex >= 0 && colonIndex >= 0
        ? Math.min(eqIndex, colonIndex)
        : eqIndex >= 0
          ? eqIndex
          : colonIndex;
    const prefix = _match.slice(0, sepIndex + 1);
    return prefix + "****";
  });
  result = result.replace(HEX_CREDENTIAL_CONTEXT_PATTERN, (_match, _secret) => {
    const eqIndex = _match.indexOf("=");
    const colonIndex = _match.indexOf(":");
    const sepIndex =
      eqIndex >= 0 && colonIndex >= 0
        ? Math.min(eqIndex, colonIndex)
        : eqIndex >= 0
          ? eqIndex
          : colonIndex;
    const prefix = _match.slice(0, sepIndex + 1);
    return prefix + "****";
  });
  return result;
}
