// init stuff

//gui variables
let gui;
let colWidth = 300;
let rowHeight = 200;
let buttonHeight = 50;
let spacingOuter = 15;
let spacingInner = 5;

let toggle_OnOff; //power
let toggle_controlType; //enable playing by keyboard
let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 //osc type
let toggle_record; //record
let XY_freqAmp; //x-y control

//loudspeaker graphic
let currentWidth = 100;

//music stuff
let oscillator, fft, currentOctave, currentNote;

//recording stuff
let recordState = 0; //1 if recording
let saveState = 0; // 1 is file exists to save
let recorder, soundFile;
let button_Playback, button_Save;

function setup() {
    let canvas = createCanvas(colWidth * 3 + spacingOuter * 4, rowHeight * 2 + spacingOuter * 3);
    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects
    oscillator = new p5.Oscillator('sine');
    oscillator2 = new p5.Oscillator('sine'); //for modulation
    fft = new p5.FFT(0.8, 256);
    recorder = new p5.SoundRecorder(); //no input specified = records everything happening within the sketch
    soundFile = new p5.SoundFile();

    //UI objects using touchGUI library
    gui = createGui();

    toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter + spacingInner, buttonHeight, buttonHeight);
    toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1)
    toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
    toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
    toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

    XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, spacingOuter, colWidth, rowHeight, 0, 1, 1, 127);

    toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 2 + rowHeight + spacingInner, buttonHeight, buttonHeight)

    toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight)
    button_Playback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter, buttonHeight)
    button_Save = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter, buttonHeight)

    drawRectangles();

    //starting parameters
    currentOctave = 48; //default to 3rd octave
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
    drawLoudspeaker((spacingOuter * 3) + (colWidth * 2.25), (spacingOuter * 2) + (rowHeight * 1.5));

    drawGui();

    fill("white");
    textSize(25);
    textAlign(LEFT, CENTER);
    text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter + spacingInner + 25);
    text('Keyboard on/off', spacingOuter * 2 + spacingInner * 2 + colWidth + 50, spacingOuter * 2 + spacingInner + rowHeight + 25);
    textAlign(CENTER, CENTER);
    text('Record', spacingOuter * 3 + spacingInner * 2 + colWidth * 2.75, spacingOuter * 2 + spacingInner + rowHeight + 15);
    textAlign(LEFT, CENTER);

    noFill();

    drawRecordLED();

    //----- UI interactions -----//

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
        text('Sine', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    } else if (toggle_Type2.val) {
        fill("white");
        text('Saw', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    } else if (toggle_Type3.val) {
        fill("white");
        text('Tri', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    } else if (toggle_Type4.val) {
        fill("white");
        text('Sqr', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    }

    //frequency/amplitude control
    if (XY_freqAmp.isChanged) {
        oscillator.amp(XY_freqAmp.valX);
        oscillator.freq(midiToFreq(XY_freqAmp.valY));
    }

    //playing via keyboard(1=keyboard on)
    if (keyIsPressed) {
        if (toggle_controlType.val) { //only change frequency when keyboard input is enabled
            //if one of the numbers, change octave
            if (Number(key) > 0 && Number(key) < 8) {
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

    //turn recording on/off
    if (toggle_record.isPressed) {
        if (toggle_record.val) { // turned on
            recorder.record(soundFile);
        } else { //turned off having been turned on
            recorder.stop();
        }
    }
    // play recorded file, if exists
    if (button_Playback.isPressed && soundFile.duration() > 0) { //make sure sound file exists...
        soundFile.play();
    }
    //turn play button green when sound file is playing
    if (soundFile.isPlaying()) {
        button_Playback.setStyle({
            fillBg: color("green"),
        });
        console.log("playing")
    } else {
        button_Playback.setStyle({
            fillBg: color(130),
        });
    }
    // save recorded file, if exists
    if (button_Save.isPressed && soundFile.duration() > 0) { //make sure sound file exists...
        save(soundFile, 'MySoundFile.wav');
    }

    //get waveform
    let waveform = fft.waveform();
    // draw waveform
    drawWaveform(waveform);

}

//----- drawing things ----//

function drawRecordLED() {
    if (frameCount % 60 > 29 && toggle_record.val) { //flash on/off once a second
        fill("red");
        circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, height - buttonHeight * 3 - spacingOuter - spacingInner * 3 + 15, 20);
        noFill();
    } else {
        fill("darkred");
        circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, height - buttonHeight * 3 - spacingOuter - spacingInner * 3 + 15, 20);
        noFill();
    }
}

function drawRectangles() {
    let rounding = 10;
    stroke("black")
    rect(spacingOuter, spacingOuter, colWidth, rowHeight, rounding, rounding); //top left
    rect(spacingOuter, rowHeight + spacingOuter * 2, colWidth, rowHeight, rounding, rounding); //bottom left

    rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + rowHeight, colWidth, rowHeight, rounding, rounding); //bottom centre

    rect(colWidth * 2 + spacingOuter * 3, spacingOuter, colWidth, rowHeight, rounding, rounding); //top right

    rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 2, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
    rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 2, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right

    // perhaps some outer boxes to indicate different sections?
    // stroke("purple")
    // rect(spacingOuter - 2, spacingOuter - 2, colWidth + 4, rowHeight * 2 + 4 + spacingOuter, rounding, rounding)
}

function drawWaveform(waveform) {
    noFill();
    stroke("white")
    beginShape();
    // vertex(0, height);
    for (let j = 0; j < waveform.length; j++) {
        vertex(map(j, 0, waveform.length, colWidth * 2 + spacingOuter * 3, width - spacingOuter), map(waveform[j], -1, 1, rowHeight + spacingOuter - 1, spacingOuter + 1));
    }
    // vertex(width, height);
    endShape();
}

function drawLoudspeaker(x, y) {
    //centre of loudspeaker = x, y

    //change the value every 5 frames, if the synth is turned on
    if (frameCount % 3 == true && toggle_OnOff.val) {
        currentWidth = 100 + random(0, 10) * XY_freqAmp.valX * 4; //constant to give more change visually
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