/**
 * A class representing a single voice in a polyphonic synthesizer.
 * Creates a fundamental oscillator and two harmonically related sawtooth oscillators,
 * and applies an ADSR amplitude envelope.
 */
export default class Voice {
  /**
   * @param {AudioContext} ctx - The audio context.
   * @param {number} freq - The base frequency of the oscillator in Hz.
   * @param {number} maxAmp - The maximum amplitude (typically between 0.0 and 1.0).
   * @param {AudioNode} out - The destination node to connect the voice to.
   */
  constructor(ctx, freq, maxAmp, out) {
    // Store constructor parameters
    this.context = ctx;
    this.frequency = freq;
    this.maxAmp = maxAmp;
    this.output = out;

    // ADSR envelope parameters (in seconds)
    this.attack = 0.02;
    this.decay = 0.01;
    this.sustain = 0.5;
    this.release = 0.5;
  }

  /**
   * Starts the voice — creates and starts oscillators, builds signal chain,
   * and initiates the attack and decay portions of the ADSR envelope.
   */
  start() {
    const now = this.context.currentTime;

    // Create main oscillator (sine wave by default)
    this.osc = this.context.createOscillator();
    this.osc.frequency.setValueAtTime(this.frequency, now);
    this.osc.onended = this.dispose.bind(this); // Auto-cleanup on stop

    // Create second oscillator (sawtooth at 2x frequency)
    this.osc2 = this.context.createOscillator();
    this.osc2.frequency.setValueAtTime(this.frequency * 2, now);
    this.osc2.type = "sawtooth";
    this.osc2scale = this.context.createGain();
    this.osc2scale.gain.value = 0.5;

    // Create third oscillator (sawtooth at 3x frequency)
    this.osc3 = this.context.createOscillator();
    this.osc3.frequency.setValueAtTime(this.frequency * 3, now);
    this.osc3.type = "sawtooth";
    this.osc3scale = this.context.createGain();
    this.osc3scale.gain.value = 0.5;

    // Create gain node for amplitude envelope
    this.ampEnv = this.context.createGain();
    this.ampEnv.gain.setValueAtTime(0, now); // Start silent

    // Signal routing
    this.osc.connect(this.ampEnv);
    this.osc2.connect(this.osc2scale);
    this.osc2scale.connect(this.ampEnv);
    this.osc3.connect(this.osc3scale);
    this.osc3scale.connect(this.ampEnv);
    this.ampEnv.connect(this.output);

    // Start oscillators
    this.osc.start();
    this.osc2.start();
    this.osc3.start();

    // Envelope: Attack → Decay
    this.ampEnv.gain.linearRampToValueAtTime(this.maxAmp, now + this.attack); // Attack
    this.ampEnv.gain.linearRampToValueAtTime(
        this.sustain * this.maxAmp,
        now + this.attack + this.decay
    ); // Decay
  }

  /**
   * Triggers the release phase of the ADSR envelope and stops oscillators.
   */
  stop() {
    const now = this.context.currentTime;

    // Cancel any scheduled ramps
    this.ampEnv.gain.cancelScheduledValues(now);

    // Set gain to current value to avoid jumps
    this.ampEnv.gain.setValueAtTime(this.ampEnv.gain.value, now);

    // Release: ramp down to 0
    this.ampEnv.gain.linearRampToValueAtTime(0, now + this.release);

    // Stop all oscillators slightly after release ends
    this.osc.stop(now + this.release + 0.01);
    this.osc2.stop(now + this.release + 0.01);
    this.osc3.stop(now + this.release + 0.01);
  }

  /**
   * Cleans up and disconnects all audio nodes once the sound has ended.
   */
  dispose() {
    // Disconnect everything
    this.osc.disconnect();
    this.osc2.disconnect();
    this.osc3.disconnect();
    this.osc2scale.disconnect();
    this.osc3scale.disconnect();
    this.ampEnv.disconnect();

    // Null references for garbage collection
    this.osc = null;
    this.osc2 = null;
    this.osc3 = null;
    this.osc2scale = null;
    this.osc3scale = null;
    this.ampEnv = null;
  }
}
