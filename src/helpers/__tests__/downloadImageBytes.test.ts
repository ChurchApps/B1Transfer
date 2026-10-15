import { test } from "node:test";
import assert from "node:assert/strict";
import { UploadHelper } from "../UploadHelper";

// Issue #1261: a photo download that fails at the network level never settled,
// so the export hung on the Photos step forever.
class FakeXhr {
  static outcome: "error" | "timeout" | "abort" | number = 200;
  status = 0;
  response: any = null;
  responseType = "";
  timeout = 0;
  onload: () => void = null;
  onerror: () => void = null;
  ontimeout: () => void = null;
  onabort: () => void = null;
  open() { }
  send() {
    setTimeout(() => {
      const o = FakeXhr.outcome;
      if (o === "error") this.onerror?.();
      else if (o === "timeout") this.ontimeout?.();
      else if (o === "abort") this.onabort?.();
      else { this.status = o; this.response = new Blob(["img"]); this.onload?.(); }
    }, 0);
  }
}
(globalThis as any).XMLHttpRequest = FakeXhr;

const settles = (p: Promise<void>) => Promise.race([
  p.then(() => "settled"),
  new Promise(r => setTimeout(() => r("hung"), 200))
]);

for (const outcome of ["error", "timeout", "abort"] as const) {
  test(`a photo download that ends in ${outcome} is skipped instead of hanging`, async () => {
    FakeXhr.outcome = outcome;
    const files: any[] = [];
    assert.equal(await settles(UploadHelper.downloadImageBytes(files, "1.png", "https://content/1.png")), "settled");
    assert.equal(files.length, 0);
  });
}

test("a 404 photo is skipped rather than saved as an image", async () => {
  FakeXhr.outcome = 404;
  const files: any[] = [];
  await UploadHelper.downloadImageBytes(files, "1.png", "https://content/1.png");
  assert.equal(files.length, 0);
});

test("a 200 photo is added to the zip files", async () => {
  FakeXhr.outcome = 200;
  const files: any[] = [];
  await UploadHelper.downloadImageBytes(files, "1.png", "https://content/1.png");
  assert.equal(files.length, 1);
  assert.equal(files[0].name, "1.png");
});
