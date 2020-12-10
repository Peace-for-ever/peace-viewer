import { Component, OnInit } from '@angular/core';

import { ArangoService } from './arango.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	constructor(private arango: ArangoService) { }

	async ngOnInit(): Promise<void> {
		await this.arango.auth('root', 'scala');
		const res = await this.arango.getRecords();
		console.log(res);
	}
}
