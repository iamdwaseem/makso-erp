import { expect, test } from "@playwright/test";

async function registerAndLogin(page: any, request: any) {
  const email = "e2e-admin@wareflow.io";
  const password = "E2EPass@123";
  await request.post("http://localhost:4000/api/auth/register", {
    data: { name: "Responsive User", email, password },
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url: URL) => url.pathname === "/" || url.pathname === "/dashboard");
}

test("dashboard and inventory pages render", async ({ page, request }) => {
  await registerAndLogin(page, request);
  await expect(page.getByRole("heading", { name: "📊 Dashboard" })).toBeVisible();
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "📦 Inventory" })).toBeVisible();
});

test("history and stock entry pages render", async ({ page, request }) => {
  await registerAndLogin(page, request);
  await page.goto("/history");
  await expect(page.getByRole("button", { name: "CSV" })).toBeVisible();
  await page.goto("/stock-entry");
  await expect(page.getByRole("heading", { name: "📥 Stock Entry" })).toBeVisible();
});

