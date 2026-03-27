# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.2.x   | ✅ Current          |
| < 0.2   | ❌ Not supported    |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email **montrell@rowvyn.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You should receive an acknowledgment within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Security Considerations

- **Credentials** are stored in the OS keychain via [keytar](https://github.com/nicktrav/node-keytar), not in plaintext config files
- **Config files** are created with `0o600` permissions (owner read/write only)
- **Write operations** require explicit confirmation (`--yes`) or dry-run mode (`--dry-run`)
- **Environment variable overrides** (`ST_CLIENT_ID`, `ST_CLIENT_SECRET`) are supported for CI/CD pipelines where keychain access is unavailable
