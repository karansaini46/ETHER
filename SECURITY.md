# Security Policy

## Security Model

ETHER is designed with a **local-first and secure-by-default** stance to protect your code and API keys:

1. **Local API Keys**: ETHER does not collect or store your API keys. All keys (`GITHUB_TOKEN` and `GEMINI_API_KEY`) are kept on your server/environment, and are **never** bundled or exposed to the client.
2. **In-Memory Analytics**: Repository details, parsed AST imports, and computed 3D layout coordinates are stored in-memory on the backend and are automatically purged after 30 minutes of inactivity. No databases are used.
3. **Ast Import Scopes**: Only relative import links within the repository are parsed and processed. Standard npm packages or built-in library imports are not recursively analyzed, preventing code exposure.

## Tiered Rate Limiting

To prevent denial of service and token exhaustion:
- **General API**: Max 100 requests per 15 minutes.
- **Repository Analysis**: Max 5 requests per 15 minutes.
- **AI Navigator Panel**: Max 20 queries per 15 minutes.

## Prompt Injection Mitigations

The AI Navigator isolates untrusted repository code from the navigator's prompt instructions:
- Repository structural details are sent in a clean, sanitized JSON format to Gemini.
- The system prompt instructs Gemini to strictly respond in structured actions without interpreting files as executable scripts.
- Code complexity metric computation and dependency layouts are calculated mathematically, rather than using LLMs, ensuring core operations are immune to prompt injection attacks.

## Reporting a Vulnerability

If you discover a security vulnerability, please open a GitHub Issue or contact the maintenance team immediately.
