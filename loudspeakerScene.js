/*
Explore-a-Synth release v1.0.0

loudspeakerScene
- Scene loaded when 'More' button pressed in loudspeaker section of mainScene
- Displays oscillator controls and an animation of a sliced loudspeaker which reacts to controls
- UI elements created using touchGUI
- Location of UI elements based on values set in instrumentv3 (colWidth, rowHeight, spacingOuter etc)

Author: Kat Young
https://github.com/tibbakoi
2021

*/

function loudspeakerScene() {
    let button_mainGui2; // navigation to other scenes
    // Oscillator related
    let toggle_OnOff; // power
    let toggle_Type1, toggle_Type2, toggle_Type3, toggle_Type4 // osc type
    let toggle_mute; // overall mute control
    let slider_gain, slider_freq; // sliders for amp and frequency
    let waveform = 0; // somewhere to put the waveform
    let button_helpMode_osc, helpMode_osc = 0; // help mode

    // Loudspeaker image related

    // Everything drawn relative to top corner of magnet with defined widths and heights
    let topCornerX = 600;
    let topCornerY = 250;
    let magnetWidth = 75;
    let magnetHeight = 100;
    let coneWidth = 75;
    let coneHeight = 50; // Amount sticking out above and below magnet
    let startingCentrePoint = topCornerX + magnetWidth - 10; //x axis pixel value for rest state of point of triangle (which is actually in the magnet...)

    // Related to the animation of the loudspeaker
    let centrePointAdjustment = 0; // amount of movement
    let startingSpeed = 0;
    let speedAdjustment = 0; // speed of movement

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
        guiLoudspeaker = createGui();

        // Sound settings toggles
        toggle_OnOff = createCheckbox("OnOff", spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + spacingInner, buttonHeight, buttonHeight);
        toggle_Type1 = createCheckbox("Sine", spacingOuter + spacingInner, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 1);
        toggle_Type2 = createCheckbox("Saw", spacingOuter + spacingInner * 2 + buttonHeight, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type3 = createCheckbox("Tri", spacingOuter + spacingInner * 3 + buttonHeight * 2, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_Type4 = createCheckbox("Squ", spacingOuter + spacingInner * 4 + buttonHeight * 3, spacingOuter * 2 + textBarHeight + spacingInner * 2 + buttonHeight, buttonHeight, buttonHeight, 0);
        toggle_mute = createCheckbox("Mute", spacingOuter + colWidth - spacingInner - 110, spacingOuter * 2 + spacingInner + textBarHeight, buttonHeight, buttonHeight);
        toggle_mute.setStyle({
            fillCheck: color("red"),
            fillCheckHover: color("red"),
            fillCheckActive: color("red"),
        }); //all versions of the X are red

        // Amplitude and frequency sliders
        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);
        slider_freq = createSlider("freqCopy", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, 50, 8000);

        // Help mode button
        button_helpMode_osc = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        // SceneManager switch button
        button_mainGui2 = createButton("x", width - spacingOuter * 3 - spacingInner * 2, spacingOuter + spacingInner, 25, 25);

        // Set status of UI elements and oscillators
        setOscillatorValues();
        setUIvalues();

        // Calculate speed of loudspeaker animation based on frequency value
        currentSpeed = calcNewSpeed();

    }

    // Called whenever scene is switched to from another
    this.enter = function() {
        this.setup();
    }

    this.draw = function() {
        background(84, 106, 118);

        /*--- Figure out whether in help mode or not, change button style accordingly---*/

        if (button_helpMode_osc.isPressed && helpMode_osc == 0) { // if button pressed to turn on 
            helpMode_osc = 1;
            button_helpMode_osc.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_osc.isPressed && helpMode_osc == 1) { // if button pressed to turn off
            helpMode_osc = 0;
            button_helpMode_osc.setStyle(helpButtonInactiveStyle);
        }

        /*--- Draw GUI stuff: rectangles, loudspeaker, UI elements, text, waveform ---*/

        drawGui(); // required by touchGUI
        drawRectangles();
        drawLoudspeaker();

        // If mouse is NOT currently pressed within region where waveform is drawn, update waveform so the plot is live
        if (!(mouseIsPressed && mouseX > spacingOuter && mouseX < (spacingOuter + colWidth) && mouseY > (rowHeight + spacingOuter * 2 + textBarHeight - 1) && mouseY < (rowHeight * 2 + spacingOuter * 2 + textBarHeight - 1))) {
            waveform = fftMain.waveform();
        } // Else plot the static waveform to 'pause' the plot
        drawWaveform(waveform, spacingOuter, spacingOuter + colWidth, spacingOuter + textBarHeight + rowHeight * 2 + spacingOuter - 1, spacingOuter + textBarHeight + rowHeight + spacingOuter - 1);

        // Draw various bits of text
        fill("white");
        noStroke();
        textSize(25);
        textAlign(LEFT, CENTER)
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Mute', spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + spacingInner + 25);

        // Draw top row of text
        textAlign(CENTER, CENTER)
        text("This is the oscillator.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is a loudspeaker cut in half. Change the volume and frequency and look what happens!", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth * 2 + spacingOuter, textBarHeight);
        textSize(20);
        text("1) Electrical current flows through a coil of wire...", spacingOuter * 2 + colWidth + 5, spacingOuter * 2 + textBarHeight * 2.35, colWidth * 0.80, textBarHeight);
        text("2) This creates a magnetic field and an electromagnet...", spacingOuter * 2 + colWidth * 1.5, spacingOuter * 2 + textBarHeight, colWidth * 0.80, textBarHeight);
        text("3) The electromagnet repels and attracts against a permanent magnet...", spacingOuter * 2 + colWidth * 1.5 + 50, spacingOuter * 2 + textBarHeight * 3.75, colWidth * 0.80, textBarHeight);
        text("4) Which makes the cone vibrate and move the air particles - creating sound!", spacingOuter * 2 + colWidth * 2.45, spacingOuter * 2 + textBarHeight * 2.35, colWidth * 0.6);

        textAlign(LEFT, CENTER)

        // Draw slider text labels
        textSize(18)
        if (slider_freq.val > 1000) {
            text(round(slider_freq.val / 1000, 1) + "kHz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        } else {
            text(round(slider_freq.val) + "Hz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        }
        textSize(15)
        text("Vol: " + round(slider_gain.val, 1), spacingOuter + colWidth - spacingInner * 2 - 42, spacingOuter * 2 + textBarHeight + rowHeight - 65)

        // Display oscillator type label based on which toggle is active
        changeTypeLabel(toggle_Type1.val, toggle_Type2.val, toggle_Type3.val, toggle_Type4.val);

        /*--- Draw help mode boxes if help mode has been activated - draw on top of everything else. 
        When each UI element is hovered over, display pop-up help box ---*/
        strokeWeight(1);
        if (helpMode_osc) {
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

        // Slider amplitude control
        if (slider_gain.isChanged) {
            currentAmpMain = slider_gain.val;
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
        }

        // Slider frequency control - also calculates speed adjustment for animation
        if (slider_freq.isChanged) {
            currentFreqMain = slider_freq.val;
            oscillatorCopy.freq(currentFreqMain);
            oscillatorMain.freq(currentFreqMain);
            currentSpeed = calcNewSpeed();
        }

        // Filtering key presses for changing sliders with arrows
        if (keyIsPressed) {
            if (frameCount % 4 == true) { // only triggers every 4 frames to account for length of time pressing the key - effectively working at 15fps
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
            }
        }

        // Switch to mainScene
        if (button_mainGui2.isPressed) {
            mgr.showScene(mainScene);
        }
    }

    /*--- Other functions ---*/

    // Calculate 'speed' for loudspeaker animation based on frequency slider - is actually how often to draw the 'moved' loudspeaker image
    // eg if currentSpeed = 5, represents 5 frames on then 5 frames off. currentSpeed = 50 is 50 frames on then 50 frames off
    function calcNewSpeed() {
        // Map frequency range to range of pixels to move (58), then minus from 60 (the frame rate) - so slowest movement is just under 1Hz
        // Larger number creates slower speed.
        return 60 - round(map(slider_freq.val, minFreq, maxFreq, 0, 58));
    }

    // Draw and animate loudspeaker graphic
    function drawLoudspeaker() {
        // Calculate amount to move centre point of cone from current amplitude
        // NB - this loudspeaker doesn't stop moving when mute is pressed (different to loudspeaker on mainScene)
        centrePointAdjustment = floor(currentAmpMain * 40); // 40 pixels is max amount of movement permitted

        // Draw static sections:
        // Permanent magnet
        noStroke();
        fill("orange");
        rect(topCornerX, topCornerY, magnetWidth, magnetHeight);
        // Inside magnet
        fill("brown");
        rect(startingCentrePoint - 50, topCornerY + magnetHeight / 2 - 22, magnetWidth, magnetHeight * (4 / 10) + 4);
        // Outer housing
        fill(79);
        beginShape();
        vertex(topCornerX + magnetWidth, topCornerY);
        vertex(topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight);
        vertex(topCornerX + magnetWidth + coneWidth, topCornerY + coneHeight + magnetHeight);
        vertex(topCornerX + magnetWidth, topCornerY + magnetHeight);
        endShape();
        // Coil wires - horizontal
        stroke(196, 98, 16);
        line(topCornerX + magnetWidth, topCornerY + magnetHeight / 2 - 10, topCornerX - 40, topCornerY + magnetHeight / 2 - 10);
        line(topCornerX + magnetWidth, topCornerY + magnetHeight / 2 + 10, topCornerX - 40, topCornerY + magnetHeight / 2 + 10);
        // Arrow bodies
        stroke(0);
        strokeWeight(1);
        line(topCornerX - 20, topCornerY + 20, topCornerX - 40, topCornerY + 20);
        line(topCornerX - 20, topCornerY + 80, topCornerX - 40, topCornerY + 80);
        noStroke();

        // Animate bits of loudspeaker:
        // centrePoint changes for amount of movement (amplitude)
        // speed of movement (frequency) is related to how often the frames are drawn

        // If sound is on, draw loudspeaker in different place for length of time determined by speed
        // eg if currentSpeed = 5, draw in different place for 5 frames, then other
        if (toggle_OnOff.val && ((frameCount % (currentSpeed * 2)) > currentSpeed - 1)) {
            centrePoint = startingCentrePoint + centrePointAdjustment; // calculate adjusted centrePoint to draw at
            // Cone triangle
            fill(130);
            triangle(centrePoint, topCornerY + magnetHeight / 2, topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight + 5, topCornerX + magnetWidth + coneWidth, topCornerY + magnetHeight + coneHeight - 5);
            // Core block
            fill(110);
            rect(centrePoint - 50, topCornerY + magnetHeight / 2 - 20, magnetWidth, magnetHeight * (4 / 10));
            circle(centrePoint + 25, topCornerY + magnetHeight / 2, magnetHeight * (4 / 10));
            // Core coil - vertical
            stroke(196, 98, 16);
            strokeWeight(2);
            beginShape(LINES);
            vertex(centrePoint - 45, topCornerY + magnetHeight / 2 - magnetHeight * (2 / 10));
            vertex(centrePoint - 45, topCornerY + magnetHeight / 2 + magnetHeight * (2 / 10));
            vertex(centrePoint - 35, topCornerY + magnetHeight / 2 - magnetHeight * (2 / 10));
            vertex(centrePoint - 35, topCornerY + magnetHeight / 2 + magnetHeight * (2 / 10));
            vertex(centrePoint - 25, topCornerY + magnetHeight / 2 - magnetHeight * (2 / 10));
            vertex(centrePoint - 25, topCornerY + magnetHeight / 2 + magnetHeight * (2 / 10));
            endShape();
            // Arrow heads
            stroke(0);
            strokeWeight(1);
            line(topCornerX - 20, topCornerY + 20, topCornerX - 30, topCornerY + 10);
            line(topCornerX - 20, topCornerY + 20, topCornerX - 30, topCornerY + 30);
            line(topCornerX - 30, topCornerY + magnetHeight - 30, topCornerX - 40, topCornerY + magnetHeight - 20);
            line(topCornerX - 30, topCornerY + magnetHeight - 10, topCornerX - 40, topCornerY + magnetHeight - 20);
            noStroke();

        }
        // Draw at original location on other frames or if sound is not on
        else {
            centrePoint = startingCentrePoint;
            // Cone triangle
            fill(130);
            triangle(centrePoint, topCornerY + magnetHeight / 2, topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight + 5, topCornerX + magnetWidth + coneWidth, topCornerY + magnetHeight + coneHeight - 5);
            // Core
            fill(110);
            rect(centrePoint - 50, topCornerY + magnetHeight / 2 - 20, magnetWidth, magnetHeight * (4 / 10));
            circle(centrePoint + 25, topCornerY + magnetHeight / 2, magnetHeight * (4 / 10));
            // Core coil
            stroke(196, 98, 16);
            strokeWeight(2);
            beginShape(LINES);
            vertex(centrePoint - 45, topCornerY + magnetHeight / 2 - magnetHeight * (2 / 10));
            vertex(centrePoint - 45, topCornerY + magnetHeight / 2 + magnetHeight * (2 / 10));
            vertex(centrePoint - 35, topCornerY + magnetHeight / 2 - magnetHeight * (2 / 10));
            vertex(centrePoint - 35, topCornerY + magnetHeight / 2 + magnetHeight * (2 / 10));
            vertex(centrePoint - 25, topCornerY + magnetHeight / 2 - magnetHeight * (2 / 10));
            vertex(centrePoint - 25, topCornerY + magnetHeight / 2 + magnetHeight * (2 / 10));
            endShape();
            // Arrow heads
            stroke(0);
            strokeWeight(1)
            line(topCornerX - 40, topCornerY + 20, topCornerX - 30, topCornerY + 10);
            line(topCornerX - 40, topCornerY + 20, topCornerX - 30, topCornerY + 30);
            line(topCornerX - 30, topCornerY + magnetHeight - 30, topCornerX - 20, topCornerY + magnetHeight - 20);
            line(topCornerX - 30, topCornerY + magnetHeight - 10, topCornerX - 20, topCornerY + magnetHeight - 20);
            noStroke();
        }
    }

    // Draw coloured boxes
    function drawRectangles() {
        let rounding = 10; // corner rounding
        strokeWeight(4);
        noFill();
        // Sound - left column in yellow
        stroke(255, 193, 84);
        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding);
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding);

        // Output - right column in purple
        stroke(88, 44, 77);
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth * 2 + spacingOuter, textBarHeight, rounding, rounding);
        rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + textBarHeight, colWidth * 2 + spacingOuter, rowHeight * 2 + spacingOuter, rounding, rounding);
    }

    // Update All UI elements based on current values
    function setUIvalues() {
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
        slider_gain.val = currentAmpMain;
        slider_freq.val = currentFreqMain;
    }
}