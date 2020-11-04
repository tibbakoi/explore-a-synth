//----- init stuff - decide what needs what scope..?!

//gui variables
let guiMain, guiSound, guiLoudspeaker;
let colWidth = 300;
let rowHeight = 200;
let buttonHeight = 50;
let spacingOuter = 10;
let spacingInner = 5;

let toggle_OnOff; //power
let toggle_controlType; //enable playing by keyboard
let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 //osc type
let toggle_record; //record
let XY_freqAmp; //x-y control

//loudspeaker graphic - needs to be global so that draws when no sound playing
let currentWidth = 100;

//audio stuff
let oscillatorMain, oscillatorCopy, oscillatorLFO; //oscCopy = duplicate of oscMain for the purposes of plotting before/after modulation
let fftMain, fftCopy, fftLFO;
let currentOctave, currentNote, envMain;
let gainKnob;
let ampAnalyser;

//recording stuff
let recorder, soundFile;
let button_Playback, button_Save;

//scene manager
let mgr;

function setup() {
    let canvas = createCanvas(colWidth * 3 + spacingOuter * 4, rowHeight * 2 + spacingOuter * 3);
    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects - external to any specific scene
    oscillatorMain = new p5.Oscillator('sine');
    oscillatorCopy = new p5.Oscillator('sine');
    oscillatorCopy.disconnect(); //disconnect from audio output so can plot signal but have no sound
    oscillatorLFO = new p5.Oscillator('sine'); //for modulation
    oscillatorLFO.setType('triangle');
    oscillatorLFO.disconnect(); //doesn't need to be connected to audio output if used for modulation
    envMain = new p5.Envelope(0.01, 1, 0.3, 0); // attack time, attack level, decay time, decay level

    fftMain = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set
    fftCopy = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set
    fftLFO = new p5.FFT(0.8, 256); //analyses all audio in sketch if no input set

    fftMain.setInput(oscillatorMain);
    fftCopy.setInput(oscillatorCopy);
    fftLFO.setInput(oscillatorLFO);

    ampAnalyser = new p5.Amplitude();
    recorder = new p5.SoundRecorder(); //no input specified = records everything happening within the sketch
    soundFile = new p5.SoundFile();

    //set up scene manager
    mgr = new SceneManager();
    mgr.addScene(mainScene);
    mgr.addScene(soundScene);
    mgr.addScene(loudspeakerScene);

    mgr.showScene(soundScene); //first scene to load

}

