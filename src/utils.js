import { unlink } from "fs/promises";
export async function removeFile(path) {
  try {
    await unlink(path);
  } catch (error) {
    console.log("Error while removing files in util.js: ", error.message);
  }
}
