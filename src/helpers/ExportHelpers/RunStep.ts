import { UploadHelper } from "..";

const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export const runStep = async (
  keyName: string,
  updateProgress: (name: string, status: string) => void,
  code: () => void | Promise<void>,
  skipComplete = false
): Promise<void> => {
  updateProgress(keyName, "running");
  try {
    await sleep(100);
    await code();
    if (!skipComplete) updateProgress(keyName, "complete");
  } catch (e) {
    console.error(`Transfer step failed: ${keyName}`, e);
    if (e instanceof Error && e.message.includes("Unauthorized")) alert("Please log in to access B1 data");
    updateProgress(keyName, "error");
    throw e;
  }
};

export const compressZip = (files: { name: string, contents: any }[], filename: string) => {
  UploadHelper.zipFiles(files, filename);
};
