// main instrument scene
function mainScene() {
    let button_loudspeakerMore, button_soundMore;
    let waveform = 0;
    let slider_gain;
    let slider_eq0, slider_eq1, slider_eq2;
    let button_eqReset;
    let button_helpMode_sound, button_helpMode_input, button_helpMode_output;
    let helpMode_sound = 0;
    let helpMode_input = 0;
    let helpMode_output = 0;
    let loudspeakerWidth = 100;
    let loudspeakerX = (spacingOuter * 3) + (colWidth * 2.25);;
    let loudspeakerY = (spacingOuter * 3) + (rowHeight * 1.5) + textBarHeight;
    let recorder, soundFile;
    let button_AudioPlayback, button_AudioSave;
    let button_SettingsSave, button_SettingsLoad;
    let envMain;
    let fileInput;

    //temp for holding values when loading new ones
    //needs to be outside of function to avoid overwriting
    let currentType_temp, currentFreqMain_temp, currentAmpMain_temp, isLFOon_temp, currentFreqLFO_temp, currentAmpLFO_temp, eqGains_temp;

    //styling for help buttons
    let helpButtonActiveStyle = {
        fillBg: color("white"),
    };

    let helpButtonInactiveStyle = {
        fillBg: color(130),
    };

    this.setup = function() {

        //UI objects using touchGUI library
        guiMain = createGui();

        // sound settings toggles
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
        }); //all versions of the X are red

        //X-Y pad
        XY_freqAmp = createSlider2d("freqAmp", colWidth + spacingOuter * 2, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, 0, 1, minFreq, maxFreq);
        XY_freqAmp.setStyle({
            strokeBg: color(0, 196, 154),
            strokeBgHover: color(0, 196, 154),
            strokeBgActive: color(0, 196, 154)
        });

        //eq sliders
        var sliderWidth = floor((colWidth - spacingInner * 4) / 3);
        var sliderHeight = rowHeight - buttonHeight - spacingInner * 2;
        slider_eq0 = createSliderV("low", spacingOuter + spacingInner, spacingOuter * 3 + textBarHeight + rowHeight + spacingInner + buttonHeight, sliderWidth, sliderHeight, -20, 20);
        slider_eq1 = createSliderV("mid", spacingOuter + spacingInner * 2 + sliderWidth, spacingOuter * 3 + textBarHeight + rowHeight + spacingInner + buttonHeight, sliderWidth, sliderHeight, -20, 20);
        slider_eq2 = createSliderV("high", spacingOuter + spacingInner * 3 + sliderWidth * 2, spacingOuter * 3 + textBarHeight + rowHeight + spacingInner + buttonHeight, sliderWidth, sliderHeight, -20, 20);
        button_eqReset = createButton("Reset", spacingOuter + spacingInner, spacingOuter * 3 + textBarHeight + spacingInner + rowHeight, 45, 45);
        button_eqReset.setStyle({
            textSize: 15,
        });

        //keyboard toggles
        toggle_controlType = createCheckbox("control", spacingOuter * 2 + colWidth + spacingInner, spacingOuter * 3 + rowHeight + spacingInner + textBarHeight, buttonHeight, buttonHeight);

        //record UI
        toggle_record = createCheckbox("recording", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 3 - spacingOuter - spacingInner * 3, buttonHeight, buttonHeight);
        button_AudioPlayback = createButton("Play", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight * 2 - spacingOuter - spacingInner * 2, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);
        button_AudioSave = createButton("Save", spacingOuter * 3 + colWidth * 2.5 + spacingInner * 2, height - buttonHeight - spacingOuter - spacingInner, colWidth / 2 - spacingOuter - spacingInner, buttonHeight);

        //save/load UI
        button_SettingsSave = createButton("Save", spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);
        button_SettingsLoad = createButton("Load", spacingOuter + spacingInner * 2 + 56, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);

        //set up file selector
        setUpFileReader();

        // scene manager switch buttons
        button_loudspeakerMore = createButton("More", spacingOuter * 3 + colWidth * 2.5 - spacingInner * 2 - 55, height - spacingOuter - spacingInner - 26, 55, 26);
        button_soundMore = createButton("More", spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + rowHeight - spacingInner - 26, 55, 26);

        //help mode buttons
        button_helpMode_sound = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_input = createButton("?", spacingOuter * 2 + colWidth * 2 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);
        button_helpMode_output = createButton("?", spacingOuter * 3 + colWidth * 3 - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        //audio things
        recorder = new p5.SoundRecorder(); //no input specified = records everything happening within the sketch
        soundFile = new p5.SoundFile();
        envMain = new p5.Envelope(0.01, 1, 0.3, 0); // attack time, attack level, decay time, decay level

        //master volume slider - set to currentAmpMain
        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);

        noFill();
        stroke('white');

        //set status of UI elements and oscillators
        setOscillatorValues();
        setUIValues();

    };

    this.enter = function() {
        this.setup();
    };

    this.draw = function() {

        //---- figure out whether in help mode or not, change button style ----//
        //sound section
        if (button_helpMode_sound.isPressed && helpMode_sound == 0) { //if button pressed to turn on 
            helpMode_sound = 1;
            button_helpMode_sound.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_sound.isPressed && helpMode_sound == 1) { //if button pressed to turn off
            helpMode_sound = 0;
            button_helpMode_sound.setStyle(helpButtonInactiveStyle);
        }
        //input section
        if (button_helpMode_input.isPressed && helpMode_input == 0) { //if button pressed to turn on 
            helpMode_input = 1;
            button_helpMode_input.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_input.isPressed && helpMode_input == 1) { //if button pressed to turn off
            helpMode_input = 0;
            button_helpMode_input.setStyle(helpButtonInactiveStyle);
        }
        //output section
        if (button_helpMode_output.isPressed && helpMode_output == 0) { //if button pressed to turn on 
            helpMode_output = 1;
            button_helpMode_output.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_output.isPressed && helpMode_output == 1) { //if button pressed to turn off
            helpMode_output = 0;
            button_helpMode_output.setStyle(helpButtonInactiveStyle);
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
        push()
        translate(spacingOuter * 2 + spacingInner * 2 + colWidth, spacingOuter * 2 + textBarHeight + rowHeight * 0.5)
        rotate(radians(-90))
        text('Frequency', 0, 0)
        pop()
        textAlign(LEFT, CENTER);

        textSize(25)

        //explainer boxes
        textAlign(CENTER, CENTER)
        text("This is where we design the sound.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is where our inputs control the sound.", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is where the output sound is represented.", spacingOuter * 3 + spacingInner + colWidth * 2, spacingOuter + spacingInner, colWidth - spacingInner, textBarHeight);

        //slider text labels
        textAlign(RIGHT, CENTER);
        textSize(18)
        if (XY_freqAmp.valY > 1000) {
            text(round(XY_freqAmp.valY / 1000, 1) + "kHz", spacingOuter * 2 + colWidth * 2 - spacingInner, spacingOuter * 2 + textBarHeight + spacingInner * 2)
        } else {
            text(round(XY_freqAmp.valY) + "Hz", spacingOuter * 2 + colWidth * 2 - spacingInner, spacingOuter * 2 + textBarHeight + spacingInner * 2)
        }
        textAlign(LEFT, CENTER);
        noFill();

        //display osc type label based on which toggle is active
        changeTypeLabel();

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

        //filtering
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

        if (button_eqReset.isPressed) {
            //reset sliders
            slider_eq0.val = 0;
            slider_eq1.val = 0;
            slider_eq2.val = 0;
            //reset gain values - needs doing because sliders are not changed by user, therefore does not trigger change
            for (let i = 0; i < 3; i++) {
                eq.bands[i].gain(0);
            }
        }

        //save synth settings to a text file
        if (button_SettingsSave.isPressed) {
            //create list from variables
            let settingsList = [str(currentType), str(currentFreqMain), str(currentAmpMain), str(isLFOon), str(currentFreqLFO), str(currentAmpLFO), eqGains.toString()];
            //save to text file
            saveStrings(settingsList, 'synthSettings.txt');
        }

        if (button_SettingsLoad.isPressed) {
            //store current values in case load fails
            currentType_temp = currentType;
            currentFreqMain_temp = currentFreqMain;
            currentAmpMain_temp = currentAmpMain;
            isLFOon_temp = isLFOon;
            currentFreqLFO_temp = currentFreqLFO;
            currentAmpLFO_temp = currentAmpLFO;
            eqGains_temp = eqGains;

            //simulate the click to open the file selector
            fileInput.click();
        }

        //X-Y frequency/amplitude control - only when keyboard isn't enabled - otherwise too many amplitude values at once
        if (XY_freqAmp.isChanged && !toggle_controlType.val) {
            //store values
            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
            currentFreqMain = XY_freqAmp.valY;
            //set osc variables
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
            oscillatorMain.freq(currentFreqMain);
            oscillatorCopy.freq(currentFreqMain);
        }

        //slider amplitude control
        if (slider_gain.isChanged) {
            currentAmpMain = XY_freqAmp.valX * slider_gain.val;
            if (!toggle_controlType.val) { //do not change osc amplitude if keyboard enabled
                oscillatorMain.amp(currentAmpMain, 0.01);
                oscillatorCopy.amp(currentAmpMain, 0.01);
            }
        }

        //if in keyboard board, multiply the envelope when slider val changes
        if (toggle_controlType.val) {
            envMain.mult(slider_gain.val);
        }

        //if turning keyboard mode on , set gain to 0 to avoid constant droning
        if (toggle_controlType.isPressed && toggle_controlType.val) {
            oscillatorMain.amp(0);
            oscillatorCopy.amp(0);
        }

        //if turning keyboard mode off, set gain back to current gain value
        if (toggle_controlType.isPressed && !toggle_controlType.val) {
            oscillatorMain.amp(currentAmpMain);
            oscillatorCopy.amp(currentAmpMain);
        }

        //playing via keyboard(1=keyboard on) and changing freq with arrows
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
            } else if (XY_freqAmp._hover && frameCount % 4 == true) { //if hover over XY pad (triggers every 4 frames ie 15fps)
                if (keyCode === UP_ARROW) { //UP increase frequency
                    currentFreqMain += 1;
                    XY_freqAmp.valY = currentFreqMain;
                    oscillatorMain.freq(currentFreqMain);
                    oscillatorCopy.freq(currentFreqMain);
                } else if (keyCode === DOWN_ARROW) { //down decrease frequency
                    currentFreqMain -= 1;
                    XY_freqAmp.valY = currentFreqMain;
                    oscillatorMain.freq(currentFreqMain);
                    oscillatorCopy.freq(currentFreqMain);
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
        if (button_AudioPlayback.isPressed && soundFile.duration() > 0) { //make sure sound file exists...
            soundFile.play();
        }

        //turn play button green when sound file is playing
        if (soundFile.isPlaying()) {
            button_AudioPlayback.setStyle({
                fillBg: color("green"),
            });
        } else {
            button_AudioPlayback.setStyle({
                fillBg: color(130),
            });
        }

        // save recorded file, if exists
        if (button_AudioSave.isPressed && soundFile.duration() > 0) { //make sure sound file exists...
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

    function setUpFileReader() {

        //from https://stackoverflow.com/a/40971885
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        //do stuff with file once selected
        fileInput.onchange = e => {
            var file = e.target.files[0]; //get file reference
            var reader = new FileReader(); //set up file reader to get contents of file
            reader.readAsText(file, 'UTF-8'); //read file

            //what to do when have read file
            reader.onload = readerEvent => {
                //stop oscillators so don't get multiple sounds at once
                oscillatorMain.stop();
                oscillatorCopy.stop();
                oscillatorLFO.stop();

                //get content of file
                var content = readerEvent.target.result;

                //assign content to variables in order: type, freqMain, ampMain, isLFOon, freqLFO, ampLFO, eqGains
                //determine if values are valid - throw error if any are incorrect, assign to correct variables if correct
                try {
                    //waveform type
                    var n = content.search("\n"); //find the carriage return
                    var currentType_read = content.slice(0, n); //assign the slice to currentType
                    var contentShortened = content.slice(n + 1, content.length); //make shortened version for next variable
                    //throw error if wrong, else assign to variable
                    if (!(currentType_read == 'sine' || currentType_read == 'triangle' || currentType_read == 'sawtooth' || currentType_read == 'square')) {
                        throw new Error('Invalid oscillator type');
                    } else {
                        currentType = currentType_read;
                    }

                    //freqMain
                    n = contentShortened.search("\n"); //find CR
                    var currentFreqMain_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    //throw error if wrong
                    if (isNaN(currentFreqMain_read) || currentFreqMain_read > maxFreq || currentFreqMain_read < minFreq) {
                        throw new Error('Invalid frequency value');
                    } else {
                        currentFreqMain = currentFreqMain_read;
                    }

                    //ampMain
                    n = contentShortened.search("\n"); //find CR
                    var currentAmpMain_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    //throw error if wrong
                    if (isNaN(currentAmpMain_read) || currentAmpMain_read > 1 || currentFreqMain < 0) {
                        throw new Error('Invalid amplitude value');
                    } else {
                        currentAmpMain = currentAmpMain_read;
                    }

                    //isLFOon
                    n = contentShortened.search("\n"); //find CR
                    var isLFOon_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    //throw error if wrong
                    if (isNaN(isLFOon_read) || !(isLFOon_read == 1 || isLFOon == 0)) {
                        throw new Error('Invalid LFO flag value');
                    } else {
                        isLFOon = isLFOon_read;
                    }

                    //freqLFO
                    n = contentShortened.search("\n"); //find CR
                    var currentFreqLFO_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    //throw error if wrong
                    if (isNaN(currentFreqLFO_read) || currentFreqLFO_read > midiToFreq(120) || currentFreqLFO_read < midiToFreq(1)) {
                        throw new Error('Invalid LFO frequency value');
                    } else {
                        currentFreqLFO = currentFreqLFO_read;
                    }

                    //ampLFO
                    n = contentShortened.search("\n"); //find CR
                    var currentAmpLFO_read = parseFloat(contentShortened.slice(0, n));
                    contentShortened = contentShortened.slice(n + 1, contentShortened.length);
                    //throw error if wrong
                    if (isNaN(currentAmpLFO_read) || currentAmpLFO_read > 5000 || currentAmpLFO_read < 0) {
                        throw new Error('Invalid LFO amplitude value');
                    } else {
                        currentAmpLFO = currentAmpLFO_read;
                    }

                    //eqGains
                    n = contentShortened.search("\n"); //find CR
                    eqString = contentShortened.slice(0, n).split(',');
                    var eqGains_read0 = parseFloat(eqString[0]);
                    var eqGains_read1 = parseFloat(eqString[1]);
                    var eqGains_read2 = parseFloat(eqString[2]);
                    // throw error if wrong
                    if (isNaN(eqGains_read0) || isNaN(eqGains_read1) || isNaN(eqGains_read2)) {
                        throw new Error('Invalid filtering slider values');
                    } else if (eqGains_read0 > 20 || eqGains_read0 < -20 || eqGains_read1 > 20 || eqGains_read1 < -20 || eqGains_read2 > 20 || eqGains_read2 < -20) {
                        throw new Error('Filtering slider values out of range');
                    }

                } //if error is thrown, display dialogue box and reset to previous values
                catch (error) {
                    // console.log(error)
                    alert("Invalid text file");

                    //reset to previous values
                    currentType = currentType_temp;
                    currentFreqMain = currentFreqMain_temp;
                    currentAmpMain = currentAmpMain_temp;
                    isLFOon = isLFOon_temp;
                    currentFreqLFO = currentFreqLFO_temp;
                    currentAmpLFO = currentAmpLFO_temp;
                    eqGains = eqGains_temp;

                } finally {
                    //reset UI using the new values
                    setOscillatorValues();
                    setUIValues();
                }
            };
        };
    }

    //----- musical functions -----//
    function playNote() {
        currentFreqMain = midiToFreq(currentNote + currentOctave); //left as midi as using keyboard here
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
        strokeWeight(4);
        //sound
        stroke(255, 193, 84);
        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //sound top
        rect(spacingOuter, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding); //sound bottom

        //inputs
        stroke(0, 196, 154)
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter * 2 + colWidth, spacingOuter * 3 + rowHeight + textBarHeight, colWidth, rowHeight, rounding, rounding); //keyboard

        //outputs
        stroke(88, 44, 77)
        rect(spacingOuter * 3 + colWidth * 2, spacingOuter, colWidth, textBarHeight, rounding, rounding)

        rect(colWidth * 2 + spacingOuter * 3, spacingOuter * 2 + textBarHeight, colWidth, rowHeight, rounding, rounding); //waveform

        rect(colWidth * 2 + spacingOuter * 3, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right
        rect(colWidth * 2.5 + spacingOuter * 3 + spacingInner, rowHeight + spacingOuter * 3 + textBarHeight, colWidth / 2 - spacingInner, rowHeight, rounding, rounding); //bottom right

    }

    function drawLoudspeaker(x, y) {
        strokeWeight(1);
        stroke(0);
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
        //black keys - slightly thinner for visual clarity
        fill(0, 0, 0, transparencyValue);
        for (let i = 0; i < 2; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth) + 4, height - spacingOuter - keyHeight * 2, keyWidth - 8, keyHeight);
        }
        for (let i = 3; i < 6; i++) {
            rect(spacingOuter * 2 + colWidth + spacingInner + keyWidth / 2 + (i * keyWidth) + 4, height - spacingOuter - keyHeight * 2, keyWidth - 8, keyHeight);
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

            fill("red")
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

    //update All UI elements based on current values
    function setUIValues() {
        setToggleValues();

        //starting parameters
        XY_freqAmp.valX = 1; //amplitude at 1
        XY_freqAmp.valY = currentFreqMain;
        slider_gain.val = currentAmpMain;

        //set EQ gains & slider gains
        for (let i = 0; i < 3; i++) {
            eq.bands[i].gain(eqGains[i]);
        }
        slider_eq0.val = eqGains[0];
        slider_eq1.val = eqGains[1];
        slider_eq2.val = eqGains[2];

    }


}