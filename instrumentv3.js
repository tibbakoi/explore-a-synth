// init stuff

//gui variables
let gui;
let colWidth = 300;
let rowHeight = 200;
let buttonHeight = 50;
let spacingOuter = 10;
let spacingInner = 5;

let toggle_OnOff; //power
let toggle_controlType, toggle_sustain; //enable playing by keyboard, note sustain or separate
let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 //osc type
let toggle_record; //record
let XY_freqAmp; //x-y control

//loudspeaker graphic - needs to be defined so that draws when no sound playing
let currentWidth = 100;

//music stuff
let oscillator, oscillator2, fft, currentOctave, currentNote, env1;

//recording stuff
let recordState = 0; //1 if recording
let saveState = 0; // 1 is file exists to save
let recorder, soundFile;
let button_Playback, button_Save;

//scene manager buttons
let button_loudspeakerMore;

function setup() {
    let canvas = createCanvas(colWidth * 3 + spacingOuter * 4, rowHeight * 2 + spacingOuter * 3);
    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects
    oscillator = new p5.Oscillator('sine');
    oscillator2 = new p5.Oscillator('sine'); //for modulation
    env1 = new p5.Envelope(0.1, 0.6, 0.3, 0); // attack time, attack level, decay time, decay level
    fft = new p5.FFT(0.8, 256);
    recorder = new p5.SoundRecorder(); //no input specified = records everything happening within the sketch
    soundFile = new p5.SoundFile();

    //UI objects using touchGUI library
    gui = createGui();

    // sound settings toggles
    toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter + spacingInner, buttonHeight, buttonHeight);
    toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1)
    toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
    toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
    toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

    //X-Y pad
    XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, spacingOuter, colWidth, rowHeight, 0, 1, 1, 127);

    //keyboard toggles
    toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 2 + rowHeight + spacingInner, buttonHeight, buttonHeight)
    toggle_sustain = createCheckbox("sustain", spacingOuter * 2 + colWidth * 2 - spacingInner - buttonHeight, spacingOuter * 2 + rowHeight + spacingInner, buttonHeight, buttonHeight)

    //record UI
    toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight)
    button_Playback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter - spacingInner, buttonHeight)
    button_Save = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter - spacingInner, buttonHeight)

    // scene manager switch buttons
    button_loudspeakerMore = createButton("?", spacingOuter + colWidth * 2.5 - spacingInner * 3, height - spacingOuter - spacingInner - 25, 25, 25)

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

    drawKeyboard(0); //inactive keyboard
}

