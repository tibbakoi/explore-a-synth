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
let oscillatorMain, oscillatorCopy, oscillatorLFO, oscillatorLFO_scaled; //oscCopy = duplicate of oscMain for the purposes of plotting before/after modulation
let fftMain, fftCopy, fftLFO;
let currentOctave = 60; //3rd octave
let currentNote = 0; //C
let currentAmpMain = 0.01; //main volume doesnt go to zero
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
    oscillatorMain = new p5.Oscillator('sine'); //main output
    oscillatorCopy = new p5.Oscillator('sine'); //for plotting carrier when modulated
    oscillatorLFO = new p5.Oscillator('sine'); //for modulation
    oscillatorLFO_scaled = new p5.Oscillator('sine'); //for plotting scaled modulation

    oscillatorCopy.disconnect(); //disconnect from audio output so can plot signal but have no sound
    oscillatorLFO.disconnect(); //doesn't need to be connected to audio output if used for modulation
    oscillatorLFO_scaled.disconnect(); //doesn't need to be connected to audio output if used for plotting scaled modulation

    //oscillator setup
    oscillatorMain.amp(currentAmpMain);
    oscillatorCopy.amp(currentAmpMain);
    oscillatorLFO.amp(currentAmpLFO);
    oscillatorLFO_scaled.amp(currentAmpLFO / 5000); //is scale of slider

    fftMain = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set
    fftCopy = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set
    fftLFO = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set

    fftMain.setInput(oscillatorMain);
    fftCopy.setInput(oscillatorCopy);
    fftLFO.setInput(oscillatorLFO_scaled);

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
        vertex(map(j, 0, waveform.length, x1, x2), map(waveform[j], -1, 1, y1, y2)); //maps from -1 to 1 to the ycoord limits
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

