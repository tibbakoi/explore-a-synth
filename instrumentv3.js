/*
Explore-a-Synth release v1.0.0

Instrument v3 (v1 and 2 are in archive folder of repo).
- Initialises global GUI variables and state variables
- Creates global audio objects
- Sets up SceneManager to manage different scenes that can be moved between
- Current state is stored to variables to allow passing of state between scenes
- Uses touchGUI for GUI elements (drawn to canvas, not DOM)

Author: Kat Young
https://github.com/tibbakoi
2020

*/

//Global GUI variables. Useful for calculating pixel locations within canvas.
let guiMain, guiSound, guiLoudspeaker;
let colWidth = 300;
let rowHeight = 200;
let buttonHeight = 50;
let spacingOuter = 10; //gap between cols and rows
let spacingInner = 5; //gap between edge of col/row and interior UI elements
let textBarHeight = 100; //smaller row at top for text

//Global audio objects

/* While this is a 2-oscillator FM system (carrier and modulator), 4 oscillators are created for plotting reasons:
oscillatorMain - carrier
oscillatorCopy - duplicate of oscillatorMain to allow plotting of carrier waveform without modulation during FM synthesis. Parameters changed whenever oscillatorMain is changed.
oscillatorLFO - modulator
oscillatorLFO_scaled - duplicate of oscillatorLFO to allow plotting of modulator waveform between -1 to 1 rather than -5000 to 5000 (the actual mod. depth). Parameters changed whenver oscillatorLFO is changed.
*/
let oscillatorMain, oscillatorCopy, oscillatorLFO, oscillatorLFO_scaled;

// As above, an additional fft is required to be able to plot the carrier waveform without modulation during FM synthesis.
let fftMain, fftCopy, fftLFO;
let eq;
let eqFreqs = [250, 3000, 6000];

// Frequency limits
let maxFreq = 8000;
let minFreq = 50;
let maxFreqLFO = 8000;
let minFreqLFO = 10;

// Global state variables
let isOn = 0;
let isLFOon = 0;
let isMute = 0;
let currentType = 'sine';
let currentAmpMain = 0;
let currentAmpLFO = 0;
let currentFreqMain = 440;
let currentFreqLFO = 110;
let eqGains = [0, 0, 0];
let currentNote, currentOctave = 60; // Start keyboard in 4th octave. currentNote gets assigned when key is pressed

// Scene manager
let mgr;

function setup() {
    // Create canvas with 3 columns, 2 rows (plus the top text bar) and spacing between each column and row
    let canvas = createCanvas(colWidth * 3 + spacingOuter * 4, rowHeight * 2 + spacingOuter * 4 + textBarHeight);
    canvas.parent('instrument'); //specifies which div to put the canvas in

    // Create p5 sound objects - external to any specific scene
    oscillatorMain = new p5.Oscillator('sine'); //main output
    oscillatorCopy = new p5.Oscillator('sine'); //for plotting carrier when modulated
    oscillatorLFO = new p5.Oscillator('sine'); //for modulation
    oscillatorLFO_scaled = new p5.Oscillator('sine'); //for plotting scaled modulation - otherwise the visual plot clips

    // Disconnect unneeded oscillators from sound output
    oscillatorCopy.disconnect();
    oscillatorLFO.disconnect();
    oscillatorLFO_scaled.disconnect();

    // Set oscillator amplitudes to 0 to prevent sound
    oscillatorMain.amp(0);
    oscillatorCopy.amp(0);
    oscillatorLFO.amp(0);
    oscillatorLFO_scaled.amp(0);

    // Set up filtering
    eq = new p5.EQ(3); //init EQ with 3 bands
    eq.process(oscillatorMain); //only need to process the carrier oscillator, not all oscillators
    for (let i = 0; i < 3; i++) {
        eq.bands[i].gain(0); //set gains to 0
        eq.bands[i].res(1); // set resonance to 1
        eq.bands[i].freq(eqFreqs[i]); //set centre frequencies
    }

    // Set up fft analysers with smoothing of 0.8 and 256 bins
    fftMain = new p5.FFT(0.8, 256);
    fftCopy = new p5.FFT(0.8, 256);
    fftLFO = new p5.FFT(0.8, 256);

    fftMain.setInput(eq);
    fftCopy.setInput(oscillatorCopy);
    fftLFO.setInput(oscillatorLFO_scaled); //analyse the scaled one so the plotted waveform is between -1 and 1 

    // Set up scene manager - add the three scenes and show the first one
    mgr = new SceneManager();
    mgr.addScene(mainScene);
    mgr.addScene(soundScene);
    mgr.addScene(loudspeakerScene);
    mgr.showScene(mainScene);

}

// SceneManager manages this for each separate scene, so draw is very sparse here
function draw() {
    background(84, 106, 118); //RGB colour
    mgr.draw();
}

// Pass mouse and keyboard events to SceneManager to deal with
function mousePressed() {
    mgr.handleEvent("mousePressed");
}

function mouseReleased() {
    mgr.handleEvent("mouseReleased");
}

function keyPressed() {
    mgr.handleEvent("keyPressed");
}

// Avoid autoplay in accordance with Chrome requirements
function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}

/*--- Functions that can be called from any scene ---*/

// Draw specified waveform as a line to specified region of canvas.
function drawWaveform(waveform, x1, x2, y1, y2) {
    //x1, x2 = left limit, right limit
    //y1, y2 = bottom limit, top limit
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

// Change the label next to type toggles based on which is currently selected.
function changeTypeLabel(val1, val2, val3, val4) {
    textSize(25);
    if (val1) {
        fill("white");
        noStroke();
        text('Sine', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    } else if (val2) {
        fill("white");
        noStroke();
        text('Saw', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    } else if (val3) {
        fill("white");
        noStroke();
        text('Tri', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    } else if (val4) {
        fill("white");
        noStroke();
        text('Sqr', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter * 2 + textBarHeight + spacingInner + buttonHeight + 25);
    }
}

// Update oscillator parameters based on current variables. Useful for ensuring consistency across scenes. 
function setOscillatorValues() {
    oscillatorMain.freq(currentFreqMain);
    oscillatorMain.amp(currentAmpMain, 0.01);
    oscillatorMain.setType(currentType);

    oscillatorCopy.freq(currentFreqMain);
    oscillatorCopy.amp(currentAmpMain, 0.01);
    oscillatorCopy.setType(currentType);

    oscillatorLFO.freq(currentFreqLFO);
    oscillatorLFO.amp(currentAmpLFO, 0.01);
    oscillatorLFO_scaled.freq(currentFreqLFO);
    oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01);

    //if LFO is on, also set these oscillator parameters
    if (isLFOon) {
        oscillatorLFO.start();
        oscillatorLFO_scaled.start();
        oscillatorMain.freq(oscillatorLFO); //modulate the frequency
    }
}

/// Prevent scrolling while using UI object on mobile
// Therefore can't do anything if is too wide - need to zoom to fit
function touchMoved() {
    // do some stuff
    return false;
}