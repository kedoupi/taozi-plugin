---
name: e2e-testing
description: E2E 测试模式 — Playwright、Cypress、Page Object Model、测试策略、CI 集成。
---

# E2E 测试模式参考

端到端测试的核心模式和最佳实践。

## Playwright 模式 (Page Object Model)

```typescript
// page-objects/login.page.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByTestId("email-input");
    this.passwordInput = page.getByTestId("password-input");
    this.submitButton = page.getByTestId("submit-button");
    this.errorMessage = page.getByTestId("error-message");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await this.errorMessage.waitFor({ state: "visible" });
    await expect(this.errorMessage).toContainText(message);
  }
}
```

```typescript
// tests/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/login.page";

test("用户可以成功登录", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "password123");
  await expect(page).toHaveURL("/dashboard");
});

test("无效密码显示错误", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "wrong");
  await loginPage.expectError("密码错误");
});
```

## 测试策略分层

```
┌─────────────────────────────────┐
│   Smoke 测试 (5%)               │  核心路径: 登录、下单、支付
│   ── 每次提交运行                │
├─────────────────────────────────┤
│   Happy Path 测试 (20%)         │  主要用户流程
│   ── 每次合并到 main 运行        │
├─────────────────────────────────┤
│   Edge Case 测试 (75%)          │  边界条件、异常场景
│   ── 定时或手动触发              │
└─────────────────────────────────┘
```

## 选择器策略 (data-testid)

```typescript
// 优先级: role > text > testid > css

// 1. 语义化选择器 (优先)
page.getByRole("button", { name: "提交" });
page.getByLabel("邮箱地址");
page.getByPlaceholder("请输入密码");

// 2. text 选择器
page.getByText("欢迎回来");

// 3. data-testid (回退方案)
page.getByTestId("user-profile-card");

// HTML 中添加:
// <button data-testid="submit-button">提交</button>
```

原则: 选择器对用户行为建模 | 不依赖 CSS 类名或 DOM 结构 | data-testid 是最后的手段

## 等待策略

```typescript
// 自动等待 - Playwright 内置自动重试
await page.click("button"); // 等待元素可操作

// 显式等待网络请求
await page.waitForResponse("**/api/users", async () => {
  await page.getByTestId("refresh-btn").click();
});

// 等待导航完成
await Promise.all([
  page.waitForURL("/dashboard"),
  page.getByTestId("login-btn").click(),
]);

// 等待元素状态
await page.getByTestId("loading").waitFor({ state: "hidden" });
await expect(page.getByTestId("result")).toBeVisible();
```

## 截图 / 视频 Artifact

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    screenshot: "only-on-failure",   // 失败时截图
    video: "retain-on-failure",      // 失败时保留视频
    trace: "retain-on-failure",      // 失败时保留 trace
  },
  reporter: [
    ["html", { open: "never" }],
    ["github"],  // CI 中显示失败信息
  ],
});

// 测试中的视觉比对
test("页面视觉回归", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveScreenshot("pricing.png", {
    maxDiffPixelRatio: 0.01,
  });
});
```

## CI 并行化

```yaml
# GitHub Actions
jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]  # 分 4 片并行
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
```

## 测试数据管理

```typescript
// fixtures/test-data.ts
export const testUsers = {
  admin: { email: "admin@test.com", password: "admin123" },
  regular: { email: "user@test.com", password: "user123" },
};

// fixtures/auth.fixture.ts
import { test as base, Page } from "@playwright/test";

type AuthFixture = { authenticatedPage: Page };

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // 通过 API 登录，跳过 UI 流程
    const response = await page.request.post("/api/auth/login", {
      data: { email: "user@test.com", password: "user123" },
    });
    const { token } = await response.json();
    await page.context().addCookies([{
      name: "auth-token", value: token, domain: "localhost", path: "/"
    }]);
    await use(page);
  },
});
```

## Mock API

```typescript
// Mock 外部依赖 API
test("支付失败时显示错误", async ({ page }) => {
  await page.route("**/api/payments", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ error: "支付服务不可用" }),
    })
  );

  await page.goto("/checkout");
  await page.getByTestId("pay-btn").click();
  await expect(page.getByTestId("error-toast")).toContainText("支付服务不可用");
});
```
