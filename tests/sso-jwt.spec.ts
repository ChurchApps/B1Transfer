import { test, expect } from "@playwright/test";
import { splitSsoJwt } from "../src/helpers/SsoJwt";

test.describe("SSO JWT URL handling", () => {
  test("splitSsoJwt prefers the fragment and strips jwt from query and hash", () => {
    expect(splitSsoJwt("/login", "?jwt=query-token&churchId=CHU1", "")).toEqual({ jwt: "query-token", url: "/login?churchId=CHU1" });
    expect(splitSsoJwt("/login", "?churchId=CHU1", "#jwt=frag-token")).toEqual({ jwt: "frag-token", url: "/login?churchId=CHU1" });
    expect(splitSsoJwt("/login", "?jwt=query-token", "#jwt=frag-token")).toEqual({ jwt: "frag-token", url: "/login" });
    expect(splitSsoJwt("/login", "?returnUrl=%2F", "")).toEqual({ jwt: "", url: "/login?returnUrl=%2F" });
  });

  test("does not keep jwt in the query string after load", async ({ page }) => {
    await page.goto("/login?jwt=eyJhbGciOi.legacy&churchId=CHU1");
    await expect.poll(() => new URL(page.url()).searchParams.has("jwt")).toBe(false);
    expect(new URL(page.url()).searchParams.get("churchId")).toBe("CHU1");
  });

  test("does not keep jwt in the fragment after load", async ({ page }) => {
    await page.goto("/login#jwt=eyJhbGciOi.fragment");
    await expect.poll(() => new URL(page.url()).hash.includes("jwt=")).toBe(false);
  });
});