function draw() {
    background(100);
    //placeholders

    drawRectangles();
    drawLoudspeaker();
    drawRecordLED();

    drawGui();

    //various text bits
    fill("white");
    textSize(25);
    textAlign(LEFT, CENTER);
    text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter + spacingInner + 25);
    text('Keyboard', spacingOuter * 2 + spacingInner * 2 + colWidth + 50, spacingOuter * 2 + spacingInner + rowHeight + 25);
    textAlign(CENTER, CENTER);
    text('Record', spacingOuter * 3 + spacingInner * 2 + colWidth * 2.75, spacingOuter * 2 + spacingInner + rowHeight + 15);
    textAlign(LEFT, CENTER);
    text('Filtering and FX...?!', spacingOuter + spacingInner, spacingOuter + rowHeight * 1.5)
    noFill();

    //get and draw waveform
    drawWaveform(fft.waveform());

    //----- define UI interactions -----//

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
        noStroke();
        text('Sine', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    } else if (toggle_Type2.val) {
        fill("white");
        noStroke();
        text('Saw', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    } else if (toggle_Type3.val) {
        fill("white");
        noStroke();
        text('Tri', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    } else if (toggle_Type4.val) {
        fill("white");
        noStroke();
        text('Sqr', spacingOuter + spacingInner * 5 + buttonHeight * 4, spacingOuter + spacingInner + buttonHeight + 25);
    }

    //frequency/amplitude control
    if (XY_freqAmp.isChanged) {
        oscillator.amp(XY_freqAmp.valX, 0.01);
        oscillator.freq(midiToFreq(XY_freqAmp.valY));
    }

    // draw active keyboard
    if (toggle_controlType.val) {
        drawKeyboard(1); //active keyboard
    } else {
        drawKeyboard(0); //inactive keyboard
    }

    //playing via keyboard(1=keyboard on)
    if (keyIsPressed) {
        if (toggle_controlType.val) { //only change frequency when keyboard input is enabled
            //if one of the numbers, change octave
            if (Number(key) > 0 && Number(key) < 9) {
                currentOctave = (Number(key) + 1) * 12;
                playNote();
                drawOctaveIndicator(currentOctave);
            } else { //if one of the letters, change note
                switch (key) {
                    case "a": //C
                        currentNote = 0;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "w": //C#
                        currentNote = 1;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "s": //D
                        currentNote = 2;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "e": //D#
                        currentNote = 3;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "d": //E
                        currentNote = 4;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "f": //F
                        currentNote = 5;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "t": //F#
                        currentNote = 6;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "g": //G
                        currentNote = 7;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "y": //G#
                        currentNote = 8;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "h": //A
                        currentNote = 9;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "u": //A#
                        currentNote = 10;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "j": //B
                        currentNote = 11;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                    case "k": //C
                        currentNote = 12;
                        playNote();
                        drawKeyboardIndicator(currentNote);
                        break;
                }
            }
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
}

//----- musical functions -----//

function playNote() {
    XY_freqAmp.valY = currentNote + currentOctave;
    oscillator.freq(midiToFreq(XY_freqAmp.valY));
    if (toggle_sustain.val) {
        env1.play(oscillator); //play with envelope
    }
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

function drawLoudspeaker() {
    //centre of loudspeaker = x, y
    x = (spacingOuter * 3) + (colWidth * 2.25);;
    y = (spacingOuter * 2) + (rowHeight * 1.5);

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

function drawKeyboard(activeFlag) {
    let keyWidth = 36;
    let keyHeight = 50;
    let transparencyValue;

    stroke("grey")

    if (activeFlag) {
        transparencyValue = 255;
    } else {
        transparencyValue = 0.5 * 255;
    }
    // white keys
    fill(255, 255, 255, transparencyValue)
    for (let i = 0; i < 8; i++) {
        rect(spacingOuter * 2 + colWidth + spacingInner + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight * 1.75);
    }
    //black keys
    fill(0, 0, 0, transparencyValue)
    for (let i = 0; i < 2; i++) {
        rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight);
    }
    for (let i = 3; i < 6; i++) {
        rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight);
    }
    //octave boxes and numbers
    for (let i = 0; i < 8; i++) {
        fill(150, 150, 150, transparencyValue)
        rect(spacingOuter * 2 + colWidth + spacingInner + (i * keyWidth), height - spacingOuter - keyHeight * 2 - 30, keyWidth, 24);
        textSize(12);
        stroke("black");
        fill(15, 15, 15, transparencyValue);
        textAlign(CENTER)
        text(i + 1, spacingOuter * 2 + colWidth + spacingInner + (i * keyWidth) + keyWidth / 2, height - spacingOuter - keyHeight * 2 - 18);
        stroke("grey");
        textSize(25);
        textAlign(LEFT);
    }
    noFill();
}

function drawKeyboardIndicator(currentNote) {
    let whiteNoteOffsetVertical = 30;
    let blackNoteOffsetVertical = 70;
    let horizIncrement, verticalOffset;

    //calculate multiple of horiz increment for each note
    if (currentNote < 5) {
        horizIncrement = 1;
    } else if (currentNote > 4 && currentNote < 12) {
        horizIncrement = 2;
    } else {
        horizIncrement = 3;
    }

    //calculate y offset for each note
    if (currentNote == 1 || currentNote == 3 || currentNote == 6 || currentNote == 8 || currentNote == 10) {
        verticalOffset = blackNoteOffsetVertical;
    } else {
        verticalOffset = whiteNoteOffsetVertical;
    }

    x = spacingOuter * 2 + colWidth + spacingInner + 18 * (currentNote + horizIncrement); //18 = width of key/2
    y = height - spacingOuter - verticalOffset;

    fill("red");
    circle(x, y, 10);
    noFill();
}

function drawOctaveIndicator(currentOctave) {
    let activeOctave = currentOctave / 12 - 1;
    console.log(activeOctave)
    stroke("red");
    noFill();

    circle(spacingOuter * 2 + colWidth + spacingInner + ((activeOctave * 2) - 1) * 18, height - spacingOuter - 50 * 2 - 18, 15);

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