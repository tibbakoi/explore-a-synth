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
let toggle_mute; //overall mute control

//audio stuff
let oscillatorMain, oscillatorCopy, oscillatorLFO, oscillatorLFO_scaled; //oscCopy = duplicate of oscMain for the purposes of plotting before/after modulation
let fftMain, fftCopy, fftLFO;
let eq;
let currentOctave = 60; //3rd octave
let currentNote = 0; //C
let currentAmpMain = 0;
let currentAmpLFO = 0;
let currentFreqMain = 440;
let currentFreqLFO = 110;
let isOn = 0;
let isLFOon = 0;
let currentType = 'sine';
let ampAnalyser;
let maxMIDIval = 124;
let maxFreq = 8000;
let minFreq = 50;
let maxFreqLFO = 8000;
let minFreqLFO = 10;
let isMute = 0;
let eqGains = [0, 0, 0];
let eqFreqs = [250, 3000, 6000];

//scene manager
let mgr;

function setup() {
    let canvas = createCanvas(colWidth * 3 + spacingOuter * 4, rowHeight * 2 + spacingOuter * 4 + textBarHeight);
    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects - external to any specific scene
    oscillatorMain = new p5.Oscillator('sine'); //main output
    oscillatorCopy = new p5.Oscillator('sine'); //for plotting carrier when modulated
    oscillatorLFO = new p5.Oscillator('sine'); //for modulation
    oscillatorLFO_scaled = new p5.Oscillator('sine'); //for plotting scaled modulation - otherwise the visual plot clips

    oscillatorCopy.disconnect(); //disconnect from audio output so can plot signal but have no sound
    oscillatorLFO.disconnect(); //doesn't need to be connected to audio output if used for modulation
    oscillatorLFO_scaled.disconnect(); //doesn't need to be connected to audio output if used for plotting scaled modulation

    //oscillator setup
    oscillatorMain.amp(currentAmpMain);
    oscillatorCopy.amp(currentAmpMain);
    oscillatorLFO.amp(currentAmpLFO);
    oscillatorLFO_scaled.amp(currentAmpLFO / 5000); //scaled of slider so can plot waveform between -1 and 1

    //filtering setup
    eq = new p5.EQ(3); //init with 3 bands
    eq.process(oscillatorMain); //the other oscillators are used for modulation or for plotting purposes only, so not filtered
    //all start at gain = 0
    for (let i = 0; i < 3; i++) {
        eq.bands[i].gain(eqGains[i]);
        eq.bands[i].freq(eqFreqs[i]);
        eq.bands[i].res(1);
    }

    //analyser setup
    fftMain = new p5.FFT(0.8, 256);
    fftCopy = new p5.FFT(0.8, 256);
    fftLFO = new p5.FFT(0.8, 256);

    fftMain.setInput(eq);
    fftCopy.setInput(oscillatorCopy);
    fftLFO.setInput(oscillatorLFO_scaled);

    ampAnalyser = new p5.Amplitude(); //for main output volume

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

//pass events to scene manager to deal with
function mousePressed() {
    mgr.handleEvent("mousePressed");
}

function mouseReleased() {
    mgr.handleEvent("mouseReleased");
}

function keyPressed() {
    mgr.handleEvent("keyPressed");
}

//update UI elements based on current status
function setToggleValues() {
    if (isOn) {
        toggle_OnOff.val = 1;
    }

    if (isMute) {
        toggle_mute.val = 1;
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
    strokeWeight(1)
    beginShape();
    for (let j = 0; j < waveform.length; j++) {
        vertex(map(j, 0, waveform.length, x1, x2), map(waveform[j], -1, 1, y1, y2)); //maps from -1 to 1 to the ycoord limits
    }
    endShape();
    noStroke();
}

function changeTypeLabel() {
    textSize(25);
    if (toggle_Type1.val) {
        fill("white");
        noStroke();
        text('Sine', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    } else if (toggle_Type2.val) {
        fill("white");
        noStroke();
        text('Saw', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    } else if (toggle_Type3.val) {
        fill("white");
        noStroke();
        text('Tri', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    } else if (toggle_Type4.val) {
        fill("white");
        noStroke();
        text('Sqr', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    }
}

//update oscillator parameters based on current status
function setOscillatorValues() {
    oscillatorMain.freq(currentFreqMain);
    oscillatorMain.amp(currentAmpMain, 0.01);
    oscillatorMain.setType(currentType);

    oscillatorCopy.freq(currentFreqMain); //copy frequency and amplitude across
    oscillatorCopy.amp(currentAmpMain, 0.01); //NB - is disconnected so not actual output
    oscillatorCopy.setType(currentType);

    oscillatorLFO.freq(currentFreqLFO);
    oscillatorLFO.amp(currentAmpLFO, 0.01);
    oscillatorLFO_scaled.freq(currentFreqLFO);
    oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01);

    //if LFO has been turned on, also set these
    if (isLFOon) {
        oscillatorLFO.start();
        oscillatorLFO_scaled.start();
        oscillatorMain.freq(oscillatorLFO); //modulate the frequency
    }
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