//---- SCENES -----//
// main instrument scene
function mainScene() {
    let button_loudspeakerMore, button_soundMore;
    let waveform = 0;
    let slider_gain;
    let button_helpMode_sound, button_helpMode_input, button_helpMode_output;
    let helpMode_sound = 0;
    let helpMode_input = 0;
    let helpMode_output = 0;
    let loudspeakerWidth = 100;
    let loudspeakerX = (spacingOuter * 3) + (colWidth * 2.25);;
    let loudspeakerY = (spacingOuter * 3) + (rowHeight * 1.5) + textBarHeight;
    let ampAnalyser;
    let recorder, soundFile;
    let button_Playback, button_Save;
    let envMain;

    this.setup = function() {

        //UI objects using touchGUI library
        guiMain = createGui();

        // sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter * 2 + spacingInner + textBarHeight, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 1);
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 0);

        //X-Y pad
        XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, 0, 1, 1, 127);
        XY_freqAmp.setStyle({
            strokeBg: color(0, 196, 154),
            strokeBgHover: color(0, 196, 154),
            strokeBgActive: color(0, 196, 154)
        });

        //keyboard toggles
        toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 3 + rowHeight + spacingInner + textBarHeight, buttonHeight, buttonHeight);

        //record UI
        toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight);
        button_Playback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);
        button_Save = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);

        // scene manager switch buttons
        button_loudspeakerMore = createButton("More", spacingOuter * 3 + colWidth * 2.5 - spacingInner * 2 - 55, height - spacingOuter - spacingInner - 26, 55, 26);
        button_soundMore = createButton("More", spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);

        //help mode buttons
        button_helpMode_sound = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_input = createButton("?", spacingOuter * 2 + colWidth * 2 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_output = createButton("?", spacingOuter * 3 + colWidth * 3 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        //audio things
        ampAnalyser = new p5.Amplitude();
        recorder = new p5.SoundRecorder(); //no input specified = records everything happening within the sketch
        soundFile = new p5.SoundFile();
        envMain = new p5.Envelope(0.01, 1, 0.3, 0); // attack time, attack level, decay time, decay level

        //master volume slider - set to currentAmpMain
        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0.01, 1);

        //starting parameters - looks recursive but means everything has the correct values on load
        XY_freqAmp.valX = 1; //amplitude at 1
        XY_freqAmp.valY = freqToMidi(currentFreqMain);
        slider_gain.val = currentAmpMain;

        oscillatorMain.freq(currentFreqMain);
        oscillatorMain.amp(currentAmpMain, 0.01);

        oscillatorCopy.freq(currentFreqMain); //copy frequency and amplitude across
        oscillatorCopy.amp(currentAmpMain, 0.01); //NB - is disconnected so not actual output

        oscillatorLFO.freq(currentFreqLFO);
        oscillatorLFO.amp(currentAmpLFO, 0.01);
        oscillatorLFO_scaled.freq(currentFreqLFO);
        oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01);

        noFill();
        stroke('white');

        //set toggle values based on state of oscillators
        setToggleValues();

    };

    this.enter = function() {
        this.setup();
    };

    this.draw = function() {

        //---- figure out whether in help mode or not, change button style ----//
        //sound section
        if (button_helpMode_sound.isPressed && helpMode_sound == 0) { //if button pressed to turn on 
            helpMode_sound = 1;
            button_helpMode_sound.setStyle({
                fillBg: color("lightgray"),
            });
        } else if (button_helpMode_sound.isPressed && helpMode_sound == 1) { //if button pressed to turn off
            helpMode_sound = 0;
            button_helpMode_sound.setStyle({
                fillBg: color(130),
            });
        }
        //input section
        if (button_helpMode_input.isPressed && helpMode_input == 0) { //if button pressed to turn on 
            helpMode_input = 1;
            button_helpMode_input.setStyle({
                fillBg: color("lightgray"),
            });
        } else if (button_helpMode_input.isPressed && helpMode_input == 1) { //if button pressed to turn off
            helpMode_input = 0;
            button_helpMode_input.setStyle({
                fillBg: color(130),
            });
        }
        //output section
        if (button_helpMode_output.isPressed && helpMode_output == 0) { //if button pressed to turn on 
            helpMode_output = 1;
            button_helpMode_output.setStyle({
                fillBg: color("lightgray"),
            });
        } else if (button_helpMode_output.isPressed && helpMode_output == 1) { //if button pressed to turn off
            helpMode_output = 0;
            button_helpMode_output.setStyle({
                fillBg: color(130),
            });
        }

        //----- draw stuff -----//
        drawRectangles();
        drawLoudspeaker(loudspeakerX, loudspeakerY);
        drawRecordLED();
        drawGui();

        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > (spacingOuter * 2 + textBarHeight) && mouseY < (spacingOuter * 2 + textBarHeight + rowHeight))) {
            waveform = fftMain.waveform();
        }
        drawWaveform(waveform, colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + textBarHeight + spacingOuter * 2 - 1, spacingOuter * 2 + 1 + textBarHeight);

        //various text bits
        fill("white");
        textSize(25);
        textAlign(LEFT, CENTER);
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Keyboard', spacingOuter * 2 + spacingInner * 2 + colWidth + 50, spacingOuter * 3 + textBarHeight + spacingInner + rowHeight + 25);
        textAlign(CENTER, CENTER);
        text('Record', spacingOuter * 3 + spacingInner * 2 + colWidth * 2.75, spacingOuter * 3 + textBarHeight + spacingInner + rowHeight + 15);
        textAlign(LEFT, CENTER);
        text('Filtering and FX...?!', spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + rowHeight * 1.5);
        textSize(18)
        text(round(slider_gain.val * 100) + "%", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 15)
        textSize(25)

        //explainer boxes
        textAlign(CENTER, CENTER)
        text("This is where we design the sound.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is where our inputs control the sound.", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is where the output sound is represented.", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter + spacingInner, colWidth - spacingInner, textBarHeight);
        textAlign(LEFT, CENTER);
        noFill();

        //display osc type label based on which toggle is active
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

        // draw active/inactive keyboard
        if (toggle_controlType.val) {
            drawKeyboard(1); //active keyboard
        } else {
            drawKeyboard(0); //inactive keyboard
        }

        //----- pop up hover over boxes if help mode on - draw on top of everything else
        if (helpMode_sound) {
            if (toggle_OnOff._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 80, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Turn on and off here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (toggle_Type1._hover || toggle_Type2._hover || toggle_Type3._hover || toggle_Type4._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the shape of the wave here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_gain._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the main volume here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (button_soundMore._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Explore more here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (mouseY > spacingOuter * 3 + textBarHeight + rowHeight && mouseX < spacingOuter + colWidth) { // placeholder for filtering/FX box
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter + colWidth / 2, spacingOuter + textBarHeight + rowHeight * 1.5, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Placeholder for things to come....", spacingOuter + colWidth / 2, spacingOuter + textBarHeight + rowHeight * 1.5, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
        }
        if (helpMode_input) {
            if (XY_freqAmp._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter + spacingInner + colWidth * 1.5, spacingOuter * 2 + textBarHeight + rowHeight * 0.5, colWidth - spacingInner * 2, rowHeight - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change frequency and volume at the same time here. Left-right is volume (up to the value on the main volume slider) and up-down is frequency", spacingOuter + spacingInner + colWidth * 1.5, spacingOuter * 2 + textBarHeight + rowHeight * 0.5, colWidth - spacingInner * 2, rowHeight - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (toggle_controlType._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter + spacingInner + colWidth * 1.5, spacingOuter * 2 + textBarHeight + rowHeight * 0.5, colWidth - spacingInner * 2, rowHeight - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Turn this on to enable playing the sound with the letters on your computer keyboard. Numbers change the octave.", spacingOuter + spacingInner + colWidth * 1.5, spacingOuter * 2 + textBarHeight + rowHeight * 0.5, colWidth - spacingInner * 2, rowHeight - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)

                drawKeyboardHelp();

                textAlign(LEFT, CENTER)
            }
        }
        if (helpMode_output) {
            if (mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > (spacingOuter * 2 + textBarHeight) && mouseY < (spacingOuter * 2 + textBarHeight + rowHeight)) { //if within area where waveform is drawn
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter * 3 + spacingInner + colWidth * 2.5, spacingOuter * 2 + textBarHeight + rowHeight * 0.25, colWidth - spacingInner * 2, rowHeight / 2 - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("The waveform is plotted here. Click to pause it.", spacingOuter * 3 + spacingInner + colWidth * 2.5, spacingOuter * 2 + textBarHeight + rowHeight * 0.25, colWidth - spacingInner * 2, rowHeight - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (toggle_record._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 2 - spacingInner * 2, rowHeight / 2 - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Turn this on to record the sound", spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 2 - spacingInner * 2, rowHeight - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (button_Playback._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 2 - spacingInner * 2, rowHeight / 2 - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Click here to play the recording", spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 2 - spacingInner * 2, rowHeight - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (button_Save._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 2 - spacingInner * 2, rowHeight / 2 - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Click here to save the recording", spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 2 - spacingInner * 2, rowHeight - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (button_loudspeakerMore._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(spacingOuter * 3 + spacingInner + colWidth * 2.25, spacingOuter * 2 + textBarHeight + rowHeight * 0.75, colWidth / 1.5 - spacingInner * 2, rowHeight / 1.5 - spacingInner * 2, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Learn more about loudspeakers here", spacingOuter * 3 + spacingInner + colWidth * 2.25, spacingOuter * 2 + textBarHeight + rowHeight * 0.70, colWidth / 1.5 - spacingInner * 2, rowHeight / 1.5 - spacingInner * 2)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
        }

        //----- define UI interactions -----//
        // turn synth on/off
        if (toggle_OnOff.val) {
            if (!oscillatorMain.started) { //to avoid repeatedly starting the oscillator
                oscillatorMain.start();
                oscillatorCopy.start();
                isOn = 1; //for transferring between scenes
            }
        } else {
            oscillatorMain.stop();
            oscillatorCopy.stop();
            isOn = 0;
        }

        // toggle between types - mutually exclusive
        if (toggle_Type1.isPressed) {
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sine';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type2.isPressed) {
            toggle_Type1.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sawtooth';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type3.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type4.val = false;
            currentType = 'triangle';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type4.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            currentType = 'square';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        }

        //X-Y frequency/amplitude control - only when keyboard isn't enabled - otherwise too many amplitude values at once
        if (XY_freqAmp.isChanged && !toggle_controlType.val) {
            //store values
            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
            currentFreqMain = midiToFreq(XY_freqAmp.valY);
            //set osc variables
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
            oscillatorMain.freq(currentFreqMain);
            oscillatorCopy.freq(currentFreqMain);
        }

        //slider amplitude control
        if (slider_gain.isChanged) {
            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
        }

        //if in keyboard board, multiply the envelope when slider val changes
        if (toggle_controlType.val) {
            envMain.mult(slider_gain.val);
        }

        //if turning keyboard mode off, set gain back to current gain value
        if (toggle_controlType.isPressed && !toggle_controlType.val) {
            oscillatorMain.amp(currentAmpMain);
            oscillatorCopy.amp(currentAmpMain);
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
        } else {
            button_Playback.setStyle({
                fillBg: color(130),
            });
        }

        // save recorded file, if exists
        if (button_Save.isPressed && soundFile.duration() > 0) { //make sure sound file exists...
            save(soundFile, 'MySoundFile.wav');
        }

        //----- scene switch buttons ----//
        if (button_soundMore.isPressed) {
            mgr.showScene(soundScene);
        }

        if (button_loudspeakerMore.isPressed) {
            mgr.showScene(loudspeakerScene);
        }
    };

    //----- musical functions -----//
    function playNote() {
        currentFreqMain = midiToFreq(currentNote + currentOctave);
        oscillatorMain.freq(currentFreqMain);
        oscillatorCopy.freq(currentFreqMain);
        envMain.play(oscillatorMain); //play with envelope
        //NB - all other osc are disconnected, and putting through env sets amp to 0 on them, so are not touched here
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
        strokeWeight(2);
        //sound
        stroke(255, 193, 84);
        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //sound top
        rect(spacingOuter, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding); //sound bottom

        stroke(0, 196, 154)
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter * 2 + colWidth, spacingOuter * 3 + rowHeight + textBarHeight, colWidth, rowHeight, rounding, rounding); //keyboard

        stroke(88, 44, 77)
        rect(spacingOuter * 3 + colWidth * 2, spacingOuter, colWidth, textBarHeight, rounding, rounding)

        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //waveform

        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right


        // perhaps some outer boxes to indicate different sections?
        // stroke("purple")
        // rect(spacingOuter - 2, spacingOuter - 2, colWidth + 4, rowHeight * 2 + 4 + spacingOuter, rounding, rounding)
    }

    function drawLoudspeaker(x, y) {
        strokeWeight(1)
        stroke(0)
            //centre of loudspeaker = x, y
        var ampLevel = ampAnalyser.getLevel(); //amplitude of output - not value on a UI element

        //change the value based on the master output level every 3 frames, if the synth is turned on
        // if amplitude is 0 on either control, currentWidth = 100
        if (frameCount % 3 == true && toggle_OnOff.val) {
            loudspeakerWidth = 100 + random(0, 10) * ampLevel * 4; //*4 to give more visual change
        }

        //draw 
        fill("grey");
        circle(x, y, loudspeakerWidth);
        fill("black");
        circle(x, y, loudspeakerWidth * 0.9);
        fill("grey");
        circle(x, y, loudspeakerWidth * 0.8);
        fill("black");
        circle(x, y, loudspeakerWidth * 0.4);
        noFill();

    }

    function drawKeyboard(activeFlag) {
        let keyWidth = 36;
        let keyHeight = 50;
        let transparencyValue;

        stroke("grey");

        if (activeFlag) {
            transparencyValue = 255;
        } else {
            transparencyValue = 0.5 * 255;
        }
        // white keys
        fill(255, 255, 255, transparencyValue);
        for (let i = 0; i < 8; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight * 1.75);
        }
        //black keys
        fill(0, 0, 0, transparencyValue);
        for (let i = 0; i < 2; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight);
        }
        for (let i = 3; i < 6; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight);
        }
        //octave boxes and numbers
        for (let i = 0; i < 8; i++) {
            fill(150, 150, 150, transparencyValue);
            rect(spacingOuter * 2 + colWidth + spacingInner + (i * keyWidth), height - spacingOuter - keyHeight * 2 - 30, keyWidth, 24);
            textSize(12);
            stroke("black");
            fill(15, 15, 15, transparencyValue);
            textAlign(CENTER);
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

    function drawKeyboardHelp() {
        let whiteNoteOffsetVertical = 30;
        let blackNoteOffsetVertical = 70;
        let horizIncrement, verticalOffset;
        letters = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k"];

        for (let j = 0; j < 13; j++) {

            //calculate multiple of horiz increment for each note
            if (j < 5) {
                horizIncrement = 1;
            } else if (j > 4 && j < 12) {
                horizIncrement = 2;
            } else {
                horizIncrement = 3;
            }

            //calculate y offset for each note
            if (j == 1 || j == 3 || j == 6 || j == 8 || j == 10) {
                verticalOffset = blackNoteOffsetVertical;
            } else {
                verticalOffset = whiteNoteOffsetVertical;
            }

            x = spacingOuter * 2 + colWidth + spacingInner + 18 * (j + horizIncrement); //18 = width of key/2
            y = height - spacingOuter - verticalOffset;

            fill(34, 43, 48)
            text(letters[j], x, y, 10);
            noFill();
        }
    }

    function drawOctaveIndicator(currentOctave) {
        let activeOctave = currentOctave / 12 - 1;
        stroke("red");
        noFill();

        circle(spacingOuter * 2 + colWidth + spacingInner + ((activeOctave * 2) - 1) * 18, height - spacingOuter - 50 * 2 - 18, 15);

    }

}

function soundScene() {
    // some aspects duplicated from main GUI
    let button_mainGui, button_helpMode_osc1, button_helpMode_osc2;
    let slider_gain, slider_freqCopy, slider_depthLFO, slider_freqLFO;
    let waveformMain = 0;
    let waveformCopy = 0;
    let waveformLFO = 0;
    let helpMode_osc1 = 0;
    let helpMode_osc2 = 0;

    this.setup = function() {
        //UI objects using touchGUI library
        guiSound = createGui();

        // sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + spacingInner, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1);
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

        toggle_OnOff2 = createCheckbox("OnOff", spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + spacingInner, buttonHeight, buttonHeight);

        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0.01, 1);
        slider_freqCopy = createSlider("freqCopy", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, 1, 127);

        slider_depthLFO = createSlider("gainLFO", spacingOuter * 2 + spacingInner + colWidth, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 5000);
        slider_freqLFO = createSlider("freqLFO", spacingOuter * 2 + spacingInner + colWidth, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, 1, 120);

        //help mode
        button_helpMode_osc1 = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_osc2 = createButton("?", spacingOuter * 2 + colWidth * 2 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        //back to main GUI
        button_mainGui = createButton("x", width - spacingOuter - spacingInner - 25, spacingOuter + spacingInner, 25, 25);

        //set toggle values based on state of oscillators
        setToggleValues();

        if (isLFOon) {
            toggle_OnOff2.val = true;
        }

        slider_gain.val = currentAmpMain;
        slider_freqCopy.val = freqToMidi(currentFreqMain);
        slider_depthLFO.val = currentAmpLFO;
        slider_freqLFO.val = freqToMidi(currentFreqLFO);

    };
    this.enter = function() {
        this.setup();
    };

    this.draw = function() {
        background(84, 106, 118);

        //figure out if in help mode or not
        //osc1 section
        if (button_helpMode_osc1.isPressed && helpMode_osc1 == 0) { //if button pressed to turn on 
            helpMode_osc1 = 1;
            button_helpMode_osc1.setStyle({
                fillBg: color("lightgray"),
            });
        } else if (button_helpMode_osc1.isPressed && helpMode_osc1 == 1) { //if button pressed to turn off
            helpMode_osc1 = 0;
            button_helpMode_osc1.setStyle({
                fillBg: color(130),
            });
        }
        //osc2 section
        if (button_helpMode_osc2.isPressed && helpMode_osc2 == 0) { //if button pressed to turn on 
            helpMode_osc2 = 1;
            button_helpMode_osc2.setStyle({
                fillBg: color("lightgray"),
            });
        } else if (button_helpMode_osc2.isPressed && helpMode_osc2 == 1) { //if button pressed to turn off
            helpMode_osc2 = 0;
            button_helpMode_osc2.setStyle({
                fillBg: color(130),
            });
        }

        //----- draw stuff -----//
        drawRectangles();
        drawGui();

        //various text things
        fill("white");
        textSize(25);
        textAlign(LEFT, CENTER);
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Osc 2', spacingOuter * 2 + colWidth + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);

        //explainer boxes
        textAlign(CENTER, CENTER)
        text("This is the first oscillator.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is the second oscillator.", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is the result of 'frequency modulation'.", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter + spacingInner, colWidth - spacingInner, textBarHeight);
        textSize(20)
        text("We can use the two oscillators in combination to make more interesting sounds. Frequency modulation is wobbling the frequency of an oscillator with the output of second. Turn it on and off to see the effect!", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter * 3 + textBarHeight + rowHeight, colWidth - spacingInner, rowHeight);
        textAlign(LEFT, CENTER);

        //slider text labels
        textSize(18)
        if (slider_freqCopy.val > freqToMidi(1000)) {
            text(round(midiToFreq(slider_freqCopy.val) / 1000, 1) + "kHz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        } else {
            text(round(midiToFreq(slider_freqCopy.val)) + "Hz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        }

        if (slider_freqLFO.val > freqToMidi(1000)) {
            text(round(midiToFreq(slider_freqLFO.val) / 1000, 1) + "kHz", spacingOuter * 2 + colWidth * 2 - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        } else {
            text(round(midiToFreq(slider_freqLFO.val)) + "Hz", spacingOuter * 2 + colWidth * 2 - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        }
        text(round(slider_gain.val * 100) + "%", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 15)
        text(round(slider_depthLFO.val), spacingOuter * 2 + colWidth * 2 - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 15)
        textSize(25);
        noFill();

        //display osc type label based on which toggle is active
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

        // ----- pop up hover boxes if help mode on -----//
        if (helpMode_osc1) {
            if (toggle_OnOff._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 80, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Turn on and off here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (toggle_Type1._hover || toggle_Type2._hover || toggle_Type3._hover || toggle_Type4._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the shape of the wave here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_gain._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the main volume here", 270, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_freqCopy._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the frequency here", 270, 135, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
        }
        if (helpMode_osc2) {
            if (toggle_OnOff2._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270 + colWidth, 150, 250, 100, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Turn on and off the second oscillator here.", 270 + colWidth, 150, 250, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_depthLFO._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270 + colWidth, 165, 250, 100, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the amount of wobble here. 0 is none, 5000 is lots!", 270 + colWidth, 160, 250, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_freqLFO._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(270 + colWidth, 165, 250, 100, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Change the speed of wobble here. 9Hz is slow, 5kHz is lots!", 270 + colWidth, 160, 250, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
        }

        // ----- define UI interactions -----//

        // turn synth on/off - both main and copy
        if (toggle_OnOff.val) {
            if (!oscillatorMain.started) { //to avoid repeatedly starting the oscillator
                oscillatorMain.start();
                oscillatorCopy.start();
                isOn = 1;
            }
        } else {
            oscillatorMain.stop();
            oscillatorCopy.stop();
            isOn = 0;
        }

        // turn LFO synth on/off, connect to other oscillator
        if (toggle_OnOff2.val) {
            if (!oscillatorLFO.started) { //to avoid repeatedly starting the oscillator
                oscillatorLFO.start();
                oscillatorLFO_scaled.start();
                oscillatorMain.freq(oscillatorLFO); //not oscCopy here, only oscMain
                isLFOon = 1;
            }
        } else {
            oscillatorLFO.stop();
            oscillatorLFO_scaled.stop();
            isLFOon = 0;
        }

        // toggle between types - mutually exclusive
        if (toggle_Type1.isPressed) {
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sine';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type2.isPressed) {
            toggle_Type1.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sawtooth';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type3.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type4.val = false;
            currentType = 'triangle';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type4.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            currentType = 'square';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        }

        //main gain and freq control
        if (slider_gain.isChanged) {
            currentAmpMain = slider_gain.val;
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
        }
        if (slider_freqCopy.isChanged) {
            currentFreqMain = midiToFreq(slider_freqCopy.val);
            oscillatorCopy.freq(currentFreqMain);
            oscillatorMain.freq(currentFreqMain);
        }

        //LFO depth and freq control
        if (slider_depthLFO.isChanged) {
            currentAmpLFO = slider_depthLFO.val;
            oscillatorLFO.amp(currentAmpLFO, 0.01);
            oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01); //scaled for plotting
        }
        if (slider_freqLFO.isChanged) {
            currentFreqLFO = midiToFreq(slider_freqLFO.val);
            oscillatorLFO.freq(currentFreqLFO);
            oscillatorLFO_scaled.freq(currentFreqLFO); //for plotting purposes
        }

        //----- get and draw waveforms -----//
        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > spacingOuter * 2 + textBarHeight && mouseY < (spacingOuter * 3 + textBarHeight + rowHeight))) {
            waveformMain = fftMain.waveform();
        }
        drawWaveform(waveformMain, colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + spacingOuter * 2 + textBarHeight - 1, spacingOuter * 2 + textBarHeight - 1);

        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > spacingOuter && mouseX < (spacingOuter + colWidth) && mouseY > (rowHeight + spacingOuter * 2 + textBarHeight - 1) && mouseY < (rowHeight * 2 + spacingOuter * 2 + textBarHeight - 1))) {
            waveformCopy = fftCopy.waveform();
        }
        drawWaveform(waveformCopy, spacingOuter, spacingOuter + colWidth, spacingOuter + textBarHeight + rowHeight * 2 + spacingOuter - 1, spacingOuter + textBarHeight + rowHeight + spacingOuter - 1);

        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > spacingOuter * 2 + colWidth && mouseX < (spacingOuter * 2 + colWidth * 2) && mouseY > (rowHeight + spacingOuter * 2 + textBarHeight - 1) && mouseY < (rowHeight * 2 + spacingOuter * 2 + textBarHeight - 1))) {
            waveformLFO = fftLFO.waveform();
        }
        drawWaveform(waveformLFO, spacingOuter * 2 + colWidth, spacingOuter * 2 + colWidth * 2, spacingOuter + textBarHeight + rowHeight * 2 + spacingOuter - 1, spacingOuter + textBarHeight + rowHeight + spacingOuter - 1);

        // return to main scene
        if (button_mainGui.isPressed) {
            mgr.showScene(mainScene);
        }
    };

    function drawRectangles() {
        let rounding = 10;
        stroke(255, 193, 84);
        strokeWeight(2);
        noFill();

        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter * 3 + colWidth * 2, spacingOuter, colWidth, textBarHeight, rounding, rounding)

        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //top left

        rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //bottom centre

        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //top right

        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding); //bottom right
        noStroke();
        strokeWeight(1)
    }
}

function loudspeakerScene() {
    let button_mainGui2;

    this.setup = function() {

        guiSound = createGui();
        // back to main GUI
        button_mainGui2 = createButton("x", width - spacingOuter * 3 - spacingInner * 2, spacingOuter * 2, 25, 25);


    };
    this.enter = function() {
        this.setup();
    };
    this.draw = function() {
        background(84, 106, 118);
        drawGui();

        textAlign(CENTER, CENTER)
        stroke(88, 44, 77)
        noFill()
        strokeWeight(2)
        rect(spacingOuter, spacingOuter, width - spacingOuter * 2, height - spacingOuter * 2, 10, 10)
        fill(88, 44, 77)
        text("There will be information about how sound/vibration/loudspeakers work here", width / 2, height / 2)

        // return to main scene
        if (button_mainGui2.isPressed) {
            mgr.showScene(mainScene);
        }
    };
}