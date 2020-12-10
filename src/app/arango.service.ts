import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Jwt {
	jwt: string;
}

export interface ArangoQueryResponse {
	result: Array<Event>;
}

export interface Event {
	_id: string;
	_key_: string;
	citizen: string;
	message: string;
	latitude: number;
	longitude: number;
	date: string;
	battery: number;
	temperature: number;
	country: string;
}

@Injectable({
	providedIn: 'root'
})
export class ArangoService {

	private jwt: string;
	private url = 'http://localhost:8529';

	constructor(private http: HttpClient) { }

	async auth(username: string, password: string): Promise<void> {
		const res = await this.http.post<Jwt>(`${this.url}/_open/auth`, {
			username,
			password
		}).toPromise();
		this.jwt = res.jwt;
	}

	async getRecords(): Promise<Array<Event>> {
		const res = await this.http.put<ArangoQueryResponse>(`${this.url}/_api/simple/all`, {
			collection: 'records'
		}, {
			headers: {
				'Authorization': `Bearer ${this.jwt}`
			}
		}).toPromise();
		return res.result;
	}
}
