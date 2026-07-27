import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = 'http://127.0.0.1:8000/api/login';

    constructor(private http: HttpClient) {}

    login(username: string, password: string) {
        return this.http.post<any>(this.apiUrl, {
            username: username,
            password: password
        });
    }
}
