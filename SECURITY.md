# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities via [GitHub's private vulnerability reporting](https://github.com/getagentseal/codeburn/security/advisories/new).

Do not open a public issue for security vulnerabilities.

## Scope

Security reports are welcome for:

- The CLI (`src/`)
- The menubar installer (`src/menubar-installer.ts`)
- The macOS menubar app (`mac/`)
- The GNOME extension (`gnome/`)
- Cloud services (`apps/`)
- CI/CD workflows (`.github/workflows/`)

## Release Integrity

Menubar release assets include a `.sha256` checksum file. The installer verifies the checksum before extracting and launching the downloaded bundle.

## Security Measures

### Authentication

- Passwords hashed with Argon2
- API keys hashed with Argon2
- JWT tokens for session management
- Refresh token rotation

### Data Protection

- TLS encryption for data in transit
- Encryption at rest (when configured)
- Multi-tenant data isolation
- No prompt storage (by design)

### Access Control

- Role-based access control (Owner, Admin, Member)
- Organization-scoped data access
- Rate limiting on authentication routes
- API key revocation

## Response Timeline

- **Acknowledgment:** Within 24 hours
- **Initial assessment:** Within 48 hours
- **Resolution:** Depends on severity
- **Disclosure:** After fix is released

## Bug Bounty

We currently do not offer a bug bounty program. However, we appreciate security researchers who report vulnerabilities responsibly.

## Contact

For security inquiries:
- Email: security@aiinsight.dev
- GitHub: [Private vulnerability reporting](https://github.com/getagentseal/codeburn/security/advisories/new)

## Related Documentation

- [Privacy & Security](docs/getting-started/privacy-and-security.md) — Security architecture
- [Architecture: Security](docs/architecture/security.md) — Security details
