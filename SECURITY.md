# ElderSync Security Architecture & Policy

## 1. Overview & Threat Model

ElderSync is designed with a defense-in-depth security model to safeguard vulnerable elderly patients, protected health information (PHI), and caregiver collaboration channels.

| Threat Category | Potential Attack Vector | ElderSync Mitigation Architecture |
|---|---|---|
| **Brute Force & Enumeration** | Care Circle 6-digit passcode guessing ($10^6$ combinations) | Strict sliding-window rate limiting (`express-rate-limit`): max 5 attempts per 15 minutes per IP. Single-use invalidation immediately on redemption. |
| **Side-Channel Timing Attacks** | Measuring string comparison latency to guess hashes | Constant-time comparison using `crypto.timingSafeEqual` in `secureHashCompare`. |
| **Credential & Passcode Leakage** | Plaintext passcode exposure in logs or database | Passcodes are salted with `PASSCODE_PEPPER` and hashed with SHA-256 prior to persistence. Plain passcodes are never stored. |
| **Privilege Escalation** | Unauthorized users modifying prescriptions or appointments | Granular Role-Based Access Control (RBAC). Patient ownership is enforced for invitations and medication writes. |
| **Cross-Site Scripting (XSS)** | Injection via patient notes, doctor notes, or assistance messages | Strict input sanitization via `sanitizeString` removing script/iframe tags, event handlers, and javascript: protocols, paired with HTML entity escaping. |
| **HTTP & Header Exploits** | Clickjacking, MIME sniffing, cross-domain leaks | Hardened security headers enforced via `helmet` (HSTS, X-Content-Type-Options: nosniff, Referrer-Policy, X-Frame-Options: SAMEORIGIN). |
| **Notification Spam / Alert Floods** | Rapid duplicate escalation emails to caregivers | Deterministic idempotency keys (`idempotencyKey = "esc_${doseId}_${recipientUid}"`) guaranteeing zero duplicate email dispatches. |

---

## 2. Cryptographic Specifications

### Passcode Hashing
- **Algorithm:** SHA-256 with server-side pepper
- **Pepper:** Configurable via `PASSCODE_PEPPER` environment variable
- **TTL (Time to Live):** 15 minutes (900 seconds) from generation
- **Lifecycle:** Strictly single-use (`used: boolean` flag enforced atomically)

### Comparison Safety
```typescript
function secureHashCompare(storedHash: string, candidateHash: string): boolean {
  if (!storedHash || !candidateHash) return false;
  const bufA = Buffer.from(storedHash, 'utf-8');
  const bufB = Buffer.from(candidateHash, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
```

---

## 3. Input Validation & Defense-in-Depth

- **Schema Enforcement:** 100% of incoming payloads validated using strict `Zod` schemas before controller invocation.
- **Sanitization Layer:** All freeform text fields (`patientNote`, `acknowledgementNote`, `doctorName`, `instructions`, `helpMessage`) pass through `sanitizeString` to strip HTML entities, script tags, and control characters.
- **Type Rigor:** Zero usage of `any` types across the entire TypeScript codebase.

---

## 4. Reporting Security Vulnerabilities

If you identify a security issue or vulnerability in ElderSync, please report it immediately:
- **Email:** `security@eldersync.health` or open an issue marked `[SECURITY]` in this repository.
- Reports are acknowledged within 24 hours.
