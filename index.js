const MAJ = 'maj';
const MIN = 'min';
const notes = {
	'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
	'E': 4,'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
	'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function neighbors(chord) {
	if (chord.quality == MAJ) {
		return [
			//{ root: (chord.root) % 12, quality: MIN },
			{ root: (chord.root + 4) % 12, quality: MIN },
			{ root: (chord.root + 9) % 12, quality: MIN },
		]
	} else {
		return [
			//{ root: (chord.root) % 12, quality: MAJ },
			{ root: (chord.root + 3) % 12, quality: MAJ },
			{ root: (chord.root + 8) % 12, quality: MAJ },
		]
	}
}

function shortestPath(src, dst) {
	let q = [src]
	let final = null;
	let seen = [];
	let back = {};

	// do bfs
	while (q.length) {
		let curr = q.shift();
		let currstr = JSON.stringify(curr);
		if (curr.root == dst.root && curr.quality == dst.quality) {
			final = curr;
			break;
		}
		neighbors(curr).forEach(nb => {
			let nbstr = JSON.stringify(nb);
			if (!seen.includes(nbstr)) {
				q.push(nb);
				seen.push(nbstr);
				back[nbstr] = currstr;
			}
		});
	}

	// follow prev pointers backwards to find path
	let path = [dst];
	let srcstr = JSON.stringify(src);
	let nodestr = JSON.stringify(dst);
	while (nodestr != srcstr) {
		nodestr = back[nodestr];
		path.unshift(JSON.parse(nodestr));
	}

	return path; å
}

function inputStringToChord(string) {
	[rootStr, quality] = string.split(' ');
	return { root: notes[rootStr], quality }
}

function pathToString(pathå) {
	return path
		.map(chord => getKeyByValue(notes, chord.root) + ' ' + chord.quality)
		.join('&nbsp; → &nbsp;')
}

function findPath() {
	src = inputStringToChord(document.getElementById("src").value);
	dst = inputStringToChord(document.getElementById("dst").value);
	path = shortestPath(src, dst);
	document.getElementById("path-text").innerHTML = pathToString(path);
}
