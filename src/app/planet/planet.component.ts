import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
const itowns = require('itowns');

@Component({
	selector: 'app-planet',
	templateUrl: './planet.component.html',
	styleUrls: ['./planet.component.scss']
})
export class PlanetComponent implements OnInit {

	constructor(@Inject(DOCUMENT) document) {

	}

	ngOnInit(): void {
		const div = document.getElementById('viewer');
		const placement = {
			coord: new itowns.Coordinates('EPSG:4326', 2.35, 48.8),
			range: 25e6
		};
		const view = new itowns.GlobeView(div, placement);

		const orthoSource = new itowns.WMTSSource({
			url: 'http://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/wmts',
			crs: 'EPSG:3857',
			name: 'ORTHOIMAGERY.ORTHOPHOTOS',
			tileMatrixSet: 'PM',
			format: 'image/jpeg',
		});
		const orthoLayer = new itowns.ColorLayer('Ortho', {
			source: orthoSource,
		});
		view.addLayer(orthoLayer);
	}

}
