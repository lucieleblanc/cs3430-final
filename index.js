let audioCtx;
let osc = [];
let gainNode;

const MAJ = 'maj';
const MIN = 'min';
const notes = {
	'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
	'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
	'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function neighbors(chord) {
	let arr = []
	if (chord.quality == MAJ) {
		arr = [
			{ root: (chord.root) % 12, quality: MIN },
			{ root: (chord.root + 4) % 12, quality: MIN },
			{ root: (chord.root + 9) % 12, quality: MIN },
		]
	} else {
		arr = [
			{ root: (chord.root) % 12, quality: MAJ },
			{ root: (chord.root + 3) % 12, quality: MAJ },
			{ root: (chord.root + 8) % 12, quality: MAJ },
		]
	}
	const rand = Math.floor(Math.random() * 3);
	arr.splice(rand, 1)
	return arr
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
	let dststr = JSON.stringify(dst)
	let nodestr = dststr;
	while (nodestr != srcstr) {
		nodestr = back[nodestr];
		if (nodestr == undefined) {
			return shortestPath(src, dst);
		}
		path.unshift(JSON.parse(nodestr));
	}

	if (srcstr != dststr && path.length <= 2) {
		return shortestPath(src, dst);
	}

	return path;
}

function inputStringToChord(string) {
	[rootStr, quality] = string.split(' ');
	return { root: notes[rootStr], quality }
}

function pathToString(path) {
	return path
		.map(chord => getKeyByValue(notes, chord.root) + ' ' + chord.quality)
		.join('&nbsp; --> &nbsp;')
}

function findPath() {
	src = inputStringToChord(document.getElementById("src").value);
	dst = inputStringToChord(document.getElementById("dst").value);
	path = shortestPath(src, dst);
	document.getElementById("path-text").innerHTML = pathToString(path);

	if (audioCtx) {
		gainNode.gain.value = 0.2;
	} else {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)
		gainNode = audioCtx.createGain();
		for (let i = 0; i < 3; i++) {
			osc.push(audioCtx.createOscillator());
			osc[i].type = "triangle"
			osc[i].connect(gainNode)
			osc[i].start()
			console.log("Initializing osc[" + i + "]")
		}
		gainNode.gain.value = 0.2;
		gainNode.connect(audioCtx.destination);
	}

	playLine(path)
}

// ----- AUDIO ----- //

const middleC = 60;
const noteDuration = 0.8; // in seconds

function getNotes(chord) {
	let notes = [chord.root]
	notes.push((chord.root + 7) % 12)

	if (chord.quality == MAJ) {
		notes.push((chord.root + 4) % 12)
	} else {
		notes.push((chord.root + 3) % 12)
	}
	return transpose(notes)
}

function transpose(noteList) {
	return noteList.map(note => note + middleC);
}

function midiToFreq(m) {
	return Math.pow(2, (m - 69) / 12) * 440;
}

function playLine(path) {
	let startTime = audioCtx.currentTime
	for (var i = 0; i < path.length; i++) {
		noteList = getNotes(path[i])
		playChord(noteList, startTime + i * noteDuration)
	}
	for (var i = 0; i < 3; i++) {
		gainNode.gain.setValueAtTime(0, startTime + path.length * noteDuration)
	}
}

function playChord(noteList, offset) {
	console.log("Chord: " + noteList)
	for (var i = 0; i < noteList.length; i++) {
		playNote(noteList[i], offset, i);
	}
}

function playNote(midiPitch, offset, oscIndex) {
	osc[oscIndex].frequency.setTargetAtTime(midiToFreq(midiPitch), offset, 0.001)
	gainNode.gain.exponentialRampToValueAtTime(0.01, offset) // start attack
	gainNode.gain.exponentialRampToValueAtTime(0.2, offset + 0.01)  // end attack
	gainNode.gain.exponentialRampToValueAtTime(0.17, offset + 0.05)  // decay 
	gainNode.gain.setValueAtTime(0.17, offset + 0.765)				 // start release
	gainNode.gain.exponentialRampToValueAtTime(0.01, offset + 0.8) // end release	
}

