import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root',
})
export class CryptoService {
    private readonly SECRET_KEY = 'my_super_secret_key_123!'; // Must match backend

    encrypt(data: any): string {
        const jsonStr = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonStr, this.SECRET_KEY).toString();
    }

    decrypt(cipherText: string): any {
        const bytes = CryptoJS.AES.decrypt(cipherText, this.SECRET_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedStr);
    }
}
