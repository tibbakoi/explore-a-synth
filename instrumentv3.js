// init stuff
let gui;
let colWidth, rowHeight;
let buttonWidth = 50;
let spacingOuter = 10;
let spacingInner = 5;

let oscillator; //noise makers
let fft;
let toggle_OnOff; //power
let toggle_controlType; //enable playing by keyboard
let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 //osc type
let toggle_record; //record
let XY_freqAmp; //x-y control for synth

//loudspeaker graphic
let currentWidth = 100;
let restingWidth = currentWidth;

var currentOctave, currentNote;

function setup() {
    let canvas = createCanvas(940, 430);
    colWidth = 300;
    rowHeight = 200;

    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects
    oscillator = new p5.Oscillator('sine');
    fft = new p5.FFT(0.8, 256);

    oscillator.amp(0.5);

    //UI objects using touchGUI library
    gui = createGui();

    toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter + spacingInner, buttonWidth, buttonWidth);
    toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonWidth, buttonWidth, buttonWidth, 1)
    toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonWidth, spacingOuter + spacingInner * 2 + buttonWidth, buttonWidth, buttonWidth, 0);
    toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonWidth * 2, spacingOuter + spacingInner * 2 + buttonWidth, buttonWidth, buttonWidth, 0);
    toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonWidth * 3, spacingOuter + spacingInner * 2 + buttonWidth, buttonWidth, buttonWidth, 0);
    XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, 10, colWidth, rowHeight, 0, 1, 1, 127);

    toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 2 + rowHeight + spacingInner, buttonWidth, buttonWidth)
    toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2 + spacingInner, spacingOuter * 2 + rowHeight + spacingInner, buttonWidth, buttonWidth)

    drawRectangles();

    //starting parameters
    currentOctave = 60; //default to 4th octave
    currentNote = 0; //middle C
    XY_freqAmp.valX = 0; //amplitude at zero
    XY_freqAmp.valY = currentOctave + currentNote;

    oscillator.freq(midiToFreq(XY_freqAmp.valY));
    oscillator.amp(XY_freqAmp.valX)
    fft.setInput(oscillator);
    noFill();
    stroke('white');
}

function draw() {
    background(100);
    //placeholders
    text('Filtering and FX...?!', spacingOuter + spacingInner, spacingOuter + rowHeight * 1.5)
    text('Piano keyboard...?!', spacingOuter * 2 + spacingInner + colWidth, spacingOuter + rowHeight * 1.5)

    drawRectangles();
    drawLoudspeaker((spacingOuter * 3) + (colWidth * 2.5), (spacingOuter * 2) + (rowHeight * 1.5) + 20);

    drawGui();

    fill("white");
    textSize(25);
    textAlign(LEFT, CENTER);
    text('Synth on/off', spacingOuter + spacingInner * 2 + 50, spacingOuter + spacingInner + 25);
    text('Keyboard on/off', spacingOuter * 2 + spacingInner * 2 + colWidth + 50, spacingOuter * 2 + spacingInner + rowHeight + 25);
    text('Record on/off', spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 50, spacingOuter * 2 + spacingInner + rowHeight + 25);
    noFill();

    drawRecordLED();

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

    //display osc type label
    if (toggle_Type1.val) {
        fill("white");
        text('Sine', spacingOuter + spacingInner * 5 + buttonWidth * 4, spacingOuter + spacingInner + buttonWidth + 25);
    } else if (toggle_Type2.val) {
        fill("white");
        text('Saw', spacingOuter + spacingInner * 5 + buttonWidth * 4, spacingOuter + spacingInner + buttonWidth + 25);
    } else if (toggle_Type3.val) {
        fill("white");
        text('Tri', spacingOuter + spacingInner * 5 + buttonWidth * 4, spacingOuter + spacingInner + buttonWidth + 25);
    } else if (toggle_Type4.val) {
        fill("white");
        text('Sqr', spacingOuter + spacingInner * 5 + buttonWidth * 4, spacingOuter + spacingInner + buttonWidth + 25);
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

    //get waveform
    let waveform = fft.waveform();
    // draw waveform
    drawWaveform(waveform);

}

function drawRecordLED() {
    if (frameCount % 60 > 29 && toggle_record.val) { //flash on/off once a second
        fill("red");
        circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, spacingOuter * 2 + spacingInner + rowHeight + 25, 20);
        noFill();
    } else {
        fill("darkred");
        circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, spacingOuter * 2 + spacingInner + rowHeight + 25, 20);
        noFill();
    }
}

function drawRectangles() {
    let rounding = 10;
    stroke("black")
    rect(spacingOuter, spacingOuter, colWidth, rowHeight, rounding, rounding); //top left
    rect(spacingOuter, rowHeight + spacingOuter * 2, colWidth, rowHeight, rounding, rounding); //bottom left

    rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + rowHeight, colWidth, rowHeight, rounding, rounding);

    rect(colWidth * 2 + spacingOuter * 3, spacingOuter, colWidth, rowHeight, rounding, rounding); //top right
    rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 2, colWidth, rowHeight, rounding, rounding); //bottom right
}

function drawWaveform(waveform) {
    noFill();
    stroke("white")
    beginShape();
    // vertex(0, height);
    for (let j = 0; j < waveform.length; j++) {
        vertex(map(j, 0, waveform.length, colWidth * 2 + spacingOuter * 3, width - spacingOuter), map(waveform[j], -1, 1, rowHeight + spacingOuter, spacingOuter));
    }
    // vertex(width, height);
    endShape();
}

function drawLoudspeaker(x, y) {
    //centre of loudspeaker = x, y

    //change the value every 5 frames, if the synth is turned on
    if (frameCount % 3 == true && toggle_OnOff.val) {
        currentWidth = restingWidth + random(0, 10) * XY_freqAmp.valX * 5; //constant to give more visually
    }

    //draw every frame still
    fill("grey");
    circle(x, y, currentWidth);
    fill("black")
    circle(x, y, currentWidth * 0.9)
    fill("grey")
    circle(x, y, currentWidth * 0.8)
    fill("black")
    circle(x, y, currentWidth * 0.4)
    noFill();

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