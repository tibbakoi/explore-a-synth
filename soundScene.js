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

        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);
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
        strokeWeight(4);
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