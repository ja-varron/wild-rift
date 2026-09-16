# Master Git Best Practices Guide for Clean Codebases and Version Control

> **Document Metadata**  
> - **Topic:** Git Best Practices, Version Control Hygiene, Repository Cleanliness  
> - **Target Audience:** Software Engineers, DevOps Engineers, Code Reviewers, and AI Autonomous Agents  
> - **Purpose:** Standardized operational reference for establishing clean git history, preventing merge conflicts, maintaining security, and aiding AI agents in repository maintenance.

---

## 1. Core Principles of Git Hygiene

Maintaining a clean and predictable codebase requires treating Git not merely as a backup mechanism, but as an explicit, semantic history of software evolution.

1. **Commit Related Changes Only (Atomic Commits):** Every commit should represent a single, atomic, and logically complete modification. Do not bundle refactoring, bug fixes, and new features into a single commit.
2. **Commit Often, Push Tested Code:** Frequent commits minimize loss of work and reduce merge conflict complexity. However, code pushed to shared tracking branches (`develop`, `main`) must pass build and test suites.
3. **Never Commit Half-Done Work:** Complete logical units before committing. If you must switch context or checkout another branch, utilize `git stash` instead of creating temporary "WIP" commits.
4. **Maintain a Linear and Searchable History:** Leverage interactive rebasing (`git rebase -i`) and squashing before merging to maintain clean history logs.
5. **Protect Production and Core Branches:** Disallow direct commits to primary branches. All changes must be introduced via structured Pull/Merge Requests with automated CI checks.

---

## 2. Initialization and Configuration Standards

### 2.1 Developer Identity & Global Settings
Ensure developer identity is properly initialized globally or per-repository to guarantee commit author traceability.

```bash
# Global Identity Configuration
git config --global user.name "Your Full Name"
git config --global user.email "your.email@example.com"

# Set Default Branch Name
git config --global init.defaultBranch main

# Line Ending Standardizations
# On Windows:
git config --global core.autocrlf true
# On macOS/Linux:
git config --global core.input true
```

### 2.2 `.gitignore` Management
Every repository must contain a comprehensive `.gitignore` file at its root before initial commit.

* **Rules for `.gitignore`:**
  * Exclude build artifacts, compiled binaries, and node modules (e.g., `dist/`, `build/`, `node_modules/`, `*.exe`, `*.so`).
  * Exclude environment files containing API keys or secrets (e.g., `.env`, `.env.local`, `secrets.json`).
  * Exclude OS and IDE specific files (e.g., `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`).
  * Use global ignore files (`~/.gitignore_global`) for user-specific editor configs rather than cluttering project `.gitignore`.

#### Sample `.gitignore` Template (Node.js / Web Application)
```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js

# Production / Build Output
/build
/dist
/.next/
/out

# Environment & Secrets
.env
.env*.local
*.pem
*.key

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/

# Operating System & IDE Files
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
```

### 2.3 Secret Prevention & Security
* **Never commit secrets:** Passwords, API tokens, SSL keys, and connection strings must never be tracked by Git.
* **Secret Scanning Tools:** Use pre-commit hooks or CI tools like `gitleaks`, `trufflehog`, or GitHub Secret Scanning.
* **Remediation:** If a secret is committed accidentally, changing/revoking the secret immediately is required. Removing it from history requires tools like `git-filter-repo` or `BFG Repo-Cleaner`, followed by a force push.

---

## 3. Branching Strategies and Workflows

Select a branching strategy aligned with your team size and deployment cadence.

### 3.1 Comparison of Common Workflows

| Strategy | Best Used For | Primary Branches | Supporting Branches |
| :--- | :--- | :--- | :--- |
| **GitHub Flow** | Web apps, Continuous Delivery, SaaS | `main` | `feature/*`, `bugfix/*` |
| **GitFlow** | Scheduled releases, enterprise software, mobile apps | `main`, `develop` | `feature/*`, `release/*`, `hotfix/*` |
| **Trunk-Based Development** | High-velocity CI/CD teams, senior teams | `main` (trunk) | Short-lived feature branches (<24h) |

