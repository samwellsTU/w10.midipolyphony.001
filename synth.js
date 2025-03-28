import Voice from "./Voice.js";

/**
 * @constant {AudioContext} mySynthCtx
 * @description The main WebAudio AudioContext for the synthesizer.
 */
const mySynthCtx = new AudioContext();

/**
 * @constant {Object} activeVoices
 * @description Stores currently active voices, indexed by MIDI note number.
 */
const activeVoices = {};

/**
 * @constant {GainNode} masterGain
 * @description Master gain control for the synth.
 */
const masterGain = mySynthCtx.createGain();
masterGain.gain.value = 0.125; // Set master volume

// Connect master gain to the audio output
masterGain.connect(mySynthCtx.destination);

/**
 * @function mtof
 * @description Converts a MIDI note number to its corresponding frequency in Hz.
 * @param {number} midi - The MIDI note number (e.g., 60 for C4).
 * @returns {number} The frequency in Hz.
 */
const mtof = function (midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * @function startNote
 * @description Starts a note by creating and storing a new Voice instance.
 * @param {number} note - The MIDI note number.
 */
const startNote = function (note) {
  if (!activeVoices[note]) {
    let someVoice = new Voice(mySynthCtx, mtof(note),Math.random(), masterGain);
    activeVoices[note] = someVoice;
    activeVoices[note].start(); //someVoice.start()
    console.log(activeVoices);
  }
};

/***
 * @function stopNote
 * @description Stops a currently playing note and removes it from activeVoices.
 * @param {number} note - The MIDI note number.
 */
const stopNote = function (note) {
  if (activeVoices[note]) {
    activeVoices[note].stop();
    delete activeVoices[note];
    console.log(activeVoices);
  }
};

/**
 * @constant {Object} noteMap
 * @description Maps keyboard keys to MIDI note numbers.
 */
const noteMap = {
  a: 60, // C4
  w: 61, // C#4 / Db4
  s: 62, // D4
  e: 63, // D#4 / Eb4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4 / Gb4
  g: 67, // G4
  y: 68, // G#4 / Ab4
  h: 69, // A4 (440 Hz)
  u: 70, // A#4 / Bb4
  j: 71, // B4
  k: 72, // C5
  o: 73, // C#5 / Db5
  l: 74, // D5
  p: 75, // D#5 / Eb5
  ";": 76, // E5
};

/**
 * @event keydown
 * @description Listens for keydown events and starts a note if the key is mapped.
 */
document.addEventListener("keydown", (e) => {
  if (noteMap[e.key]) {
    startNote(noteMap[e.key]);
  }
});

/**
 * @event keyup
 * @description Listens for keyup events and stops a note if the key is mapped.
 */
document.addEventListener("keyup", (e) => {
  if (noteMap[e.key]) {
    stopNote(noteMap[e.key]);
  }
});

// let someNewSpecialVoice = new Voice(mySynthCtx, 440, masterGain);
