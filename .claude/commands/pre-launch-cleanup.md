# Pre-Launch Cleanup

Perform a comprehensive cleanup of the codebase to prepare for Vercel deployment and client review. This command removes temporary files, unused code, redundant comments, console logs, and ensures the codebase is production-ready.

## Steps

1. **Analyze the codebase structure**
   - Identify all temporary files, documentation drafts, and resolution reports
   - Find all console.log statements in TypeScript/JavaScript files
   - Identify unused dependencies in package.json
   - Locate unused imports and dead code

2. **Clean up temporary and documentation files**
   - Remove all TODO resolution reports (TODO_*.md, *-RESOLUTION-*.md, *-SUMMARY.md)
   - Remove temporary verification files (verify-*.md)
   - Clean up implementation summary documents that are no longer needed
   - Keep only essential documentation (README.md, ARCHITECTURE.md, API docs, DEPLOYMENT.md)
   - Organize remaining docs into docs/ directory if not already there

3. **Remove console.log and debug statements**
   - Search for console.log, console.debug, console.warn in all .ts, .tsx, .js, .jsx files
   - Remove or replace with proper logging (using lib/logger.ts if available)
   - Keep only essential error logging (console.error for critical errors)
   - Check for debugger statements and remove them

4. **Clean up code comments**
   - Remove TODO comments that have been resolved
   - Remove redundant or outdated comments
   - Keep JSDoc comments for functions and important business logic
   - Remove commented-out code blocks
   - Ensure remaining comments add value and are up-to-date

5. **Identify and remove unused dependencies**
   - Run `npm run lint` to check for issues
   - Use `npx depcheck` to find unused dependencies (if available)
   - Review package.json for dev dependencies that aren't used
   - Remove unused dependencies with `npm uninstall`
   - Update package-lock.json

6. **Remove unused code and files**
   - Search for unused imports in TypeScript files
   - Identify orphaned test files or components
   - Remove any duplicate utility functions
   - Check for unused API routes or server endpoints
   - Remove empty or placeholder files

7. **Clean up test artifacts**
   - Remove playwright-report/ and test-results/ directories from git tracking
   - Ensure these are in .gitignore
   - Clean up any temporary test fixtures or mock data files

8. **Optimize imports and exports**
   - Organize imports in a consistent order (React, third-party, local)
   - Remove unused imports across all files
   - Use barrel exports where appropriate for cleaner imports

9. **Environment and configuration cleanup**
   - Review .env.example to ensure it's up-to-date
   - Remove any hardcoded values that should be environment variables
   - Verify all secrets are properly configured and not exposed
   - Check that .gitignore is comprehensive

10. **Final verification**
    - Run TypeScript type checking: `npm run type-check` or `npx tsc --noEmit`
    - Run linting: `npm run lint`
    - Run tests: `npm test`
    - Build the project: `npm run build`
    - Check git status for any untracked files that should be cleaned up
    - Review critical files one more time (package.json, next.config.ts, tsconfig.json)

11. **Create a pre-launch checklist**
    - Document what was cleaned up
    - Note any dependencies removed
    - List any breaking changes or important updates
    - Create a deployment checklist if not exists

## Success Criteria

- [ ] All temporary resolution reports and verification files removed
- [ ] No console.log statements remain (except intentional error logging)
- [ ] All unused dependencies removed from package.json
- [ ] No TODO comments for completed tasks
- [ ] No commented-out code blocks
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] All tests pass: `npm test`
- [ ] Production build succeeds: `npm run build`
- [ ] Git status is clean (no untracked temporary files)
- [ ] Only essential documentation remains in organized structure
- [ ] .gitignore is comprehensive and up-to-date

## Notes

- **Be cautious**: Review changes before committing
- **Backup**: Consider creating a branch before major cleanup
- **Incremental**: Clean up in stages and test after each stage
- **Document**: Keep track of what's being removed in case rollback is needed
- **Client-ready**: Ensure code is professional and easy to understand
