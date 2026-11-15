# Contributing to ElderSync

Thank you for contributing to **ElderSync** — the patient-centred elderly care and medication adherence platform.

## Code Quality Standards

ElderSync adheres to strict senior-level engineering standards:

1. **TypeScript Strictness**:
   - Zero tolerance for `any` or loose types.
   - All interfaces, types, and function signatures must be strictly defined.
   - All public methods, controllers, and services require comprehensive JSDoc annotations.

2. **Security & Input Sanitization**:
   - Never trust client inputs directly.
   - Validate with `zod` schemas.
   - Run freeform strings through `sanitizeString` from `backend/src/utils/sanitize.ts`.
   - Never store plain authentication tokens or passcodes.

3. **Accessibility (WCAG 2.1 AAA)**:
   - Senior touch targets must be at least 56px ($56 \times 56$ dp).
   - High contrast mode must achieve at least 7:1 contrast ratio.
   - Semantic HTML and ARIA landmarks (`role="region"`, `role="alert"`, `aria-live="polite"`) must be maintained.

4. **Testing & Quality Gates**:
   - All 14 automated test cases (`tests/eldersync.test.ts`) must pass before pull requests are approved.
   - Run tests with `npm test`.
   - Run typechecking with `npm run typecheck`.

## Conventional Commit Format

All commits must follow the Conventional Commits specification:
- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
