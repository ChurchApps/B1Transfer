import * as XLSX from "xlsx";

export class DownloadHelper {

  static createXlxs(data: Object[]) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet One");
    const buffer = XLSX.write(workbook, { type: "buffer" });
    return buffer;
  }

  static getFile(files: FileList, fileName: string) {
    for (let i = 0; i < files.length; i++) if (files[i].name === fileName) return files[i];
    return null;
  }

  static readBinary(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { resolve(reader.result.toString()); };
      reader.onerror = () => { reject(new DOMException("Error reading image")); };
      reader.readAsArrayBuffer(file);
    });
  }

  static readImage(files: FileList, photoUrl: string) {
    return new Promise<string>((resolve, reject) => {
      const match = false;
      for (let i = 0; i < files.length; i++) {
        if (files[i].name === photoUrl) {
          const reader = new FileReader();
          reader.onload = () => { resolve(reader.result.toString()); };
          reader.onerror = () => { reject(new DOMException("Error reading image")); };
          reader.readAsDataURL(files[i]);
        }
      }
      if (match) reject(new DOMException("Did not find image"));
    });
  }

  static getStrippedRecord<T>(r: T): T {
    const record = r as Record<string, unknown>;
    const names = Object.getOwnPropertyNames(record);
    for (let j = names.length - 1; j >= 0; j--) {
      const n = names[j];
      if (record[n] === "") delete record[n];
    }
    return r;
  }

}
