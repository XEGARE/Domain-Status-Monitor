## Code Style

Follow the project's existing code style and conventions. When modifying a file, match the style of the surrounding code.

## Git Commit Policy

After any code change, the agent MUST ALWAYS provide a commit message in English.

### Format

`<type>(<scope>): <short description>`

### First Commit Exception

- Before choosing a commit message, check whether the repository contains any commits, for example with `git rev-list --all --max-count=1`.
- If the command succeeds and produces no output, suggest `Initial commit` or a more suitable short English title describing the initial repository contents.
- For this first commit only, the `<type>(<scope>): <short description>` format and its type, scope, and lowercase requirements do not apply.
- The message MUST still be a single line wrapped in a `text` code block, without explanations or bullet points inside the block.
- If the repository already contains commits, follow the standard format and requirements below.

### Requirements

- The commit message MUST be written in English.
- The title MUST be short, meaningful, and written on a single line.
- The scope MUST be specified in parentheses.
- The scope MUST identify the affected component, subsystem, or feature.
- The description MUST be concise, specific, and technically accurate.
- Use lowercase for the type and scope.
- Avoid vague or generic descriptions.
- Do not include explanations or bullet points in the commit message.
- Use `test` when changes exclusively involve adding, updating, fixing, or refactoring tests without modifying production code.
- Use `security` for changes primarily related to fixing vulnerabilities, mitigating security risks, or improving security protections.
- Use `build` for changes related to the build system, build configuration, or external dependencies.

### Allowed Types

- `feat`: new functionality
- `fix`: bug fix
- `refactor`: code restructuring without behavior changes
- `test`: adding, updating, fixing, or refactoring tests
- `build`: changes to the build system, build configuration, or external dependencies
- `security`: security vulnerability fixes, risk mitigation, and security hardening
- `chore`: maintenance or technical changes
- `docs`: documentation changes

### Git Commit Output Format

The commit message MUST be wrapped in a code block for easy copying.

For repositories with existing commits, use this exact format:

```text
<type>(<scope>): <short description>
```

### Examples

```text
feat(mail): add image preview support
fix(auth): handle expired access tokens
refactor(core): simplify event processing
test(auth): add token expiration tests
test(parser): fix edge case assertions
build(cmake): update compiler configuration
build(deps): upgrade external dependencies
security(auth): prevent authentication bypass
security(api): improve input validation
chore(repo): update Git configuration
docs(api): update authentication documentation
```

Always output the commit message in English, even if the conversation is in another language.

## Source File EOF Policy

- Never add or preserve trailing newline characters at the end of source files.
- After every source file modification, remove all trailing blank lines and newline characters (`\n`, `\r\n`).
- Ensure the file ends immediately after the last non-whitespace character.
- Apply this rule to every modified source file, even if it originally had a trailing newline.
- Always verify EOF formatting before completing edits.