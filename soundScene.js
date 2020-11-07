function soundScene() {
    // some aspects duplicated from main GUI
    let button_mainGui;
    let gainKnob, freqKnob_oscCopy, gainKnob_oscLFO, freqKnob_oscLFO;
    let waveformMain = 0;
    let waveformCopy = 0;
    let waveformLFO = 0;

    this.setup = function() {
        //UI objects using touchGUI library
        guiSound = createGui();

        // sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter + spacingInner, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1);
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);

        toggle_OnOff2 = createCheckbox("OnOff", spacingOuter * 2 + spacingInner + colWidth, spacingOuter + spacingInner, buttonHeight, buttonHeight);

        //master volume knob 
        gainKnob = new MakeKnobC("black", 60, spacingOuter + spacingInner + 60, 175, 0, 1, currentAmpMain, 4, "Vol.", [0, 0, 0, 150], 15);
        //osc controls
        freqKnob_oscCopy = new MakeKnobC("black", 60, spacingOuter + spacingInner + 150, 175, 1, 127, freqToMidi(currentFreqMain), 0, "Freq.", [0, 0, 0, 150], 15);
        gainKnob_oscLFO = new MakeKnobC("black", 60, spacingOuter + spacingInner + colWidth + 60, 175, 0, 1, currentAmpLFO, 4, "Amount", [0, 0, 0, 150], 15);
        freqKnob_oscLFO = new MakeKnobC("black", 60, spacingOuter + spacingInner + colWidth + 150, 175, 1, 127, freqToMidi(currentFreqLFO), 0, "Freq", [0, 0, 0, 150], 15);

        //back to main GUI
        button_mainGui = createButton("x", width - spacingOuter - spacingInner - 25, spacingOuter + spacingInner, 25, 25);

        //set toggle values based on state of oscillators
        setToggleValues();

        if (isLFOon) {
            toggle_OnOff2.val = true;
        }

    };
    this.enter = function() {
        this.setup();
    };

    this.draw = function() {
        background("teal");
        drawRectangles();

        //handle input for master gain knob
        this.mousePressed = function() {
            gainKnob.active();
            freqKnob_oscCopy.active();
            freqKnob_oscLFO.active();
            gainKnob_oscLFO.active();
        };
        this.mouseReleased = function() {
            gainKnob.inactive();
            freqKnob_oscCopy.inactive();
            freqKnob_oscLFO.inactive();
            gainKnob_oscLFO.inactive();
        };
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
                oscillatorMain.amp(oscillatorLFO);
                isLFOon = 1;
            }
        } else {
            oscillatorLFO.stop();
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
        currentAmpMain = gainKnob.knobValue;
        oscillatorMain.amp(currentAmpMain, 0.01);
        oscillatorCopy.amp(currentAmpMain, 0.01);

        //freq knob
        currentFreqMain = midiToFreq(freqKnob_oscCopy.knobValue);
        oscillatorCopy.freq(currentFreqMain);
        oscillatorMain.freq(currentFreqMain);

        //LFO amplitude and frequency control
        currentAmpLFO = gainKnob_oscLFO.knobValue;
        oscillatorLFO.amp(currentAmpLFO, 0.01); //needs much larger value for fm than 0-1
        currentFreqLFO = midiToFreq(freqKnob_oscLFO.knobValue);
        oscillatorLFO.freq(currentFreqLFO);

        //----- get and draw waveforms -----//
        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > spacingOuter && mouseY < (spacingOuter * 2 + rowHeight))) {
            waveformMain = fftMain.waveform();
        }
        drawWaveform(waveformMain, colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + spacingOuter - 1, spacingOuter - 1);

        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > spacingOuter && mouseX < (spacingOuter + colWidth) && mouseY > (rowHeight + spacingOuter - 1) && mouseY < (rowHeight * 2 + spacingOuter - 1))) {
            waveformCopy = fftCopy.waveform();
        }
        drawWaveform(waveformCopy, spacingOuter, spacingOuter + colWidth, rowHeight * 2 + spacingOuter - 1, rowHeight + spacingOuter - 1);

        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > spacingOuter * 2 + colWidth && mouseX < (spacingOuter * 2 + colWidth * 2) && mouseY > (rowHeight + spacingOuter - 1) && mouseY < (rowHeight * 2 + spacingOuter - 1))) {
            waveformLFO = fftLFO.waveform();
        }
        drawWaveform(waveformLFO, spacingOuter * 2 + colWidth, spacingOuter * 2 + colWidth * 2, rowHeight * 2 + spacingOuter - 1, rowHeight + spacingOuter - 1);

        // return to main scene
        if (button_mainGui.isPressed) {
            mgr.showScene(mainScene);
        }
    };

    function drawRectangles() {
        let rounding = 10;
        stroke("black");
        noFill();

        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //top left

        rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //bottom centre

        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //top right

        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 2, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 2, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        noStroke();
    }
}