function draw() {
    background(100);
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

// main instrument scene
function mainScene() {
    let button_loudspeakerMore;
    let button_soundMore;

    this.setup = function() {

        //UI objects using touchGUI library
        guiMain = createGui();

        // sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter + spacingInner, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1)
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

        //master volume knob 
        gainKnob = new MakeKnobC("black", 60, spacingOuter + colWidth - spacingInner - 30, spacingOuter + spacingInner + 30, 0, 1, 0, 2, "", [0, 0, 0, 0], 0);

        //X-Y pad
        XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, spacingOuter, colWidth, rowHeight, 0, 1, 1, 127);

        //keyboard toggles
        toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 2 + rowHeight + spacingInner, buttonHeight, buttonHeight)

        //record UI
        toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight)
        button_Playback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter - spacingInner, buttonHeight)
        button_Save = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter - spacingInner, buttonHeight)

        // scene manager switch buttons
        button_loudspeakerMore = createButton("?", spacingOuter + colWidth * 2.5 - spacingInner * 3, height - spacingOuter - spacingInner - 25, 25, 25);
        button_soundMore = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + rowHeight - spacingInner - 25, 25, 25);

        //starting parameters
        currentOctave = 48; //default to 3rd octave
        currentNote = 0; //middle C
        XY_freqAmp.valX = 0; //amplitude at zero
        XY_freqAmp.valY = currentOctave + currentNote;

        oscillatorMain.freq(midiToFreq(XY_freqAmp.valY));
        oscillatorMain.amp(XY_freqAmp.valX);

        oscillatorCopy.freq(midiToFreq(XY_freqAmp.valY)); //copy frequency and amplitude across
        oscillatorCopy.amp(XY_freqAmp.valX); //NB - is disconnected so not actual output

        noFill();
        stroke('white');

    }

    this.enter = function() { //called each time this scene is switched to
        this.setup();
    }
    this.draw = function() {

        //handle input for master gain knob
        this.mousePressed = function() {
            gainKnob.active();
        }
        this.mouseReleased = function() {
            gainKnob.inactive();
        }

        drawRectangles();
        drawLoudspeaker();
        drawRecordLED();
        //get and draw waveform
        drawWaveform(fftMain.waveform(), colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + spacingOuter - 1, spacingOuter - 1);

        drawGui();
        gainKnob.update();

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

        //----- define UI interactions -----//

        // turn synth on/off
        if (toggle_OnOff.val) {
            if (!oscillatorMain.started) { //to avoid repeatedly starting the oscillator
                oscillatorMain.start();
            }
        } else {
            oscillatorMain.stop();
        }

        // toggle between types - mutually exclusive
        if (toggle_Type1.isPressed) {
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            oscillatorMain.setType('sine');
            oscillatorCopy.setType('sine');
        } else if (toggle_Type2.isPressed) {
            toggle_Type1.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            oscillatorMain.setType('sawtooth');
            oscillatorCopy.setType('sawtooth');
        } else if (toggle_Type3.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type4.val = false;
            oscillatorMain.setType('triangle');
            oscillatorCopy.setType('triangle');
        } else if (toggle_Type4.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            oscillatorMain.setType('square');
            oscillatorCopy.setType('square');
        }

        //display osc type label based on which toggle is active
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

        //X-Y frequency/amplitude control - only when keyboard isn't enabled - otherwise too many amplitude values at once
        if (XY_freqAmp.isChanged && !toggle_controlType.val) {
            oscillatorMain.amp(XY_freqAmp.valX * gainKnob.knobValue, 0.01);
            oscillatorMain.freq(midiToFreq(XY_freqAmp.valY));
            oscillatorCopy.freq(midiToFreq(XY_freqAmp.valY));
        }

        // gain knob master gain control - (doesn't work on an event, just changes a value)
        if (!toggle_controlType.val) {
            //multiply X-Y amplitude when gain knob changes, change osc. amp
            oscillatorMain.amp(XY_freqAmp.valX * gainKnob.knobValue, 0.01);
        }
        if (toggle_controlType.val) {
            //multiply the envelope when gain knob changes
            envMain.mult(gainKnob.knobValue);
        }

        // draw active/inactive keyboard
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
    }

    //----- musical functions -----//

    function playNote() {
        oscillatorMain.freq(midiToFreq(currentNote + currentOctave));
        oscillatorMain.amp(0); //need to reset amplitude first otherwise uses value from x-y pad if moved
        envMain.play(oscillatorMain); //play with envelope
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

    function drawLoudspeaker() {
        //centre of loudspeaker = x, y
        var x = (spacingOuter * 3) + (colWidth * 2.25);;
        var y = (spacingOuter * 2) + (rowHeight * 1.5);
        var ampLevel = ampAnalyser.getLevel();

        //change the value based on the master output level every 3 frames, if the synth is turned on
        // if amplitude is 0 on either control, currentWidth = 100
        if (frameCount % 3 == true && toggle_OnOff.val) {
            currentWidth = 100 + random(0, 10) * ampLevel * 4; //*4 to give more visual change
        }

        //draw 
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
        stroke("red");
        noFill();

        circle(spacingOuter * 2 + colWidth + spacingInner + ((activeOctave * 2) - 1) * 18, height - spacingOuter - 50 * 2 - 18, 15);

    }
}

