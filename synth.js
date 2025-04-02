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

//add filter
const lpFilter = mySynthCtx.createBiquadFilter();
lpFilter.type = "lowpass";
lpFilter.frequency.value = 1000;
lpFilter.Q.value = 20;

// Connect master gain to the audio output
masterGain.connect(lpFilter);
lpFilter.connect(mySynthCtx.destination);

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
const startNote = function (note, velocity) {
  let noteAmp = velocity / 127;
  noteAmp = Math.pow(noteAmp, 3);

  if (!activeVoices[note]) {
    let someVoice = new Voice(
      mySynthCtx, //audio context
      mtof(note), //converted midi note to freqency
      noteAmp, //some randome value (0.-1) for max Amplitude
      masterGain //output node to connect to
    );
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

const midiCC = function (ccNum, val) {
  switch (ccNum) {
    case 79:
      masterGain.gain.linearRampToValueAtTime(
        val / 127,
        mySynthCtx.currentTime + 0.2
      );
      break;
    case 78:
      lpFilter.frequency.linearRampToValueAtTime(
        val * 20,
        mySynthCtx.currentTime + 0.02
      );
      break;

    case 77:
      break;
  }
};

const midiParser = function (midiEvent) {
  let statusByte = midiEvent.data[0];
  // if (statusByte != 248) {
  //   console.log(midiEvent.data);
  // }
  let command = statusByte & 0xf0; //0b11110000;
  // console.log(command);
  let channel = statusByte & 0xf; //0b00001111;
  let data1;
  let data2;

  switch (
    command //Parse different types of MIDI messages by Command
  ) {
    //-------------------------Note Off Messages------------------------------
    case 0x80:
      console.log("noteOff", midiEvent.data[1], midiEvent.data[2]);
      data1 = midiEvent.data[1]; //note number
      data2 = midiEvent.data[2]; //velocity

      stopNote(noteNum);
      break;
    //-------------------------------Note ON-----------------------------------
    case 0x90:
      data1 = midiEvent.data[1]; //note number
      data2 = midiEvent.data[2]; //velocity

      console.log("noteON", data1, data2);

      //check if velocity is not zero
      if (data2 > 0) {
        startNote(data1, data2);
      } else {
        stopNote(data1);
      }

      break;

    //-------------------------------Polyphonic Aftertouch---------------------
    case 0xa0:
      console.log("PolyAftertouch", midiEvent.data[1], midiEvent.data[2]);
      break;
    //-----------------------------control change---------------------------
    case 0xb0:
      midiCC(midiEvent.data[1], midiEvent.data[2]);
      break;
    //-----------------------------program change---------------------------
    case 0xc0:
      console.log("Program Change", midiEvent.data[1], midiEvent.data[2]);
      break;
    //-----------------------------channel aftertouch change---------------------------
    case 0xd0:
      console.log("Channel Aftertouch", midiEvent.data[1], midiEvent.data[2]);
      break;

    case 0xe0:
      console.log("PitchBend", midiEvent.data[1], midiEvent.data[2]);
      break;
  }
};

const onMIDIsuccess = function (midiInfo) {
  // console.log(midiInfo.inputs.values());
  for (let myMidiIn of midiInfo.inputs.values()) {
    myMidiIn.onmidimessage = midiParser;
  }
};

navigator.requestMIDIAccess().then(onMIDIsuccess);
