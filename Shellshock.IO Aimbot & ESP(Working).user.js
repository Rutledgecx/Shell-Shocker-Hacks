// ==UserScript==
// @name         Shellshock.IO Aimbot & ESP(Working)
// @namespace    https://github.com/Rutledgecx
// @version      1.7.5
// @description  Locks aim to the nearest player in shellshock.io. Comes with an ESP too. Press B, V, N to toggle aimbot, esp, esp lines.
// @author       The_Condalorian
// @match        *://shellshock.io/*
// @icon         https://www.google.com/s2/favicons?domain=shellshock.io
// @grant        none
// @run-at       document-start
// @antifeature  ads
// ==/UserScript==

window.XMLHttpRequest = class extends window.XMLHttpRequest {


	open( method, url ) {

		if ( url.indexOf( 'shellshock.js' ) > - 1 ) {

			this.isScript = true;

		}

		return super.open( ...arguments );

	}

	get response() {

		if ( this.isScript ) {

			const code = super.response;

			const babylonVarName = /new ([a-zA-Z]+)\.Vector3/.exec( code )[ 1 ];
			const playersVarName = /([^,]+)=\[\],{}/.exec( code )[ 1 ];
			const myPlayerVarName = /"fire":document.pointerLockElement&&([^&]+)&&/.exec( code )[ 1 ];
			const sceneVarName = /createMapCells\(([^,]+),/.exec( code )[ 1 ];
			const cullFuncName = /=([a-zA-Z]+)\(this\.mesh,\.[0-9]+\)/.exec( code )[ 1 ];

			console.log( '%cInjecting code...', 'color: red; background: black; font-size: 2em;', {
				babylonVarName,
				playersVarName,
				myPlayerVarName,
				playersVarName,
				sceneVarName,
				cullFuncName
			} );

			return code.replace( sceneVarName + '.render()', `( function () {

				const players = ${playersVarName};
				const myPlayer = ${myPlayerVarName};
				const BABYLON = ${babylonVarName};

				if ( ! myPlayer ) {

					return;

				}

				if ( ! window.lineOrigin ) {

					window.lineOrigin = new BABYLON.Vector3();
					window.lines = [];

				}

				window.lineOrigin.copyFrom( myPlayer.actor.mesh.position );

				const yaw = myPlayer.actor.mesh.rotation.y;

				window.lineOrigin.x += Math.sin( yaw );
				window.lineOrigin.z += Math.cos( yaw );
				window.lineOrigin.y += Math.sin( - myPlayer.pitch );

				for ( let i = 0; i < window.lines.length; i ++ ) {

					window.lines[ i ].playerExists = false;

				}

				for ( let i = 0; i < players.length; i ++ ) {

					const player = players[ i ];

					if ( ! player || player === myPlayer ) {

						continue;

					}

					if ( player.sphere === undefined ) {

						console.log( 'Adding sphere...' );

						const material = new BABYLON.StandardMaterial( 'myMaterial', player.actor.scene );
						material.emissiveColor = material.diffuseColor = new BABYLON.Color3( 1, 0, 0 );
						material.wireframe = true;

						const sphere = BABYLON.MeshBuilder.CreateBox( 'mySphere', { width: 0.5, height: 0.75, depth: 0.5 }, player.actor.scene );
						sphere.material = material;
						sphere.position.y = 0.3;

						sphere.parent = player.actor.mesh;

						player.sphere = sphere;

					}

					if ( player.lines === undefined ) {

						const options = {
							points: [ window.lineOrigin, player.actor.mesh.position ],
							updatable: true
						};

						const lines = options.instance = BABYLON.MeshBuilder.CreateLines( 'lines', options, player.actor.scene );
						lines.color = new BABYLON.Color3( 1, 0, 0 );
						lines.alwaysSelectAsActiveMesh = true;
						lines.renderingGroupId = 1;

						player.lines = lines;
						player.lineOptions = options;

						window.lines.push( lines );

						console.log( '%cAdding line...', 'color: green; background: black; font-size: 2em;' );

					}

					player.lines.playerExists = true;
					player.lines = BABYLON.MeshBuilder.CreateLines( 'lines', player.lineOptions );

					player.sphere.renderingGroupId = window.espEnabled ? 1 : 0;
					player.sphere.visibility = ( window.aimbotEnabled || window.espEnabled ) && myPlayer !== player && ( myPlayer.team === 0 || myPlayer.team !== player.team );

					player.lines.visibility = player.playing && player.sphere.visibility && window.showLines;

				}

				for ( let i = 0; i < window.lines.length; i ++ ) {

					if ( ! window.lines[ i ].playerExists ) {

						console.log( '%cRemoving line...', 'color: red; background: black; font-size: 2em;' );

						window.lines[ i ].dispose();
						window.lines.splice( i, 1 );

					}

				}

				if ( window.aimbotEnabled && myPlayer.playing ) {

					let minDistance = Infinity;
					let targetPlayer;

					for ( let i = 0; i < players.length; i ++ ) {

						const player = players[ i ];

						if ( player && player !== myPlayer && player.playing && ( myPlayer.team === 0 || player.team !== myPlayer.team ) ) {

							const distance = Math.hypot( player.x - myPlayer.x, player.y - myPlayer.y, player.z - myPlayer.z );

							if ( distance < minDistance ) {

								minDistance = distance;

								targetPlayer = player;

							}

						}

					}

					if ( targetPlayer ) {

						const x = targetPlayer.actor.mesh.position.x - myPlayer.actor.mesh.position.x;
						const y = targetPlayer.actor.mesh.position.y - myPlayer.actor.mesh.position.y;
						const z = targetPlayer.actor.mesh.position.z - myPlayer.actor.mesh.position.z;

						myPlayer.yaw = Math.radAdd( Math.atan2( x, z ), 0 );
						myPlayer.pitch = - Math.atan2( y, Math.hypot( x, z ) ) % 1.5;

					}

				}

			} )(); ${sceneVarName}.render()` )
				.replace( `function ${cullFuncName}`, `

					function ${cullFuncName}() {

						return true;

					}

				function someFunctionWhichWillNeverBeUsedNow` );

		}

		return super.response;

	}

};

window.espEnabled = true;
window.aimbotEnabled = true;
window.showLines = true;

window.addEventListener( 'keyup', function ( event ) {

	if ( document.activeElement && document.activeElement.tagName === 'INPUT' ) {

		return;

	}

	switch ( event.code ) {

		case 'KeyB':
			window.aimbotEnabled = ! window.aimbotEnabled;
			showMsg( 'Aimbot', window.aimbotEnabled );
			break;

		case 'KeyV':
			window.espEnabled = ! window.espEnabled;
			showMsg( 'ESP', window.espEnabled );
			break;

		case 'KeyN':
			window.showLines = ! window.showLines;
			showMsg( 'ESP Lines', window.showLines );
			break;

        case 'KeyC':
			showMsg( 'By: The_Condalorian');
			break;

		case 'KeyH':
			infoEl.style.display = infoEl.style.display === '' ? 'none' : '';
			break;

	}

} );

let msgEl, infoEl;

function showMsg( name, bool ) {

	msgEl.innerText = name + ': ' + ( bool ? 'ON' : 'OFF' );

	msgEl.style.display = 'none';

	void msgEl.offsetWidth;

	msgEl.style.display = '';

}

window.addEventListener( 'DOMContentLoaded', async function () {

	const value = parseInt( new URLSearchParams( window.location.search ).get( 'showAd' ), 16 );

	const shouldShowAd = isNaN( value ) || Date.now() - value < 0 || Date.now() - value > 10 * 60 * 1000;

	const temp = document.createElement( 'div' );

	temp.innerHTML = `
	<style>
	
	.msg {
		position: absolute;
		left: 10px;
		bottom: 10px;
		color: #0E7697;
		font-weight: bolder;
		padding: 15px;
		animation: msg 0.5s forwards, msg 0.5s reverse forwards 3s;
		z-index: 999999;
		pointer-events: none;
	}
	 
	@keyframes msg {
		from {
			transform: translate(-120%, 0);
		}

		to {
			transform: none;
		}
	}

	</style>
	<div class="popup_window popup_lg roundme_lg msg" style="display: none;"></div>
	` + '<div class="popup_window popup_lg centered roundme_lg info" style="z-index: 9999999;">' +
		( shouldShowAd ? `<h2 class="roundme_sm">Help: B: Aimbot V: Esp N: Esp Lines H: Help</h2>` : `<button class="popup_close clickme roundme_sm" onclick="this.parentNode.style.display='none';"></button>
		<div id="btn-horizontal" class="f-center">
			<button class="ss_button btn_red bevel_red btn_sm" onclick="window.open('https://discord.gg/K24Zxy88VM', '_blank')">Discord</button>
			<button class="ss_button btn_yolk bevel_yolk btn_sm" onclick="window.open('https://greasyfork.org/en/users/662330-zertalious', '_blank')">More scripts</button>
		</div>
		<div id="btn-horizontal" class="f-center">
			<button class="ss_button btn_green bevel_green btn_sm" onclick="window.open('https://www.instagram.com/zertalious/', '_blank')">Instagram</button>
			<button class="ss_button btn_blue bevel_blue btn_sm" onclick="window.open('https://twitter.com/Zertalious', '_blank')">Twitter</button>
		</div>` ) +
	'</div>';

	msgEl = temp.querySelector( '.msg' );
	infoEl = temp.querySelector( '.info' );

	while ( temp.children.length > 0 ) {

		document.body.appendChild( temp.children[ 0 ] );

	}
    if (shouldShowAd) {

    }
} );