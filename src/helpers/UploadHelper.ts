import Papa from "papaparse";
import FileSaver from "file-saver";
import { Buffer } from "buffer";
import JSZip from "jszip";
import * as XLSX from "xlsx";
export class UploadHelper {

  static zipFiles(files: { name: string, contents: string | Buffer }[], zipFileName: string) {
    const zip = new JSZip();
    files.forEach((f) => {
      if (typeof f.contents === "string") zip.file(f.name, Buffer.alloc(f.contents.length, f.contents));
      else zip.file(f.name, f.contents as Buffer);
    });
    zip.generateAsync({ type: "blob" }).then(content => {
      FileSaver.saveAs(content, zipFileName);
    });
  }

  static downloadImageBytes(files: { name: string, contents: string | Buffer }[], name: string, url: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        const oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "blob";
        oReq.onload = async () => {
          const blob = new Blob([oReq.response], { type: "image/png" });
          const buffer = this.toBuffer(await blob.arrayBuffer());
          files.push({ name: name, contents: buffer });
          resolve();
        };
        oReq.send();
      } catch (e) {
        console.log(e);
        reject(new DOMException("Could not download image."));
      }
    });
  }

  static toBuffer(ab: ArrayBuffer) {
    const buffer = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; ++i) buffer[i] = view[i];
    return buffer;
  }

  static async getCsv(files: FileList, fileName: string) {
    const file = this.getFile(files, fileName);
    if (file !== null) return await this.readCsv(file);
    else return null;
  }

  static readCsvString(csv: string) {
    const result = [];
    const data = Papa.parse(csv, {
      header: true,
      transformHeader: function(h) {
        return h.trim();
      }
    });
    for (let i = 0; i < data.data.length; i++) {
      const r: any = this.getStrippedRecord(data.data[i]);
      result.push(r);
    }
    return result;
  }

  static readCsv(file: File): Promise<unknown> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const result = [];
        const csv = reader.result.toString();
        const data = Papa.parse(csv, { header: true });

        for (let i = 0; i < data.data.length; i++) {
          const r: any = this.getStrippedRecord(data.data[i]);
          result.push(r);
        }
        resolve(result);
      };
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
      reader.readAsText(file);
    });
  }

  static readXlsx(arrayBuffer: ArrayBuffer) {
    // cellDates so Excel date serials (e.g. 26148) become real dates instead of being
    // read as the bare number — otherwise new Date("26148") parses it as the year 26148.
    const workbook = XLSX.read(arrayBuffer, { cellDates: true });
    const worksheets = Object.values(workbook.Sheets);
    const data: any = {};
    const sheetNames = workbook.SheetNames;
    worksheets.forEach((sheet, i) => {
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 0 }) as any[];
      // Normalize dates to ISO strings so downstream (mapping UI, CSV mapper) stays string-only.
      rows.forEach(r => Object.keys(r).forEach(k => { if (r[k] instanceof Date) r[k] = (r[k] as Date).toISOString(); }));
      data[sheetNames[i]] = rows;
    });
    return data;
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

  static getStrippedRecord(r: any) {
    const names = Object.getOwnPropertyNames(r);
    for (let j = names.length - 1; j >= 0; j--) {
      const n = names[j];
      if (r[n] === "") delete r[n];
    }
    return r;
  }

}