### 3.2 Branch Naming Conventions
Adopt clear, structured prefix naming for feature and fix branches:

```
<type>/<issue-tracker-id>-<short-description>
```

#### Valid Types:
* `feature/` or `feat/` : New feature implementation (e.g., `feature/JIRA-102-user-auth`).
* `bugfix/` or `fix/` : Standard bug fix (e.g., `bugfix/JIRA-204-login-validation`).
* `hotfix/` : Critical emergency fix applied directly to production (e.g., `hotfix/v1.0.1-patch-security`).
* `refactor/` : Code improvement or restructuring without functional changes.
* `docs/` : Documentation improvements or updates.
* `test/` : Adding or updating test suites.
* `chore/` : Maintenance tasks, dependency updates, or pipeline adjustments.

---

## 4. Commit Message & History Guidelines

### 4.1 Conventional Commits Format
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification to ensure human and machine readability for automated changelogs.

```
<type>(<scope>): <short summary in imperative mood>

[optional body providing context and rationale]

[optional footer(s) referencing issue IDs or breaking changes]
```

#### Commit Message Rules:
1. **Subject Line Length:** Keep under 50 characters.
2. **Imperative Mood:** Write summary in present, imperative tense (e.g., "Add user authentication" NOT "Added user authentication" or "Adds user authentication").
3. **Capitalization & Punctuation:** Capitalize the summary, but do not end with a period.
4. **Blank Line Separation:** Separate subject line from body with a blank line.
5. **Body Rationale:** The body should explain **WHAT** changed and **WHY**, rather than **HOW** (the diff shows how).
6. **Wrap Body Text:** Wrap body lines at 72 characters.

#### Example Conventional Commit:
```gitcommit
feat(auth): add OAuth2 provider support for Google login

Implement OAuth2 authorization code flow using Google API client.
This updates the user service model and introduces automatic profile creation 
upon first login.

Closes #142
```

---

## 5. Daily Git Workflow & Conflict Avoidance

### 5.1 Step-by-Step Daily Developer Loop

#### Step 1: Start from the Latest Base Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-profile-page
```

#### Step 2: Work in Small Atomic Increments
```bash
# Stage specific modified files or granular patches (-p)
git add -p src/components/UserProfile.tsx
git commit -m "feat(ui): add user avatar component"
```

#### Step 3: Handle Interruption cleanly using Stash
```bash
# Save uncommitted changes without making a dirty commit
git stash save "WIP: initial layout for profile settings"

# Switch to fix critical issue
git checkout develop
git checkout -b bugfix/critical-nav-fix

# Return to work later
git checkout feature/user-profile-page
git stash pop
```

#### Step 4: Rebase / Sync Before Pushing
Always synchronize with upstream changes before opening a PR to prevent merge conflicts.

```bash
git fetch origin
git rebase origin/develop
```

If conflicts arise during rebase:
```bash
# Resolve conflict in editor, then stage:
git add <resolved-file>
git rebase --continue
# If rebase becomes unmanageable:
git rebase --abort
```

#### Step 5: Push and Open Pull Request
```bash
git push -u origin feature/user-profile-page
```

---

## 6. Code Review, Merging & Release Management

### 6.1 Merging Strategies

1. **Squash and Merge (Recommended for Features):** Combines all commits from a feature branch into a single clean commit on the main line. Keeps history clean and understandable.
2. **Rebase and Merge:** Retains individual commits in a linear flow without creating a merge commit.
3. **Merge Commit (`--no-ff`):** Preserves explicit feature branch history with a dedicated merge commit. Useful for tracking complex release branches in GitFlow.

### 6.2 Git Tags & Semantic Versioning
Mark releases with annotated tags adhering to Semantic Versioning (`MAJOR.MINOR.PATCH`).

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release version 1.2.0: Added OAuth support and bug fixes"

# Push tags to remote
git push origin v1.2.0
# Or push all tags
git push origin --tags
```

---

## 7. Repository Cleanliness & Maintenance

