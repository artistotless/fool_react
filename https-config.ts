import fs from 'fs';
import path from 'path';

export const useHttps = false;
export const certs = {
    key: fs.readFileSync(path.resolve(__dirname, './cert/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './cert/cert.pem')),
 }