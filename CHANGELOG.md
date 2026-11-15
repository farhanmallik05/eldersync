# Changelog

All notable changes to the **ElderSync** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-15 (Enterprise Code Quality & Security Hardening)

### Added
- **Input Sanitization Utility (`sanitize.ts`)**: Built-in defense-in-depth sanitization stripping malicious HTML, scripts, and event handlers.
- **Automated Test Quality Gates (TC-11 through TC-14)**: Added tests for XSS neutralization, boundary date resilience, OWASP headers, and concurrent state transitions.
- **Governance & Configuration Artifacts**: Added `.eslintrc.json`, `.prettierrc`, `.editorconfig`, and `SECURITY.md`.
- **Comprehensive JSDoc Documentation**: Enriched all exported controllers, middleware, and domain models with complete TSDoc/JSDoc annotations.

### Changed
- **Zero `any` Elimination**: Refactored all loose `any` references across backend and frontend to strict TypeScript domain models and interfaces.
- **Typed Error Handling**: Replaced generic Express error handlers with typed Request and Response boundaries.

### Security
- Verified constant-time SHA-256 hash comparison for Care Circle passcodes.
- Verified rate limiter against brute-force passcode guessing (429 Too Many Requests).
- Verified strict Helmet security headers.

---

## [1.0.0] - 2026-11-15 (PromptWars Catalyst Release)

### Added
- Full-stack Elderly Care & Medication Management Platform.
- Patient-Centred Dashboard with Senior Ergonomics (56px targets, font scaling, high-contrast mode, Web Audio chimes).
- Care Circle Access Matrix with granular role-based permissions (CAREGIVER vs FAMILY).
- Automated Grace-Period Escalation Engine with idempotent notification dispatch.
- Doctor Appointment Tracking & Real-time Adherence Analytics.
- Unified Netlify Serverless & Express Deployment.
