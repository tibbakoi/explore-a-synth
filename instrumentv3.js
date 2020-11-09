//----- init stuff

//global gui variables
let guiMain, guiSound, guiLoudspeaker;
let colWidth = 300;
let rowHeight = 200;
let buttonHeight = 50;
let spacingOuter = 10;
let spacingInner = 5;
let textBarHeight = 100;

let toggle_OnOff; //power
let toggle_controlType; //enable playing by keyboard
let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 //osc type
let toggle_record; //record
let XY_freqAmp; //x-y control

//audio stuff
let oscillatorMain, oscillatorCopy, oscillatorLFO; //oscCopy = duplicate of oscMain for the purposes of plotting before/after modulation
let fftMain, fftCopy, fftLFO;
let currentOctave = 48; //3rd octave
let currentNote = 0; //C
let currentAmpMain = 0;
let currentAmpLFO = 0;
let currentFreqMain = 440;
let currentFreqLFO = 110;
let isOn = 0;
let isLFOon = 0;
let currentType = 'sine';

//scene manager
let mgr;

function setup() {
    let canvas = createCanvas(colWidth * 3 + spacingOuter * 4, rowHeight * 2 + spacingOuter * 4 + textBarHeight);
    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects - external to any specific scene
    oscillatorMain = new p5.Oscillator('sine');
    oscillatorCopy = new p5.Oscillator('sine');
    oscillatorLFO = new p5.Oscillator('sine'); //for modulation
    oscillatorCopy.disconnect(); //disconnect from audio output so can plot signal but have no sound
    oscillatorLFO.disconnect(); //doesn't need to be connected to audio output if used for modulation

    //oscillator setup
    oscillatorMain.amp(currentAmpMain);
    oscillatorCopy.amp(currentAmpMain);
    oscillatorLFO.amp(0);

    fftMain = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set
    fftCopy = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set
    fftLFO = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set

    fftMain.setInput(oscillatorMain);
    fftCopy.setInput(oscillatorCopy);
    fftLFO.setInput(oscillatorLFO);

    //set up scene manager
    mgr = new SceneManager();
    mgr.addScene(mainScene);
    mgr.addScene(soundScene);
    mgr.addScene(loudspeakerScene);

    mgr.showScene(mainScene); //first scene to load

}

function draw() {
    background(84, 106, 118);
    mgr.draw();
}

//pass mousePressed event to scene manager to deal with
function mousePressed() {
    mgr.handleEvent("mousePressed");
}

//pass mouseReleased event to scene manager to deal with
function mouseReleased() {
    mgr.handleEvent("mouseReleased");
}

function setToggleValues() {
    if (isOn) {
        toggle_OnOff.val = 1;
    }

    switch (currentType) {
        case 'sine':
            toggle_Type1.val = true;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            break;
        case 'sawtooth':
            toggle_Type1.val = false;
            toggle_Type2.val = true;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            break;
        case 'triangle':
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = true;
            toggle_Type4.val = false;
            break;
        case 'square':
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = true;
            break;

    }
}

function drawWaveform(waveform, x1, x2, y1, y2) {
    //x1, x2 = left, right
    //y1, y2 = bottom, top
    noFill();
    stroke("white")
    beginShape();
    // vertex(0, height);
    for (let j = 0; j < waveform.length; j++) {
        vertex(map(j, 0, waveform.length, x1, x2), map(waveform[j], -1, 1, y1, y2));
    }
    // vertex(width, height);
    endShape();
    noStroke();
}

// to avoid autoplay
function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}

/// Add these lines below sketch to prevent scrolling on mobile
function touchMoved() {
    // do some stuff
    return false;
}