### 7.1 Removing Untracked Files Safely
```bash
# Dry-run to preview files to be deleted
git clean -nd

# Remove untracked files and directories
git clean -fd
```

### 7.2 Cleaning Remote Stale Branches
```bash
# Prune local references to deleted remote branches
git fetch --prune

# Delete local branch after pull request is merged
git branch -d feature/user-profile-page

# Force delete unmerged branch (if abandoned)
git branch -D feature/user-profile-page
```

### 7.3 Large File Handling (Git LFS)
Do not commit large media files, datasets, or heavy binaries directly to Git. Use `git-lfs` (Git Large File Storage).

```bash
# Initialize Git LFS
git lfs install

# Track specific file extensions
git lfs track "*.zip" "*.mp4" "*.psd"

# Ensure .gitattributes is tracked
git add .gitattributes
```

---

## 8. Automation with Git Hooks

Automate formatting, linting, and unit tests locally before commits reach the repository using Git Hooks (e.g., Husky for JavaScript/TypeScript).

### Sample Pre-Commit Hook (`.git/hooks/pre-commit`)
```bash
#!/bin/sh
echo "Running pre-commit checks..."

# Run Code Formatting Check
npm run format:check
if [ $? -ne 0 ]; then
  echo "Code formatting errors found. Please run 'npm run format' before committing."
  exit 1
fi

# Run Linter
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Commit aborted."
  exit 1
fi

# Run Unit Tests
npm run test:quick
if [ $? -ne 0 ]; then
  echo "Quick tests failed. Commit aborted."
  exit 1
fi

exit 0
```

---

## 9. AI Agent Quick Reference Rules (Machine-Readable Matrix)

This section provides explicit rule structures formatted for AI Agent interpretation and execution.

```json
{
  "ruleset_version": "1.0",
  "domain": "git_version_control",
  "guidelines": [
    {
      "id": "GIT-001",
      "rule": "Atomic Commits",
      "description": "Ensure each commit contains exactly one logical set of changes.",
      "action": "Split multi-purpose diffs into separate commits using git add -p."
    },
    {
      "id": "GIT-002",
      "rule": "Conventional Commits",
      "description": "Commit messages must follow <type>(<scope>): <subject> format.",
      "imperative_mood_required": true,
      "max_subject_length": 50
    },
    {
      "id": "GIT-003",
      "rule": "No Secrets In Repo",
      "description": "Never allow .env files, certificates, API tokens, or keys into commit index.",
      "verification": "Check .gitignore and run secret scanning before staging."
    },
    {
      "id": "GIT-004",
      "rule": "Branch Naming",
      "description": "Branches must be prefixed with type (feature/, bugfix/, hotfix/, refactor/, docs/, chore/).",
      "pattern": "^(feature|feat|bugfix|fix|hotfix|refactor|docs|chore|test)/[a-zA-Z0-9_-]+$"
    },
    {
      "id": "GIT-005",
      "rule": "Pull Before Push",
      "description": "Always sync base branch with rebase prior to pushing feature branch.",
      "commands": ["git fetch origin", "git rebase origin/<base-branch>"]
    },
    {
      "id": "GIT-006",
      "rule": "No Direct Main Commits",
      "description": "Direct commits to main/master/develop are forbidden. Use Pull Requests.",
      "enforce_pr": true
    }
  ]
}
```

---

## Summary Checklist for Clean Codebase Maintenance

- [ ] Repository initialized with proper `user.name`, `user.email`, and `init.defaultBranch`.
- [ ] Root `.gitignore` configured to exclude build outputs, OS junk, and secrets.
- [ ] Branch naming strictly follows `<type>/<description>` format.
- [ ] Commits are small, atomic, and thoroughly tested.
- [ ] Commit messages follow the Conventional Commits specification in imperative mood.
- [ ] `git stash` is used for interruptions instead of WIP commits.
- [ ] Local branch rebased against remote upstream before submitting Pull Request.
- [ ] Pull Requests reviewed, tested, and squashed/merged clean into main branches.
- [ ] Merged local and remote feature branches regularly pruned.
