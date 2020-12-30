/*
Explore-a-Synth release v0.0.0

soundScene
- Scene loaded when 'More' button pressed in sound section of mainScene
- Displays controls for two oscillators (carrier and modulator) and waveform plots for the modulated signal, the unmodulated signal and the modulating signal
- UI elements created using touchGUI
- Location of UI elements based on values set in instrumentv3 (colWidth, rowHeight, spacingOuter etc)

Author: Kat Young
https://github.com/tibbakoi
2020

*/

function soundScene() {
    let button_mainGui; // navigation to other scenes
    // Oscillator related
    let slider_gain, slider_freq, slider_depthLFO, slider_freqLFO; // sliders for amp and freq for the two oscillators
    let toggle_OnOff; // power
    let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 // osc type
    let toggle_mute; // overall mute control
    // Somewhere to put all the waveforms
    let waveformMain = 0;
    let waveformCopy = 0; // store a copy of the un-modulated carrier for plotting purposes
    let waveformLFO = 0;
    // Help mode
    let button_helpMode_osc1, button_helpMode_osc2;
    let helpMode_osc1 = 0;
    let helpMode_osc2 = 0; // help mode

    // Styling for help buttons
    let helpButtonActiveStyle = {
        fillBg: color("white"),
    };

    let helpButtonInactiveStyle = {
        fillBg: color(130),
    };

    this.setup = function() {
        /*--- Create UI elements ---*/
        // UI objects using touchGUI library
        guiSound = createGui();

        // Sound settings toggles
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

        // Amplitude and frequency sliders for carrier
        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);
        slider_freq = createSlider("freqCopy", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, minFreq, maxFreq);

        // Amplitude and frequency sliders for modulator
        slider_depthLFO = createSlider("gainLFO", spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + buttonHeight * 1.8, colWidth - spacingInner * 2 - 50, 30, 0, 5000);
        slider_freqLFO = createSlider("freqLFO", spacingOuter * 2 + spacingInner + colWidth, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, minFreqLFO, maxFreqLFO);

        // Help mode buttons
        button_helpMode_osc1 = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_osc2 = createButton("?", spacingOuter * 2 + colWidth * 2 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        // SceneManager switch button
        button_mainGui = createButton("x", width - spacingOuter - spacingInner - 25, spacingOuter + spacingInner, 25, 25);

        // Set status of UI elements and oscillators
        setOscillatorValues();
        setUIValues();
    }

    // Called whenever scene is switched to from another
    this.enter = function() {
        this.setup();
    }

    this.draw = function() {
        background(84, 106, 118);

        /*--- Figure out whether in help mode or not, change button style accordingly---*/
        // Osc1 section
        if (button_helpMode_osc1.isPressed && helpMode_osc1 == 0) { // if button pressed to turn on 
            helpMode_osc1 = 1;
            button_helpMode_osc1.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_osc1.isPressed && helpMode_osc1 == 1) { // if button pressed to turn off
            helpMode_osc1 = 0;
            button_helpMode_osc1.setStyle(helpButtonInactiveStyle);
        }
        // Osc2 section
        if (button_helpMode_osc2.isPressed && helpMode_osc2 == 0) { // if button pressed to turn on 
            helpMode_osc2 = 1;
            button_helpMode_osc2.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_osc2.isPressed && helpMode_osc2 == 1) { // if button pressed to turn off
            helpMode_osc2 = 0;
            button_helpMode_osc2.setStyle(helpButtonInactiveStyle);
        }

        /*--- Draw GUI stuff: rectangles, UI elements, waveforms, text ---*/
        drawRectangles();
        drawGui(); // required by touchGUI

        // If mouse is NOT currently pressed within region where modulated waveform is drawn, update waveform so the plot is live
        if (!(mouseIsPressed && mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > spacingOuter * 2 + textBarHeight && mouseY < (spacingOuter * 3 + textBarHeight + rowHeight))) {
            waveformMain = fftMain.waveform();
        } // Else plot the static waveform to 'pause' the plot
        drawWaveform(waveformMain, colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + spacingOuter * 2 + textBarHeight - 1, spacingOuter * 2 + textBarHeight - 1);

        // If mouse is NOT currently pressed within region where un-modulated waveform is drawn, update waveform so the plot is live
        if (!(mouseIsPressed && mouseX > spacingOuter && mouseX < (spacingOuter + colWidth) && mouseY > (rowHeight + spacingOuter * 2 + textBarHeight - 1) && mouseY < (rowHeight * 2 + spacingOuter * 2 + textBarHeight - 1))) {
            waveformCopy = fftCopy.waveform();
        }
        drawWaveform(waveformCopy, spacingOuter, spacingOuter + colWidth, spacingOuter + textBarHeight + rowHeight * 2 + spacingOuter - 1, spacingOuter + textBarHeight + rowHeight + spacingOuter - 1);

        // If mouse is NOT currently pressed within region where modulating waveform is drawn, update waveform so the plot is live
        if (!(mouseIsPressed && mouseX > spacingOuter * 2 + colWidth && mouseX < (spacingOuter * 2 + colWidth * 2) && mouseY > (rowHeight + spacingOuter * 2 + textBarHeight - 1) && mouseY < (rowHeight * 2 + spacingOuter * 2 + textBarHeight - 1))) {
            waveformLFO = fftLFO.waveform();
        }
        drawWaveform(waveformLFO, spacingOuter * 2 + colWidth, spacingOuter * 2 + colWidth * 2, spacingOuter + textBarHeight + rowHeight * 2 + spacingOuter - 1, spacingOuter + textBarHeight + rowHeight + spacingOuter - 1);

        // Draw various bits of text
        fill("white");
        textSize(25);
        textAlign(LEFT, CENTER);
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Mute', spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Osc 2', spacingOuter * 2 + colWidth + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);

        // Draw top row of text and explanation text
        textAlign(CENTER, CENTER)
        text("This is the first oscillator.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is the second oscillator.", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is the result of 'frequency modulation'.", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter + spacingInner, colWidth - spacingInner, textBarHeight);
        textSize(20)
        text("We can use the two oscillators in combination to make more interesting sounds. Frequency modulation is wobbling the frequency of an oscillator with the output of second. Turn it on and off to see the effect!", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter * 3 + textBarHeight + rowHeight, colWidth - spacingInner, rowHeight);
        textAlign(LEFT, CENTER);

        // Draw slider text labels
        textSize(18)
        if (slider_freq.val > 1000) {
            text(round(slider_freq.val / 1000, 1) + "kHz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        } else {
            text(round(slider_freq.val) + "Hz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        }
        if (slider_freqLFO.val > 1000) {
            speedString = (round(slider_freqLFO.val / 1000, 1) + "kHz");
        } else {
            speedString = (round(slider_freqLFO.val) + "Hz");
        }
        text("Amount: " + round(slider_depthLFO.val), spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + buttonHeight * 1.5)
        text("Speed: " + speedString, spacingOuter * 2 + spacingInner + colWidth, spacingOuter * 2 + textBarHeight + buttonHeight * 2.8)
        textSize(15)
        text("Vol: " + round(slider_gain.val, 1), spacingOuter + colWidth - spacingInner * 2 - 42, spacingOuter * 2 + textBarHeight + rowHeight - 65)

        noFill();
        textSize(25);

        // Display oscillator type label based on which toggle is active
        changeTypeLabel(toggle_Type1.val, toggle_Type2.val, toggle_Type3.val, toggle_Type4.val);

        /*--- Draw help mode boxes if help mode has been activated - draw on top of everything else. 
        When each UI element is hovered over, display pop-up help box ---*/
        if (helpMode_osc1) { // if left-most help button pressed
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
            if (slider_freq._hover) {
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
        if (helpMode_osc2) { // if right-most help button pressed
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

        /*--- Define UI interactions.
        Note - touchGUI differs from p5 implementation: touchGUI uses if statements rather than events (see documentation for more info) ---*/

        // Turn synth on/off
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

        // Turn LFO synth on/off, connect to other oscillator
        if (toggle_OnOff2.val) {
            if (!oscillatorLFO.started) { // to avoid repeatedly starting the oscillator
                oscillatorLFO.start();
                oscillatorLFO_scaled.start();
                oscillatorMain.freq(oscillatorLFO); // not oscCopy here, only oscMain
                isLFOon = 1;
            }
        } else {
            oscillatorLFO.stop();
            oscillatorLFO_scaled.stop();
            isLFOon = 0;
        }

        // Mute main output rather than oscillator. Useful for discussing waveforms without constant sound
        if (toggle_mute.val) {
            p5.soundOut.output.gain.value = 0; // sets the output of the gain node to 0 so everything continues happening but no sound plays
            isMute = 1;
        } else {
            p5.soundOut.output.gain.value = 1; // resets the output value of the gain node
            isMute = 0;
        }

        // Toggle between oscillator types - mutually exclusive, and can't turn a toggle off and leave none active
        if (toggle_Type1.isPressed) { // Sine
            if (!toggle_Type1.val) { toggle_Type1.val = true; }
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sine';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type2.isPressed) { // Sawtooth
            if (!toggle_Type2.val) { toggle_Type2.val = true; }
            toggle_Type1.val = false;
            toggle_Type3.val = false;
            toggle_Type4.val = false;
            currentType = 'sawtooth';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type3.isPressed) { // Triangle
            if (!toggle_Type3.val) { toggle_Type3.val = true; }
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type4.val = false;
            currentType = 'triangle';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        } else if (toggle_Type4.isPressed) { // Square
            if (!toggle_Type4.val) { toggle_Type4.val = true; }
            toggle_Type1.val = false;
            toggle_Type2.val = false;
            toggle_Type3.val = false;
            currentType = 'square';
            oscillatorMain.setType(currentType);
            oscillatorCopy.setType(currentType);
        }

        // Slider gain osc1
        if (slider_gain.isChanged) {
            currentAmpMain = slider_gain.val;
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
        }

        // Slider freq osc1
        if (slider_freq.isChanged) {
            currentFreqMain = slider_freq.val;
            oscillatorCopy.freq(currentFreqMain);
            oscillatorMain.freq(currentFreqMain);
        }

        // Slider gain osc2 - modulator or LFO, therefore referred to as depth
        if (slider_depthLFO.isChanged) {
            currentAmpLFO = slider_depthLFO.val;
            oscillatorLFO.amp(currentAmpLFO, 0.01);
            oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01); //scaled for plotting
        }

        // Slider freq osc2
        if (slider_freqLFO.isChanged) {
            currentFreqLFO = slider_freqLFO.val;
            oscillatorLFO.freq(currentFreqLFO);
            oscillatorLFO_scaled.freq(currentFreqLFO); //for plotting purposes
        }

        // Filtering key presses for changing sliders with arrows
        if (keyIsPressed) {
            // Triggers every 4 frames to account for length of time pressing the key - effectively working at 15fps
            if (frameCount % 4 == true) {
                // If hover over main frequency slider and press left arrow
                if (slider_freq._hover && keyCode === LEFT_ARROW) { // decrease frequency by 1
                    if (currentFreqMain >= minFreq + 1) {
                        currentFreqMain -= 1;
                        slider_freq.val -= 1;
                        oscillatorMain.freq(currentFreqMain);
                        oscillatorCopy.freq(currentFreqMain);
                    }
                }
                // If hover over main frequency slider and press right arrow
                else if (slider_freq._hover && keyCode === RIGHT_ARROW) { // increase frequency by 1
                    if (currentFreqMain <= maxFreq - 1) {
                        currentFreqMain += 1;
                        slider_freq.val += 1;
                        oscillatorMain.freq(currentFreqMain);
                        oscillatorCopy.freq(currentFreqMain);
                    }
                }
                // If hover over main gain slider and press left arrow
                else if (slider_gain._hover && keyCode == LEFT_ARROW) { // decrease amplitude by 0.01
                    if (slider_gain.val >= 0.01) {
                        slider_gain.val -= 0.01;
                        currentAmpMain = slider_gain.val;
                        oscillatorMain.amp(currentAmpMain, 0.01);
                        oscillatorCopy.amp(currentAmpMain, 0.01);
                    }
                }
                // If hover over main gain slider and press right arrow
                else if (slider_gain._hover && keyCode == RIGHT_ARROW) { // increase amplitude by 0.01
                    if (slider_gain.val <= 0.99) {
                        slider_gain.val += 0.01;
                        currentAmpMain = slider_gain.val;
                        oscillatorMain.amp(currentAmpMain, 0.01);
                        oscillatorCopy.amp(currentAmpMain, 0.01);
                    }
                }
                // If hover over LFO frequency slider and press left arrow
                else if (slider_freqLFO._hover && keyCode === LEFT_ARROW) { // decrease LFO frequency by 0.01
                    if (currentFreqLFO >= minFreqLFO + 1) {
                        currentFreqLFO -= 1;
                        slider_freqLFO.val -= 1;
                        oscillatorLFO.freq(currentFreqLFO);
                        oscillatorLFO_scaled.freq(currentFreqLFO);
                    }
                }
                // If hover over LFO frequency slider and press right arrow
                else if (slider_freqLFO._hover && keyCode === RIGHT_ARROW) { // increase LFO frequency by 0.01
                    if (currentFreqLFO <= maxFreqLFO - 1) {
                        currentFreqLFO += 1;
                        slider_freqLFO.val += 1;
                        oscillatorLFO.freq(currentFreqLFO);
                        oscillatorLFO_scaled.freq(currentFreqLFO);
                    }
                }
                // If hover over LFO gain/depth slider and press left arrow
                else if (slider_depthLFO._hover && keyCode == LEFT_ARROW) { // decrease LFO gain by 1
                    if (currentAmpLFO >= 1) {
                        currentAmpLFO -= 1;
                        slider_depthLFO.val = currentAmpLFO;
                        oscillatorLFO.amp(currentAmpLFO, 0.01);
                        oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01);
                    }
                } else if (slider_depthLFO._hover && keyCode == RIGHT_ARROW) { // increase LFO gain by 1
                    if (currentAmpLFO <= 4999) {
                        currentAmpLFO += 1;
                        slider_depthLFO.val = currentAmpLFO;
                        oscillatorLFO.amp(currentAmpLFO, 0.01);
                        oscillatorLFO_scaled.amp(currentAmpLFO / 5000, 0.01);
                    }
                }
            }
        }

        // Switch to mainScene
        if (button_mainGui.isPressed) {
            mgr.showScene(mainScene);
        }
    }

    /*--- Other functions ---*/

    // Draw coloured boxes
    function drawRectangles() {
        let rounding = 10; // corner rounding
        stroke(255, 193, 84);
        strokeWeight(4);
        noFill();

        // left column
        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding);

        // centre column
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding);

        // right column
        rect(spacingOuter * 3 + colWidth * 2, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding);
        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding);
        noStroke();
        strokeWeight(1);
    }

    // Update All UI elements based on current values
    function setUIValues() {
        // UI toggle values
        if (isOn) {
            toggle_OnOff.val = 1;
        }

        if (isMute) {
            toggle_mute.val = 1;
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
        if (isLFOon) {
            toggle_OnOff2.val = true;
        }

        // Frequency and amplitude slider values
        slider_gain.val = currentAmpMain;
        slider_freq.val = currentFreqMain;
        slider_depthLFO.val = currentAmpLFO;
        slider_freqLFO.val = currentFreqLFO;
    }
}