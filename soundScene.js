function soundScene() {
    // some aspects duplicated from main GUI
    let button_mainGui, button_helpMode_osc1, button_helpMode_osc2;
    let slider_gain, slider_freqCopy, slider_depthLFO, slider_freqLFO;
    let waveformMain = 0;
    let waveformCopy = 0;
    let waveformLFO = 0;
    let helpMode_osc1 = 0;
    let helpMode_osc2 = 0;

    //styling for help buttons
    let helpButtonActiveStyle = {
        fillBg: color("white"),
    };

    let helpButtonInactiveStyle = {
        fillBg: color(130),
    };

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

        toggle_mute = createCheckbox("Mute", spacingOuter + colWidth - spacingInner - 110, spacingOuter * 2 + spacingInner + textBarHeight, buttonHeight, buttonHeight);
        toggle_mute.setStyle({
            fillCheck: color("red"),
            fillCheckHover: color("red"),
            fillCheckActive: color("red"),
        }); //all versions of the X are red

        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);
        slider_freqCopy = createSlider("freqCopy", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, 1, maxMIDIval);

        slider_depthLFO = createSlider("gainLFO", spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + buttonHeight * 1.8, colWidth - spacingInner * 2 - 50, 30, 0, 5000);
        slider_freqLFO = createSlider("freqLFO", spacingOuter * 2 + spacingInner + colWidth, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, 1, 120);

        //help mode
        button_helpMode_osc1 = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_osc2 = createButton("?", spacingOuter * 2 + colWidth * 2 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        //back to main GUI
        button_mainGui = createButton("x", width - spacingOuter - spacingInner - 25, spacingOuter + spacingInner, 25, 25);

        //set status of UI elements and oscillators
        setOscillatorValues();
        setUIValues();

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
            button_helpMode_osc1.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_osc1.isPressed && helpMode_osc1 == 1) { //if button pressed to turn off
            helpMode_osc1 = 0;
            button_helpMode_osc1.setStyle(helpButtonInactiveStyle);
        }
        //osc2 section
        if (button_helpMode_osc2.isPressed && helpMode_osc2 == 0) { //if button pressed to turn on 
            helpMode_osc2 = 1;
            button_helpMode_osc2.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_osc2.isPressed && helpMode_osc2 == 1) { //if button pressed to turn off
            helpMode_osc2 = 0;
            button_helpMode_osc2.setStyle(helpButtonInactiveStyle);
        }

        //----- draw stuff -----//
        drawRectangles();
        drawGui();

        //various text things
        fill("white");
        textSize(25);
        textAlign(LEFT, CENTER);
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Mute', spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + spacingInner + 25);
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
            speedString = (round(midiToFreq(slider_freqLFO.val) / 1000, 1) + "kHz");
        } else {
            speedString = (round(midiToFreq(slider_freqLFO.val)) + "Hz");
        }
        text("Amount: " + round(slider_depthLFO.val), spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + buttonHeight * 1.5)
        text("Speed: " + speedString, spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + buttonHeight * 2.8)

        textSize(15)
        text("Vol: " + round(slider_gain.val, 1), spacingOuter + colWidth - spacingInner * 2 - 42, spacingOuter * 2 + textBarHeight + rowHeight - 65)


        noFill();
        textSize(25);

        //display osc type label based on which toggle is active
        changeTypeLabel();

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
            if (toggle_mute._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Mute everything", 150, 150, 150, 150)
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

        // mute but everything continues happening
        if (toggle_mute.val) {
            p5.soundOut.output.gain.value = 0; //sets the output of the gain node to 0 so everything continues happening but no sound plays
            isMute = 1;
        } else {
            p5.soundOut.output.gain.value = 1; //resets the output value of the gain node
            isMute = 0;
        }

        // toggle between types - mutually exclusive
        if (toggle_Type1.isPressed) {
            if (!toggle_Type1.val) { toggle_Type1.val = true; } //can't turn a toggle off and leave none active
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sine';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type2.isPressed) {
            if (!toggle_Type2.val) { toggle_Type2.val = true; } //can't turn a toggle off and leave none active
            toggle_Type1.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sawtooth';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type3.isPressed) {
            if (!toggle_Type3.val) { toggle_Type3.val = true; } //can't turn a toggle off and leave none active
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type4.val = false;
            currentType = 'triangle';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type4.isPressed) {
            if (!toggle_Type4.val) { toggle_Type4.val = true; } //can't turn a toggle off and leave none active
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

    function setUIValues() {
        setToggleValues();

        if (isLFOon) {
            toggle_OnOff2.val = true;
        }

        slider_gain.val = currentAmpMain;
        slider_freqCopy.val = freqToMidi(currentFreqMain);
        slider_depthLFO.val = currentAmpLFO;
        slider_freqLFO.val = freqToMidi(currentFreqLFO);

    }
}