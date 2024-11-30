import { createBinaryFile, readBinaryFile } from "/binary.js";

const values = [255, 255, 128, -1, 51, 51, 51, -2, 500, 1000, 2000, 3000];
console.log(values);
const binary = createBinaryFile(values);
console.log(binary);
const reconstructedValues = readBinaryFile(binary);
console.log(reconstructedValues);