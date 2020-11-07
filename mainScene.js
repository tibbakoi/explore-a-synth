// main instrument scene
function mainScene() {
    let button_loudspeakerMore;
    let button_soundMore;
    let gainKnob;
    let waveform = 0;

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

        //keyboard toggles
        toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 3 + rowHeight + spacingInner + textBarHeight, buttonHeight, buttonHeight);

        //record UI
        toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight);
        button_Playback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);
        button_Save = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);

        // scene manager switch buttons
        button_loudspeakerMore = createButton("More", spacingOuter + colWidth * 2.5 - spacingInner * 3, height - spacingOuter - spacingInner - 25, 25, 25);
        button_soundMore = createButton("More", spacingOuter + colWidth - spacingInner - 25, spacingOuter + +textBarHeight + rowHeight - spacingInner - 25, 25, 25);

        //master volume knob - set to currentAmpMain
        gainKnob = new MakeKnobC("black", 60, spacingOuter + colWidth - spacingInner - 30, spacingOuter * 2 + spacingInner + 30 + textBarHeight, 0, 1, currentAmpMain, 2, "", [0, 0, 0, 0], 0);

        //starting parameters - looks recursive but means everything has the correct values on load
        XY_freqAmp.valX = 1; //amplitude at 1
        XY_freqAmp.valY = freqToMidi(currentFreqMain);

        oscillatorMain.freq(currentFreqMain);
        oscillatorMain.amp(currentAmpMain, 0.01);

        oscillatorCopy.freq(currentFreqMain); //copy frequency and amplitude across
        oscillatorCopy.amp(currentAmpMain, 0.01); //NB - is disconnected so not actual output

        oscillatorLFO.freq(currentFreqLFO);
        oscillatorLFO.amp(currentAmpLFO, 0.01);

        noFill();
        stroke('white');

        //set toggle values based on state of oscillators
        setToggleValues();

    };

    this.enter = function() {
        this.setup();
    };

    this.draw = function() {

        //handle mouse input for master gain knob
        this.mousePressed = function() {
            gainKnob.active(); //function to activation knob if mousePressed and mouseOver (within fn)
        };
        this.mouseReleased = function() {
            gainKnob.inactive();
        };

        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > (spacingOuter * 2 + textBarHeight) && mouseY < (spacingOuter * 2 + textBarHeight + rowHeight))) {
            waveform = fftMain.waveform();
        }
        drawWaveform(waveform, colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + textBarHeight + spacingOuter * 2 - 1, spacingOuter * 2 + 1 + textBarHeight);

        drawRectangles();
        drawLoudspeaker();
        drawRecordLED();

        drawGui();
        gainKnob.update();

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
        noFill();

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

        //X-Y frequency/amplitude control - only when keyboard isn't enabled - otherwise too many amplitude values at once
        if (XY_freqAmp.isChanged && !toggle_controlType.val) {
            //store values
            currentAmpMain = XY_freqAmp.valX * gainKnob.knobValue;
            currentFreqMain = midiToFreq(XY_freqAmp.valY);
            //set osc variables
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
            oscillatorMain.freq(currentFreqMain);
            oscillatorCopy.freq(currentFreqMain);
        }

        // gain knob master gain control - (doesn't work on an event, just changes a value)
        //if in x-y mode, multiply X-Y amplitude when gain knob changes then change osc. amp
        if (!toggle_controlType.val) {
            //store value
            currentAmpMain = XY_freqAmp.valX * gainKnob.knobValue;
            //set osc variables
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
        }
        //if in keyboard board, multiply the envelope when gain knob changes
        if (toggle_controlType.val) {
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
    };

    //----- musical functions -----//
    function playNote() {
        currentFreqMain = midiToFreq(currentNote + currentOctave);
        oscillatorMain.freq(currentFreqMain);
        oscillatorMain.amp(0); //need to reset amplitude first otherwise uses value from x-y pad if moved
        envMain.play(oscillatorMain); //play with envelope
        envMain.play(oscillatorLFO); //play with envelope

    }

    //----- drawing things ----//
    function drawRecordLED() {
        if (frameCount % 60 > 29 && toggle_record.val) { //flash on/off once a second
            fill("red");
            circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, height - buttonHeight * 3 - spacingOuter * 2 - spacingInner * 3 + 15, 20);
            noFill();
        } else {
            fill("darkred");
            circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, height - buttonHeight * 3 - spacingOuter - spacingInner * 3 + 15, 20);
            noFill();
        }
    }

    function drawRectangles() {
        let rounding = 10;
        stroke("black");
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //top left
        rect(spacingOuter, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding); //bottom left

        rect(spacingOuter * 2 + colWidth, spacingOuter * 3 + rowHeight + textBarHeight, colWidth, rowHeight, rounding, rounding); //bottom centre

        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //top right

        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right




        // perhaps some outer boxes to indicate different sections?
        // stroke("purple")
        // rect(spacingOuter - 2, spacingOuter - 2, colWidth + 4, rowHeight * 2 + 4 + spacingOuter, rounding, rounding)
    }

    function drawLoudspeaker() {
        //centre of loudspeaker = x, y
        var x = (spacingOuter * 3) + (colWidth * 2.25);;
        var y = (spacingOuter * 3) + (rowHeight * 1.5) + textBarHeight;
        var ampLevel = ampAnalyser.getLevel();

        //change the value based on the master output level every 3 frames, if the synth is turned on
        // if amplitude is 0 on either control, currentWidth = 100
        if (frameCount % 3 == true && toggle_OnOff.val) {
            currentWidth = 100 + random(0, 10) * ampLevel * 4; //*4 to give more visual change
        }

        //draw 
        fill("grey");
        circle(x, y, currentWidth);
        fill("black");
        circle(x, y, currentWidth * 0.9);
        fill("grey");
        circle(x, y, currentWidth * 0.8);
        fill("black");
        circle(x, y, currentWidth * 0.4);
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

    function drawOctaveIndicator(currentOctave) {
        let activeOctave = currentOctave / 12 - 1;
        stroke("red");
        noFill();

        circle(spacingOuter * 2 + colWidth + spacingInner + ((activeOctave * 2) - 1) * 18, height - spacingOuter - 50 * 2 - 18, 15);

    }

}