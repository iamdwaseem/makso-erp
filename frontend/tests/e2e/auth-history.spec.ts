import { expect, test } from "@playwright/test";

test("login and open history page", async ({ page, request }) => {
  const email = "e2e-admin@wareflow.io";
  const password = "E2EPass@123";
  await request.post("http://localhost:4000/api/auth/register", {
    data: {
      name: "E2E User",
      email,
      password,
    },
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/dashboard");
  await page.goto("/history");

  await expect(page.getByText("Entries")).toBeVisible();
  await expect(page.getByRole("button", { name: "CSV" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PDF" })).toBeVisible();
});

