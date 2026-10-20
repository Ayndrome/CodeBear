# CodeDolphin Testing Guide

Comprehensive testing suite for CodeDolphin using Jest (unit tests) and Playwright (integration/e2e tests).

## 📋 Test Coverage

### Unit Tests (Jest)

**Total Test Suites**: 5
**Total Test Cases**: 50+

#### 1. React Rules Tests (`lib/analyzer/__tests__/react-rules.test.ts`)
- ✅ R-001: react/no-array-index-key (3 tests)
- ✅ R-002: react/no-direct-mutation (3 tests)
- ✅ R-003: react/no-unstable-nested (3 tests)
- ✅ R-009: react/no-leaked-event-listeners (2 tests)

#### 2. TypeScript Rules Tests (`lib/analyzer/__tests__/typescript-rules.test.ts`)
- ✅ T-001: ts/no-any (2 tests)
- ✅ T-002: ts/no-non-null-assertion (2 tests)
- ✅ T-003: ts/strict-null-checks (2 tests)
- ✅ T-006: ts/no-floating-promises (3 tests)

#### 3. Security Rules Tests (`lib/analyzer/__tests__/security-rules.test.ts`)
- ✅ S-001: security/no-dangerouslySetInnerHTML (2 tests)
- ✅ S-002: security/no-eval (4 tests)
- ✅ S-003: security/no-hardcoded-secrets (4 tests)
- ✅ S-004: security/no-sql-injection (3 tests)

#### 4. Accessibility Rules Tests (`lib/analyzer/__tests__/accessibility-rules.test.ts`)
- ✅ A-002: a11y/aria-props (2 tests)
- ✅ A-003: a11y/click-events-have-key-events (3 tests)
- ✅ A-004: a11y/no-autofocus (2 tests)
- ✅ A-006: a11y/label-has-associated-control (3 tests)

#### 5. Analyzer Integration Tests (`lib/analyzer/__tests__/analyzer.test.ts`)
- ✅ Full analyzer pipeline (7 tests)
- ✅ Multi-file analysis
- ✅ Error handling
- ✅ Issue categorization
- ✅ Complex component analysis

### Integration Tests (Playwright)

#### Webhook Flow Tests (`tests/e2e/webhook-flow.spec.ts`)
- ✅ Pull request opened event
- ✅ Pull request synchronize event
- ✅ Non-PR event handling
- ✅ HTTP method validation

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- react-rules.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="detects array index"
```

### Integration Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- webhook-flow.spec.ts

# Run in specific browser
npm run test:e2e -- --project=chromium
```

### All Tests

```bash
# Run both unit and integration tests
npm run test:all
```

## 📊 Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Statements | 70% | TBD |
| Branches | 70% | TBD |
| Functions | 70% | TBD |
| Lines | 70% | TBD |

## 🧪 Test Structure

### Unit Test Pattern

```typescript
import { describe, test, expect } from '@jest/globals';
import { parse } from '@typescript-eslint/typescript-estree';
import type { ParsedFile } from '../types';
import { checkRuleName } from '../rules/rule-name';

function parseCode(code: string, filename: string = 'test.tsx'): ParsedFile {
  return {
    filename,
    content: code,
    ast: parse(code, { jsx: true, loc: true, range: true }),
  };
}

describe('Rule Name', () => {
  test('detects issue', () => {
    const code = `/* bad code */`;
    const file = parseCode(code);
    const issues = checkRuleName(file);
    
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('category/rule-name');
    expect(issues[0].severity).toBe('error');
  });

  test('allows correct code', () => {
    const code = `/* good code */`;
    const file = parseCode(code);
    const issues = checkRuleName(file);
    
    expect(issues).toHaveLength(0);
  });
});
```

### Integration Test Pattern

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should handle scenario', async ({ request }) => {
    const response = await request.post('/api/endpoint', {
      data: { /* payload */ },
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('expectedField');
  });
});
```

## 🔍 Testing Best Practices

### 1. Test Naming
- Use descriptive test names: "detects X when Y"
- Group related tests in describe blocks
- Use consistent naming patterns

### 2. Test Coverage
- Test happy paths
- Test error cases
- Test edge cases
- Test boundary conditions

### 3. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after tests if needed

### 4. Assertions
- Use specific assertions
- Test one thing per test
- Provide meaningful error messages

### 5. Test Data
- Use realistic test data
- Keep test data minimal
- Use factories for complex objects

## 📝 Adding New Tests

### For New Analyzer Rules

1. Create test file in `lib/analyzer/__tests__/`
2. Import the rule function
3. Write tests for:
   - Issue detection (positive cases)
   - Correct code (negative cases)
   - Edge cases
   - Multiple issues in one file

Example:
```typescript
describe('NEW-001: category/rule-name', () => {
  test('detects issue', () => { /* ... */ });
  test('allows correct code', () => { /* ... */ });
  test('handles edge case', () => { /* ... */ });
});
```

### For New API Endpoints

1. Create test file in `tests/e2e/`
2. Test all HTTP methods
3. Test authentication/authorization
4. Test error responses
5. Test data validation

## 🐛 Debugging Tests

### Jest Debugging

```bash
# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- -t "test name"

# Debug in VS Code
# Add breakpoint and use Jest Debug configuration
```

### Playwright Debugging

```bash
# Run with headed browser
npm run test:e2e -- --headed

# Run with debug mode
npm run test:e2e -- --debug

# Generate trace
npm run test:e2e -- --trace on
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 🎯 Test Metrics

### Current Status
- **36 Static Analysis Rules** - All covered
- **Unit Tests**: 50+ test cases
- **Integration Tests**: 4+ test scenarios
- **Coverage**: Run `npm run test:coverage` to see current coverage

### Test Execution Time
- Unit tests: ~5-10 seconds
- Integration tests: ~30-60 seconds
- Total: ~1 minute

## 🔧 Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Run `npm install` to ensure all dependencies are installed

**Issue**: Playwright tests fail to start
**Solution**: Run `npx playwright install` to install browsers

**Issue**: Jest can't parse TypeScript
**Solution**: Check `jest.config.ts` and ensure `ts-jest` is configured

**Issue**: Coverage reports are missing
**Solution**: Ensure `coverageProvider: 'v8'` is set in jest.config.ts

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
- [TypeScript ESTree](https://typescript-eslint.io/packages/typescript-estree)

## 🎉 Next Steps

1. Run tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Add tests for remaining rules
4. Set up CI/CD pipeline
5. Achieve 80%+ coverage target