function soundScene() {
    // some aspects duplicated from main GUI
    let button_mainGui;
    let gainKnob, freqKnob_oscCopy, gainKnob_oscLFO, freqKnob_oscLFO;

    this.setup = function() {
        //UI objects using touchGUI library
        guiSound = createGui();

        // sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter + spacingInner, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1)
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

        toggle_OnOff2 = createCheckbox("OnOff", spacingOuter * 2 + spacingInner + colWidth, spacingOuter + spacingInner, buttonHeight, buttonHeight);
        // toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1)
        // toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        // toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        // toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

        //master volume knob 
        gainKnob = new MakeKnobC("black", 60, spacingOuter + spacingInner + 60, 175, 0, 1, 0, 4, "Vol.", [0, 0, 0, 150], 15);
        //osc controls
        freqKnob_oscCopy = new MakeKnobC("black", 60, spacingOuter + spacingInner + 150, 175, 1, 127, 0, 0, "Freq.", [0, 0, 0, 150], 15);
        gainKnob_oscLFO = new MakeKnobC("black", 60, spacingOuter + spacingInner + colWidth + 60, 175, 0, 1, 0, 4, "Amount", [0, 0, 0, 150], 15);
        freqKnob_oscLFO = new MakeKnobC("black", 60, spacingOuter + spacingInner + colWidth + 150, 175, 1, 127, 0, 0, "Freq", [0, 0, 0, 150], 15);

        //back to main GUI
        button_mainGui = createButton("x", width - spacingOuter - spacingInner - 25, spacingOuter + spacingInner, 25, 25);
    }
    this.enter = function() {
        this.setup();
    }

    this.draw = function() {
        background("teal")
        drawRectangles();

        //handle input for master gain knob
        this.mousePressed = function() {
            gainKnob.active();
            freqKnob_oscCopy.active();
            freqKnob_oscLFO.active();
            gainKnob_oscLFO.active();
        }
        this.mouseReleased = function() {
            gainKnob.inactive();
            freqKnob_oscCopy.inactive();
            freqKnob_oscLFO.inactive();
            gainKnob_oscLFO.inactive();
        }
        drawGui();

        gainKnob.update();
        freqKnob_oscCopy.update();
        freqKnob_oscLFO.update();
        gainKnob_oscLFO.update();

        fill("white");
        textSize(25);
        textAlign(LEFT, CENTER);
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter + spacingInner + 25);
        noFill();

        // turn synth on/off - both main and copy?
        if (toggle_OnOff.val) {
            if (!oscillatorMain.started) { //to avoid repeatedly starting the oscillator
                oscillatorMain.start();
                oscillatorCopy.start();
            }
        } else {
            oscillatorMain.stop();
            oscillatorCopy.stop();
        }

        // turn LFO synth on/off, connect to other oscillator
        if (toggle_OnOff2.val) {
            if (!oscillatorLFO.started) { //to avoid repeatedly starting the oscillator
                oscillatorLFO.start();
                oscillatorMain.amp(oscillatorLFO);
            }
        } else {
            oscillatorLFO.stop();
        }

        // toggle between types - mutually exclusive
        if (toggle_Type1.isPressed) {
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            oscillatorMain.setType('sine');
            oscillatorCopy.setType('sine');
        } else if (toggle_Type2.isPressed) {
            toggle_Type1.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            oscillatorMain.setType('sawtooth');
            oscillatorCopy.setType('sawtooth');
        } else if (toggle_Type3.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type4.val = false;
            oscillatorMain.setType('triangle');
            oscillatorCopy.setType('triangle');
        } else if (toggle_Type4.isPressed) {
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            oscillatorMain.setType('square');
            oscillatorCopy.setType('square');
        }

        //display osc type label based on which toggle is active
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

        //gain knob master gain control- (doesn't work on an event, just changes a value)
        oscillatorMain.amp(gainKnob.knobValue);
        oscillatorCopy.amp(gainKnob.knobValue);

        //freq knob
        oscillatorCopy.freq(midiToFreq(freqKnob_oscCopy.knobValue))
        oscillatorMain.freq(midiToFreq(freqKnob_oscCopy.knobValue))

        //LFO amplitude and frequency control
        oscillatorLFO.amp(gainKnob_oscLFO.knobValue); //needs much larger value for fm than 0-1
        // console.log("LFO gain: " + gainKnob_oscLFO.knobValue);
        oscillatorLFO.freq(midiToFreq(freqKnob_oscLFO.knobValue));

        //get and draw waveforms
        drawWaveform(fftMain.waveform(), colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + spacingOuter - 1, spacingOuter - 1);
        drawWaveform(fftCopy.waveform(), spacingOuter, spacingOuter + colWidth, rowHeight * 2 + spacingOuter - 1, rowHeight + spacingOuter - 1);
        drawWaveform(fftLFO.waveform(), spacingOuter * 2 + colWidth, spacingOuter * 2 + colWidth * 2, rowHeight * 2 + spacingOuter - 1, rowHeight + spacingOuter - 1);

        // return to main scene
        if (button_mainGui.isPressed) {
            mgr.showScene(mainScene);
        }
    }

    function drawRectangles() {
        let rounding = 10;
        stroke("black")
        noFill()

        rect(spacingOuter, spacingOuter, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //top left

        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //bottom centre

        rect(colWidth * 2 + spacingOuter * 3, spacingOuter, colWidth, rowHeight, rounding, rounding); //top right

        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 2, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 2, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        noStroke();
    }
}

function loudspeakerScene() {
    let button_mainGui2;

    this.setup = function() {

        guiSound = createGui();
        // back to main GUI
        button_mainGui2 = createButton("x", width - spacingOuter * 3 - spacingInner * 2, spacingOuter * 2, 25, 25);


    }
    this.enter = function() {
        this.setup();
    }
    this.draw = function() {
        background("lightblue")
        drawGui();

        // return to main scene
        if (button_mainGui2.isPressed) {
            mgr.showScene(mainScene);
        }
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