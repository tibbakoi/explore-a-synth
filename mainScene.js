/*
Explore-a-Synth release v0.0.0

mainScene
- First scene to load
- Displays oscillator controls, filtering controls, X-Y pad, keyboard, waveform plot, loudspeaker icon and record functionality
- UI elements created using touchGUI
- Location of UI elements based on values set in instrumentv3 (colWidth, rowHeight, spacingOuter etc)

Author: Kat Young
https://github.com/tibbakoi
2020
*/

function mainScene() {
    let button_loudspeakerMore, button_soundMore; // navigation to other scenes
    // Oscillator related
    let toggle_OnOff; // power
    let toggle_controlType; // enable playing by keyboard
    let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 // osc type
    let toggle_mute; // overall mute control
    let slider_gain; // vol slider
    let button_SettingsSave, button_SettingsLoad; // buttons to save/load settings to/from text file
    let fileInput; // to load file into
    let waveform = 0; // somewhere to put the waveform
    let XY_freqAmp; // x-y control
    let envMain; // envelope for keyboard playing

    // Filtering controls
    let slider_eq0, slider_eq1, slider_eq2;
    let button_eqReset;

    // Help mode 
    let button_helpMode_sound, button_helpMode_input, button_helpMode_output;
    let helpMode_sound = 0; // flags for help mode off/on
    let helpMode_input = 0;
    let helpMode_output = 0;

    // Loudspeaker icon
    let ampAnalyser; // for analysing output level for loudspeaker animation
    let loudspeakerSize = 100;
    let loudspeakerX = (spacingOuter * 3) + (colWidth * 2.25);
    let loudspeakerY = (spacingOuter * 3) + (rowHeight * 1.5) + textBarHeight;

    // Recording functionality
    let toggle_record; //record enable
    let recorder, soundFile;
    let button_AudioPlayback, button_AudioSave;

    // Temp variables for holding current values when loading new ones in case load fails
    // Needs to be outside of draw function to avoid overwriting
    let currentType_temp, currentFreqMain_temp, currentAmpMain_temp, isLFOon_temp, currentFreqLFO_temp, currentAmpLFO_temp, eqGains_temp;

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
        guiMain = createGui();

        // Sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter * 2 + spacingInner + textBarHeight, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 1);
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter * 2 + spacingInner * 2 + buttonHeight + textBarHeight, buttonHeight, buttonHeight, 0);
        toggle_mute = createCheckbox("Mute", spacingOuter + colWidth - spacingInner - 110, spacingOuter * 2 + spacingInner + textBarHeight, buttonHeight, buttonHeight);
        toggle_mute.setStyle({
            fillCheck: color("red"),
            fillCheckHover: color("red"),
            fillCheckActive: color("red"),
        }); // all versions of the mute X are red

        // X-Y pad
        XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, 0, 1, minFreq, maxFreq);
        XY_freqAmp.setStyle({
            strokeBg: color(0, 196, 154),
            strokeBgHover: color(0, 196, 154),
            strokeBgActive: color(0, 196, 154)
        }); // set outline to match other colours

        // EQ sliders
        var sliderWidth = floor((colWidth - spacingInner * 4) / 3);
        var sliderHeight = rowHeight - buttonHeight - spacingInner * 2;
        slider_eq0 = createSliderV("low", spacingOuter + spacingInner, spacingOuter * 3 + textBarHeight + rowHeight + spacingInner + buttonHeight, sliderWidth, sliderHeight, -20, 20);
        slider_eq1 = createSliderV("mid", spacingOuter + spacingInner * 2 + sliderWidth, spacingOuter * 3 + textBarHeight + rowHeight + spacingInner + buttonHeight, sliderWidth, sliderHeight, -20, 20);
        slider_eq2 = createSliderV("high", spacingOuter + spacingInner * 3 + sliderWidth * 2, spacingOuter * 3 + textBarHeight + rowHeight + spacingInner + buttonHeight, sliderWidth, sliderHeight, -20, 20);
        button_eqReset = createButton("Reset", spacingOuter + spacingInner, spacingOuter * 3 + textBarHeight + spacingInner + rowHeight, 45, 45);
        button_eqReset.setStyle({
            textSize: 15,
        });

        // Keyboard enable toggle - off = X-Y pad, on = keyboard
        toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 3 + rowHeight + spacingInner + textBarHeight, buttonHeight, buttonHeight);

        // Record UI
        toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight);
        button_AudioPlayback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);
        button_AudioSave = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);

        // Save/load UI
        button_SettingsSave = createButton("Save", spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);
        button_SettingsLoad = createButton("Load", spacingOuter + spacingInner * 2 + 56, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);
        setUpFileReader(); //set up file selector for loading from text file

        // SceneManager switch buttons
        button_loudspeakerMore = createButton("More", spacingOuter * 3 + colWidth * 2.5 - spacingInner * 2 - 55, height - spacingOuter - spacingInner - 26, 55, 26);
        button_soundMore = createButton("More", spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);

        // Help mode buttons
        button_helpMode_sound = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_input = createButton("?", spacingOuter * 2 + colWidth * 2 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_output = createButton("?", spacingOuter * 3 + colWidth * 3 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        // Master volume slider
        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);

        /*--- Audio things specific to this scene ---*/
        recorder = new p5.SoundRecorder(); // no input specified = records everything happening within the sketch
        soundFile = new p5.SoundFile(); // file to put audio recording into
        envMain = new p5.Envelope(0.01, 1, 0.3, 0); // attack time, attack level, decay time, decay level
        ampAnalyser = new p5.Amplitude(); // amplitude analyser for output volume (used to plot loudspeaker icon)

        // Set status of UI elements and oscillators
        setOscillatorValues();
        setUIValues();

        // Reset
        noFill();
        stroke('white');

    }

    // Called whenever scene is switched to from another
    this.enter = function() {
        this.setup();
    }

    this.draw = function() {

        /*--- Figure out whether in help mode or not, change button style accordingly---*/

        // Sound section
        if (button_helpMode_sound.isPressed && helpMode_sound == 0) { // if button pressed to turn on 
            helpMode_sound = 1;
            button_helpMode_sound.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_sound.isPressed && helpMode_sound == 1) { // if button pressed to turn off
            helpMode_sound = 0;
            button_helpMode_sound.setStyle(helpButtonInactiveStyle);
        }
        // Input section
        if (button_helpMode_input.isPressed && helpMode_input == 0) { // if button pressed to turn on 
            helpMode_input = 1;
            button_helpMode_input.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_input.isPressed && helpMode_input == 1) { // if button pressed to turn off
            helpMode_input = 0;
            button_helpMode_input.setStyle(helpButtonInactiveStyle);
        }
        // Output section
        if (button_helpMode_output.isPressed && helpMode_output == 0) { // if button pressed to turn on 
            helpMode_output = 1;
            button_helpMode_output.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_output.isPressed && helpMode_output == 1) { // if button pressed to turn off
            helpMode_output = 0;
            button_helpMode_output.setStyle(helpButtonInactiveStyle);
        }

        /*--- Draw GUI stuff: rectangles, loudspeaker, LED, UI elements, text, keyboard ---*/

        drawGui(); // required by touchGUI 
        drawRectangles();
        drawLoudspeaker(loudspeakerX, loudspeakerY);
        drawRecordLED();

        // If mouse is NOT currently pressed within region where waveform is drawn, update waveform so the plot is live
        if (!(mouseIsPressed && mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > (spacingOuter * 2 + textBarHeight) && mouseY < (spacingOuter * 2 + textBarHeight + rowHeight))) {
            waveform = fftMain.waveform();
        } // Else plot the static waveform to 'pause' the plot
        drawWaveform(waveform, colWidth * 2 + spacingOuter * 3, width - spacingOuter, rowHeight + textBarHeight + spacingOuter * 2 - 1, spacingOuter * 2 + 1 + textBarHeight);

        // Draw various bits of text
        fill("white");
        textSize(25);
        textAlign(LEFT, CENTER);
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Mute', spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Keyboard', spacingOuter * 2 + spacingInner * 2 + colWidth + 50, spacingOuter * 3 + textBarHeight + spacingInner + rowHeight + 25);
        textAlign(CENTER, CENTER);
        text('Filtering', spacingOuter + spacingInner + colWidth / 2, spacingOuter * 3 + spacingInner + textBarHeight + rowHeight + 20)
        text('Record', spacingOuter * 3 + spacingInner + colWidth * 2.75, spacingOuter * 3 + textBarHeight + spacingInner + rowHeight + 15);
        textAlign(LEFT, CENTER);
        textSize(15)
        text("Vol: " + round(slider_gain.val, 1), spacingOuter + colWidth - spacingInner * 2 - 42, spacingOuter * 2 + textBarHeight + rowHeight - 65)
        text("Low", spacingOuter + spacingInner + 30, spacingOuter * 3 + spacingInner + textBarHeight + rowHeight + 65);
        text("Mid", spacingOuter + spacingInner + 130, spacingOuter * 3 + spacingInner + textBarHeight + rowHeight + 65);
        text("High", spacingOuter + spacingInner + 230, spacingOuter * 3 + spacingInner + textBarHeight + rowHeight + 65);
        textAlign(CENTER, CENTER);
        text('Amplitude', spacingOuter * 3 + spacingInner + colWidth * 1.5, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner * 2)
        push() // so can rotate 'Frequency' label and have it in the correct place
        translate(spacingOuter * 2 + spacingInner * 2 + colWidth, spacingOuter * 2 + textBarHeight + rowHeight * 0.5)
        rotate(radians(-90))
        text('Frequency', 0, 0)
        pop()
        textAlign(LEFT, CENTER);

        textSize(25)

        // Draw top row of text
        textAlign(CENTER, CENTER)
        text("This is where we design the sound.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is where our inputs control the sound.", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is where the output sound is represented.", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter + spacingInner, colWidth - spacingInner, textBarHeight);

        // Draw frequency label on X-Y pad
        textAlign(RIGHT, CENTER);
        textSize(18)
        if (currentFreqMain > 1000) {
            text(round(currentFreqMain / 1000, 1) + "kHz", spacingOuter * 2 + colWidth * 2 - spacingInner, spacingOuter * 2 + textBarHeight + spacingInner * 2)
        } else {
            text(round(currentFreqMain) + "Hz", spacingOuter * 2 + colWidth * 2 - spacingInner, spacingOuter * 2 + textBarHeight + spacingInner * 2)
        }
        textAlign(LEFT, CENTER); // reset
        noFill();

        // Display oscillator type label based on which toggle is active
        changeTypeLabel(toggle_Type1.val, toggle_Type2.val, toggle_Type3.val, toggle_Type4.val);

        // Draw active/inactive keyboard
        if (toggle_controlType.val) {
            drawKeyboard(1); // active keyboard
            drawOctaveIndicator(currentOctave);
        } else {
            drawKeyboard(0); // inactive keyboard
        }

        /*--- Draw help mode boxes if help mode has been activated - draw on top of everything else. 
        When each UI element is hovered over, display pop-up help box ---*/
        if (helpMode_sound) { // if left-most help button pressed
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
            if (button_SettingsSave._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Save current values", 150, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (button_SettingsLoad._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 150, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Load values from file", 150, 150, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (button_eqReset._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 350, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Set filtering sliders to 0", 150, 350, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_eq0._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 350, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Reduce / increase low frequencies", 150, 350, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_eq1._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 350, 150, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Reduce / increase mid frequencies", 150, 350, 150, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
            if (slider_eq2._hover) {
                fill(184, 216, 216);
                textAlign(CENTER, CENTER)
                rectMode(CENTER)
                rect(150, 350, 155, 90, 10, 10);
                stroke("black")
                fill(34, 43, 48)
                text("Reduce / increase high frequencies", 150, 350, 160, 150)
                noFill();
                noStroke();
                rectMode(CORNER)
                textAlign(LEFT, CENTER)
            }
        }
        if (helpMode_input) { // if central help button pressed
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
        if (helpMode_output) { // if right-most help button pressed
            // If within region where waveform is plotted
            if (mouseX > (spacingOuter * 3 + colWidth * 2) && mouseX < (width - spacingOuter) && mouseY > (spacingOuter * 2 + textBarHeight) && mouseY < (spacingOuter * 2 + textBarHeight + rowHeight)) {
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
            if (button_AudioPlayback._hover) {
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
            if (button_AudioSave._hover) {
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

        /*--- Define UI interactions.
        Note - touchGUI differs from p5 implementation: touchGUI uses if statements rather than events (see documentation for more info) ---*/

        // Turn synth on/off
        if (toggle_OnOff.val) {
            if (!oscillatorMain.started) { // to avoid repeatedly starting the oscillator
                oscillatorMain.start();
                oscillatorCopy.start();
                isOn = 1;
            }
        } else {
            oscillatorMain.stop();
            oscillatorCopy.stop();
            isOn = 0;
        }

        // Mute main output rather than oscillator. Useful for discussing waveforms without constant sound
        // Also stops animation of loudspeaker
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

        // Change EQ band gains
        if (slider_eq0.isChanged) {
            eqGains[0] = slider_eq0.val;
            eq.bands[0].gain(eqGains[0]);
        }
        if (slider_eq1.isChanged) {
            eqGains[1] = slider_eq1.val;
            eq.bands[1].gain(eqGains[1]);
        }
        if (slider_eq2.isChanged) {
            eqGains[2] = slider_eq2.val;
            eq.bands[2].gain(eqGains[2]);
        }

        // Reset EQ gains and sliders to 0
        if (button_eqReset.isPressed) {
            // Reset sliders
            slider_eq0.val = 0;
            slider_eq1.val = 0;
            slider_eq2.val = 0;
            // Reset gain values - needs doing because sliders are not changed by user, therefore does not trigger change
            for (let i = 0; i < 3; i++) {
                eq.bands[i].gain(0);
            }
        }

        // Save synth settings to a text file
        if (button_SettingsSave.isPressed) {
            // Create list from variables
            let settingsList = [str(currentType), str(currentFreqMain), str(currentAmpMain), str(isLFOon), str(currentFreqLFO), str(currentAmpLFO), eqGains.toString()];
            // Save to text file using default download location
            saveStrings(settingsList, 'synthSettings.txt');
        }

        // Store current values and simulate clicking on a file selector to load in data from text file
        if (button_SettingsLoad.isPressed) {
            // Store current values in case load fails
            currentType_temp = currentType;
            currentFreqMain_temp = currentFreqMain;
            currentAmpMain_temp = currentAmpMain;
            isLFOon_temp = isLFOon;
            currentFreqLFO_temp = currentFreqLFO;
            currentAmpLFO_temp = currentAmpLFO;
            eqGains_temp = eqGains;

            // Simulate the click to open the file selector - triggers functionality defined in setupFileReader()
            fileInput.click();
        }

        // X-Y frequency/amplitude control - when keyboard is disabled
        if (XY_freqAmp.isChanged && !toggle_controlType.val) {
            // Store values
            currentAmpMain = XY_freqAmp.valX * slider_gain.val; // amplitude is related to both X-Y pad and main slider
            currentFreqMain = XY_freqAmp.valY;
            // Set oscillator variables
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
            oscillatorMain.freq(currentFreqMain);
            oscillatorCopy.freq(currentFreqMain);
        }

        // Slider amplitude control
        if (slider_gain.isChanged) {
            currentAmpMain = XY_freqAmp.valX * slider_gain.val; // amplitude is related to both X-Y pad and main slider
            if (!toggle_controlType.val) { // only change oscillator amplitude if keyboard is not enabled as this can causes constant sound if changed when keyboard is in use
                oscillatorMain.amp(currentAmpMain, 0.01);
                oscillatorCopy.amp(currentAmpMain, 0.01);
            }
        }

        // If keyboard enabled, multiply the envelope by slider value
        if (toggle_controlType.val) {
            envMain.mult(slider_gain.val);
        }

        // When turning keyboard mode on, set oscillator gain to 0 to avoid constant sound
        if (toggle_controlType.isPressed && toggle_controlType.val) {
            oscillatorMain.amp(0);
            oscillatorCopy.amp(0);
        }

        // When turning keyboard mode off, set gain back to current gain value
        if (toggle_controlType.isPressed && !toggle_controlType.val) {
            oscillatorMain.amp(currentAmpMain);
            oscillatorCopy.amp(currentAmpMain);
        }

        // Filtering key presses for playing via keyboard input and changing sliders with arrows
        if (keyIsPressed) {
            // If keyboard input is enabled - play notes with letters and numbers
            if (toggle_controlType.val) {
                // If one of the numbers has been pressed, change octave, play note and draw indicator
                if (Number(key) > 0 && Number(key) < 9) {
                    currentOctave = (Number(key) + 1) * 12; //convert 1-8 to MIDI note 
                    playNote();
                    drawOctaveIndicator(currentOctave);
                }
                // If another key has been pressed, change note (if correct letter), play note and draw indicator
                else {
                    switch (key) {
                        case "a": // C
                            currentNote = 0;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "w": // C#
                            currentNote = 1;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "s": // D
                            currentNote = 2;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "e": // D#
                            currentNote = 3;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "d": // E
                            currentNote = 4;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "f": // F
                            currentNote = 5;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "t": // F#
                            currentNote = 6;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "g": // G
                            currentNote = 7;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "y": // G#
                            currentNote = 8;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "h": // A
                            currentNote = 9;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "u": // A#
                            currentNote = 10;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "j": // B
                            currentNote = 11;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                        case "k": // C
                            currentNote = 12;
                            playNote();
                            drawKeyboardIndicator(currentNote);
                            break;
                    }
                }
            }
            // If hover over XY pad (triggers every 4 frames ie 15fps) - nudge slider value with arrows
            else if (XY_freqAmp._hover && frameCount % 4 == true) {
                switch (keyCode) {
                    case UP_ARROW: // increase frequency by 1
                        if (currentFreqMain <= maxFreq - 1) {
                            currentFreqMain += 1;
                            XY_freqAmp.valY = currentFreqMain;
                            oscillatorMain.freq(currentFreqMain);
                            oscillatorCopy.freq(currentFreqMain);
                        }
                        break;
                    case DOWN_ARROW: // decrease frequency by 1
                        if (currentFreqMain >= minFreq + 1) {
                            currentFreqMain -= 1;
                            XY_freqAmp.valY = currentFreqMain;
                            oscillatorMain.freq(currentFreqMain);
                            oscillatorCopy.freq(currentFreqMain);
                        }
                        break;
                    case LEFT_ARROW: // decrease amplitude by 0.01 within XY pad
                        if (XY_freqAmp.valX >= 0.01) {
                            XY_freqAmp.valX -= 0.01;
                            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
                            oscillatorMain.amp(currentAmpMain, 0.01);
                            oscillatorCopy.amp(currentAmpMain, 0.01);
                        }
                        break;
                    case RIGHT_ARROW: // increase amplitude by 0.01 within XY pad
                        if (XY_freqAmp.valX <= 0.99) {
                            XY_freqAmp.valX += 0.01;
                            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
                            oscillatorMain.amp(currentAmpMain, 0.01);
                            oscillatorCopy.amp(currentAmpMain, 0.01);
                        }
                        break;
                }
            }
            // If hover over volume slider (triggers every 4 frames ie 15fps) - nudge slider value with arrows
            else if (slider_gain._hover && frameCount % 4 == true) {
                switch (keyCode) {
                    case LEFT_ARROW: // decrease amplitude by 0.01
                        if (slider_gain.val >= 0.01) {
                            slider_gain.val -= 0.01;
                            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
                            oscillatorMain.amp(currentAmpMain, 0.01);
                            oscillatorCopy.amp(currentAmpMain, 0.01);
                        }
                        break;
                    case RIGHT_ARROW: // increase amplitude by 0.01
                        if (slider_gain.val <= 0.99) {
                            slider_gain.val += 0.01;
                            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
                            oscillatorMain.amp(currentAmpMain, 0.01);
                            oscillatorCopy.amp(currentAmpMain, 0.01);
                        }
                        break;
                }
            }
        }

        // Turn recording on/off
        if (toggle_record.isPressed) {
            if (toggle_record.val) { // turned on
                recorder.record(soundFile);
            } else { // turned off having been turned on
                recorder.stop();
            }
        }

        // Play recorded file, if exists
        if (button_AudioPlayback.isPressed && soundFile.duration() > 0) { // make sure sound file exists...
            soundFile.play();
        }

        // Turn play button green when sound file is playing
        if (soundFile.isPlaying()) {
            button_AudioPlayback.setStyle({
                fillBg: color("green"),
            });
        } else {
            button_AudioPlayback.setStyle({
                fillBg: color(130),
            });
        }

        // Save recorded file to default location, if exists
        if (button_AudioSave.isPressed && soundFile.duration() > 0) { // make sure sound file exists...
            save(soundFile, 'MySoundFile.wav');
        }

        // Switch to soundScene
        if (button_soundMore.isPressed) {
            mgr.showScene(soundScene);
        }

        // Switch to loudspeakerScene
        if (button_loudspeakerMore.isPressed) {
            mgr.showScene(loudspeakerScene);
        }
    }

    /*--- Other functions ---*/

    // Play oscillator using envelope at MIDI note
    function playNote() {
        currentFreqMain = midiToFreq(currentNote + currentOctave);
        oscillatorMain.freq(currentFreqMain);
        oscillatorCopy.freq(currentFreqMain);
        envMain.play(oscillatorMain); // play with envelope
        // NB - all other osc are disconnected, and putting through env sets amp to 0 on them, so are not touched here
    }

    // Draw fake LED recording indicator
    function drawRecordLED() {
        if (frameCount % 60 > 29 && toggle_record.val) { // if recording enabled, flash on/off once a second
            fill("red");
            circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, height - buttonHeight * 3 - spacingOuter - spacingInner * 3 + 15, 20);
            noFill();
        } else { // draw as 'unlit'
            fill("darkred");
            circle(spacingOuter * 3 + spacingInner * 2 + colWidth * 2 + 250, height - buttonHeight * 3 - spacingOuter - spacingInner * 3 + 15, 20);
            noFill();
        }
    }

    // Draw coloured boxes
    function drawRectangles() {
        let rounding = 10; // corner rounding
        strokeWeight(4);
        // Sound - left column in yellow
        stroke(255, 193, 84);
        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding);
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding);
        rect(spacingOuter, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding);

        // Inputs - central column in turquoise
        stroke(0, 196, 154)
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter * 2 + colWidth, spacingOuter * 3 + rowHeight + textBarHeight, colWidth, rowHeight, rounding, rounding);

        // Outputs - right column in purple
        stroke(88, 44, 77)
        rect(spacingOuter * 3 + colWidth * 2, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding);
        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding);
        rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding);
    }

    // Draw and animate loudspeaker graphic, centered at (x, y)
    function drawLoudspeaker(x, y) {
        strokeWeight(1);
        stroke(0);
        // Get output amplitude - not a value from a UI element
        var ampLevel = ampAnalyser.getLevel();

        // Change the size based on the output level every 3 frames, if the synth is turned on
        if (frameCount % 3 == true && toggle_OnOff.val) {
            loudspeakerSize = 100 + random(0, 10) * ampLevel * 4; //*4 to give more visual change
        }

        // Draw at that size every frame
        fill("grey");
        circle(x, y, loudspeakerSize);
        fill("black");
        circle(x, y, loudspeakerSize * 0.9);
        fill("grey");
        circle(x, y, loudspeakerSize * 0.8);
        fill("black");
        circle(x, y, loudspeakerSize * 0.4);
        noFill();
    }

    // Draw keyboard - active or inactive (different transparency)
    function drawKeyboard(activeFlag) {
        let keyWidth = 36;
        let keyHeight = 50;
        let transparencyValue;

        stroke("grey");

        // Change transparency based on active/inactive
        if (activeFlag) {
            transparencyValue = 255;
        } else {
            transparencyValue = 0.5 * 255;
        }

        // Draw white keys
        fill(255, 255, 255, transparencyValue);
        for (let i = 0; i < 8; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + (i * keyWidth), height - spacingOuter - keyHeight * 2, keyWidth, keyHeight * 1.75);
        }
        // Draw black keys 
        fill(0, 0, 0, transparencyValue);
        for (let i = 0; i < 2; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth) + 4, height - spacingOuter - keyHeight * 2, keyWidth - 8, keyHeight);
        }
        for (let i = 3; i < 6; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth) + 4, height - spacingOuter - keyHeight * 2, keyWidth - 8, keyHeight);
        }

        // Draw octave boxes and numbers
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

    // Draw indicator at current note on keyboard
    function drawKeyboardIndicator(currentNote) {
        let whiteNoteOffsetVertical = 30;
        let blackNoteOffsetVertical = 70;
        let horizIncrement, verticalOffset;

        // Calculate multiple of horizontal increment - accounting for non-uniform spacing
        if (currentNote < 5) {
            horizIncrement = 1;
        } else if (currentNote > 4 && currentNote < 12) {
            horizIncrement = 2;
        } else {
            horizIncrement = 3;
        }

        // Change y offset - different for white/black notes
        if (currentNote == 1 || currentNote == 3 || currentNote == 6 || currentNote == 8 || currentNote == 10) {
            verticalOffset = blackNoteOffsetVertical;
        } else {
            verticalOffset = whiteNoteOffsetVertical;
        }

        // Calculate location to draw
        x = spacingOuter * 2 + colWidth + spacingInner + 18 * (currentNote + horizIncrement);
        y = height - spacingOuter - verticalOffset;

        // Draw indicator
        fill("red");
        circle(x, y, 10);
        noFill();
    }

    // Draw letters on keyboard
    function drawKeyboardHelp() {
        let whiteNoteOffsetVertical = 30;
        let blackNoteOffsetVertical = 70;
        let horizIncrement, verticalOffset;
        letters = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k"];

        for (let j = 0; j < 13; j++) { // for each of the 13 keys

            // Calculate multiple of horizontal increment - accounting for non-uniform spacing
            if (j < 5) {
                horizIncrement = 1;
            } else if (j > 4 && j < 12) {
                horizIncrement = 2;
            } else {
                horizIncrement = 3;
            }

            // Change y offset - different for white/black notes
            if (j == 1 || j == 3 || j == 6 || j == 8 || j == 10) {
                verticalOffset = blackNoteOffsetVertical;
            } else {
                verticalOffset = whiteNoteOffsetVertical;
            }

            // Calculate location to draw
            x = spacingOuter * 2 + colWidth + spacingInner + 18 * (j + horizIncrement);
            y = height - spacingOuter - verticalOffset;

            // Draw letters
            fill("red")
            text(letters[j], x, y, 10);
            noFill();
        }
    }

    // Draw indicator at current octave on keyboard
    function drawOctaveIndicator(currentOctave) {

        // Calculate increment from current octave MIDI value
        let activeOctave = currentOctave / 12 - 1;

        // Draw circle
        stroke("red");
        noFill();
        circle(spacingOuter * 2 + colWidth + spacingInner + ((activeOctave * 2) - 1) * 18, height - spacingOuter - 50 * 2 - 18, 15);
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

        // Frequency and amplitude
        XY_freqAmp.valX = 1;
        XY_freqAmp.valY = currentFreqMain;
        slider_gain.val = currentAmpMain;

        // EQ gains & slider gains
        for (let i = 0; i < 3; i++) {
            eq.bands[i].gain(eqGains[i]);
        }
        slider_eq0.val = eqGains[0];
        slider_eq1.val = eqGains[1];
        slider_eq2.val = eqGains[2];
    }

    // Set up file reader for processing text files
    function setUpFileReader() {

        // Adapted from https://stackoverflow.com/a/40971885
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        // Do stuff with file once selected
        fileInput.onchange = e => {
            var file = e.target.files[0]; // Get file reference
            var reader = new FileReader(); // Set up file reader to get contents of file
            reader.readAsText(file, 'UTF-8'); // Read file

            // Specify what to do when have read the file
            reader.onload = readerEvent => {
                // Stop oscillators so don't get multiple sounds at once
                oscillatorMain.stop();
                oscillatorCopy.stop();
                oscillatorLFO.stop();

                // Get content of file
                var content = readerEvent.target.result;

                // Assign content to variables in turn: type, freqMain, ampMain, isLFOon, freqLFO, ampLFO, eqGains
                // Determine if values are valid - throw error if any are incorrect, assign to variables if correct
                try {
                    // Waveform type
                    var n = content.search("\n"); //find the carriage return
                    var currentType_read = content.slice(0, n); //assign the slice to currentType
                    var contentShortened = content.slice(n + 1, content.length); //make shortened version for next variable
                    if (!(currentType_read == 'sine' || currentType_read == 'triangle' || currentType_read == 'sawtooth' || currentType_read == 'square')) {
                        throw new Error('Invalid oscillator type');
                    } else {
                        currentType = currentType_read;
                    }

                    // FreqMain
                    n = contentShortened.search("\n"); //find CR
                    var currentFreqMain_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    if (isNaN(currentFreqMain_read) || currentFreqMain_read > maxFreq || currentFreqMain_read < minFreq) {
                        throw new Error('Invalid frequency value');
                    } else {
                        currentFreqMain = currentFreqMain_read;
                    }

                    // AmpMain
                    n = contentShortened.search("\n"); //find CR
                    var currentAmpMain_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    if (isNaN(currentAmpMain_read) || currentAmpMain_read > 1 || currentFreqMain < 0) {
                        throw new Error('Invalid amplitude value');
                    } else {
                        currentAmpMain = currentAmpMain_read;
                    }

                    // IsLFOon
                    n = contentShortened.search("\n"); //find CR
                    var isLFOon_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    if (isNaN(isLFOon_read) || !(isLFOon_read == 1 || isLFOon == 0)) {
                        throw new Error('Invalid LFO flag value');
                    } else {
                        isLFOon = isLFOon_read;
                    }

                    // FreqLFO
                    n = contentShortened.search("\n"); //find CR
                    var currentFreqLFO_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    if (isNaN(currentFreqLFO_read) || currentFreqLFO_read > midiToFreq(120) || currentFreqLFO_read < midiToFreq(1)) {
                        throw new Error('Invalid LFO frequency value');
                    } else {
                        currentFreqLFO = currentFreqLFO_read;
                    }

                    // AmpLFO
                    n = contentShortened.search("\n"); //find CR
                    var currentAmpLFO_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    if (isNaN(currentAmpLFO_read) || currentAmpLFO_read > 5000 || currentAmpLFO_read < 0) {
                        throw new Error('Invalid LFO amplitude value');
                    } else {
                        currentAmpLFO = currentAmpLFO_read;
                    }

                    // EqGains
                    n = contentShortened.search("\n"); //find CR
                    eqString = contentShortened.slice(0, n).split(',');
                    var eqGains_read0 = parseFloat(eqString[0]);
                    var eqGains_read1 = parseFloat(eqString[1]);
                    var eqGains_read2 = parseFloat(eqString[2]);
                    if (isNaN(eqGains_read0) || isNaN(eqGains_read1) || isNaN(eqGains_read2)) {
                        throw new Error('Invalid filtering slider values');
                    } else if (eqGains_read0 > 20 || eqGains_read0 < -20 || eqGains_read1 > 20 || eqGains_read1 < -20 || eqGains_read2 > 20 || eqGains_read2 < -20) {
                        throw new Error('Filtering slider values out of range');
                    }

                } // If error is thrown, display dialogue box and reset to previous values
                catch (error) {
                    alert("Invalid text file");

                    // Reset to previous values
                    currentType = currentType_temp;
                    currentFreqMain = currentFreqMain_temp;
                    currentAmpMain = currentAmpMain_temp;
                    isLFOon = isLFOon_temp;
                    currentFreqLFO = currentFreqLFO_temp;
                    currentAmpLFO = currentAmpLFO_temp;
                    eqGains = eqGains_temp;

                } finally {
                    // Reset UI with either the loaded values or the previous values
                    setOscillatorValues();
                    setUIValues();
                }
            };
        };
    }
}