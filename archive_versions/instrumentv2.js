// init stuff
let gui, t;

let oscillator; //noise makers
let fft;
let toggle_OnOff; //power
let toggle_controlType; //enable playing by keyboard
let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 //osc type
let XY_freqAmp;

var currentOctave, currentNote;

function setup() {
    let canvas = createCanvas(400, 400);

    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects
    oscillator = new p5.Oscillator('sine');
    fft = new p5.FFT(0.8, 256);

    oscillator.amp(0.5);

    //UI objects using touchGUI library
    gui = createGui();

    toggle_OnOff = createCheckbox("OnOff", 10, 10);
    toggle_Type1 = createCheckbox("Sine", 10, 50, 30, 30, 1)
    toggle_Type2 = createCheckbox("Saw", 50, 50, 30, 30);
    toggle_Type3 = createCheckbox("Tri", 90, 50, 30, 30);
    toggle_Type4 = createCheckbox("Squ", 130, 50, 30, 30);
    XY_freqAmp = createSlider2d("freqAmp", width - 10 - 175, 10, 175, 175, 0, 1, 1, 127);
    toggle_controlType = createCheckbox("control", width - 10 - 175 - 30 - 10, 10)

    //starting parameters
    currentOctave = 60; //default to 4th octave
    currentNote = 0; //middle C
    XY_freqAmp.valX = 0; //amplitude at zero
    XY_freqAmp.valY = currentOctave + currentNote;

    oscillator.freq(midiToFreq(XY_freqAmp.valX));
    oscillator.amp(XY_freqAmp.valX)
    fft.setInput(oscillator);
    noFill();
    stroke('white');
}

function draw() {
    background(100);
    drawGui();

    // turn synth on/off
    if (toggle_OnOff.val) {
        if (!oscillator.started) { //to avoid repeatedly starting the oscillator
            oscillator.start();
        }
    } else {
        oscillator.stop();
    }

    // toggle between types - mutually exclusive
    if (toggle_Type1.isPressed) {
        toggle_Type2.val = false;
        toggle_Type3.val = false;
        toggle_Type4.val = false;
        oscillator.setType('sine');
    } else if (toggle_Type2.isPressed) {
        toggle_Type1.val = false;
        toggle_Type3.val = false;
        toggle_Type4.val = false;
        oscillator.setType('sawtooth');
    } else if (toggle_Type3.isPressed) {
        toggle_Type1.val = false;
        toggle_Type2.val = false;
        toggle_Type4.val = false;
        oscillator.setType('triangle');
    } else if (toggle_Type4.isPressed) {
        toggle_Type1.val = false;
        toggle_Type2.val = false;
        toggle_Type3.val = false;
        oscillator.setType('square');
    }

    //frequency/amplitude control
    if (XY_freqAmp.isChanged) {
        oscillator.amp(XY_freqAmp.valX);
        oscillator.freq(midiToFreq(XY_freqAmp.valY));
    }

    //playing via keyboard(1=keyboard on)
    if (keyIsPressed) {
        if (toggle_controlType.val) { //only change frequency when keyboard input is enabled
            if (Number(key) > 0 && Number(key) < 8) { //if one of the numbers, change octave
                currentOctave = (Number(key) + 1) * 12;
            } else { //if one of the letters, change note
                switch (key) {
                    case "a": //C
                        currentNote = 0;
                        break;
                    case "w": //C#
                        currentNote = 1;
                        break;
                    case "s": //D
                        currentNote = 2;
                        break;
                    case "e": //D#
                        currentNote = 3;
                        break;
                    case "d": //E
                        currentNote = 4;
                        break;
                    case "f": //F
                        currentNote = 5;
                        break;
                    case "t": //F#
                        currentNote = 6;
                        break;
                    case "g": //G
                        currentNote = 7;
                        break;
                    case "y": //G#
                        currentNote = 8;
                        break;
                    case "h": //A
                        currentNote = 9;
                        break;
                    case "u": //A#
                        currentNote = 10;
                        break;
                    case "j": //B
                        currentNote = 11;
                        break;
                }
            }
            XY_freqAmp.valY = currentNote + currentOctave;
            oscillator.freq(midiToFreq(XY_freqAmp.valY));
        }
    }

    //get waveform trace
    let waveform = fft.waveform();

    // draw waveform
    noFill();
    beginShape();
    // vertex(0, height);
    for (let j = 0; j < waveform.length; j++) {
        vertex(map(j, 0, waveform.length, 0, width), map(waveform[j], -1, 1, height / 2, height));
    }
    // vertex(width, height);
    endShape();

}

// to avoid autoplay
function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}