function loudspeakerScene() {
    let slider_gain, slider_freqCopy;
    let waveformCopy = 0;
    let helpMode_osc = 0;
    let button_helpMode_osc, button_mainGui2;

    //everything loudspeaker drawn relative to top corner of magnet with defined widths and heights
    let topCornerX = 600;
    let topCornerY = 250;

    let magnetWidth = 75;
    let magnetHeight = 100;
    let coneWidth = 75;
    let coneHeight = 50; //amount sticking out above and below magnet

    let startingCentrePoint = topCornerX + magnetWidth - 10; //x axis pixel value for rest state of point of triangle (which is actually in the magnet...)
    let centrePointAdjustment = 0;
    let startingSpeed = 0;
    let speedAdjustment = 0;

    //styling for help buttons
    let helpButtonActiveStyle = {
        fillBg: color("white"),
    };

    let helpButtonInactiveStyle = {
        fillBg: color(130),
    };

    this.setup = function() {

        guiLoudspeaker = createGui();

        // sound settings toggles
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

        slider_gain = createSlider("gain", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2, colWidth - spacingInner * 2 - 50, 30, 0, 1);
        slider_freqCopy = createSlider("freqCopy", spacingOuter + spacingInner, spacingOuter + textBarHeight + spacingOuter * 3 + buttonHeight * 2 + spacingInner + 30, colWidth - spacingInner * 2 - 50, 30, 1, maxMIDIval);

        button_helpMode_osc = createButton("?", spacingOuter + colWidth - spacingInner - 25, spacingOuter + textBarHeight - spacingInner - 25, 25, 25);

        // back to main GUI
        button_mainGui2 = createButton("x", width - spacingOuter * 3 - spacingInner * 2, spacingOuter + spacingInner, 25, 25);

        //set toggle values based on state of oscillators
        setToggleValues();

        //set slider values, adjust loudspeaker based on frequency value
        slider_gain.val = currentAmpMain;
        slider_freqCopy.val = freqToMidi(currentFreqMain);
        speedAdjustment = 60 - round(map(slider_freqCopy.val, 1, maxMIDIval, 0, 58)); //map midi range to amount of pixel to move, then minus from 60 (the framerate). large number is slower speed


    };
    this.enter = function() {
        this.setup();
    };
    this.draw = function() {
        background(84, 106, 118);

        //figure out if in help mode or not
        //osc1 section
        if (button_helpMode_osc.isPressed && helpMode_osc == 0) { //if button pressed to turn on 
            helpMode_osc = 1;
            button_helpMode_osc.setStyle(helpButtonActiveStyle);
        } else if (button_helpMode_osc.isPressed && helpMode_osc == 1) { //if button pressed to turn off
            helpMode_osc = 0;
            button_helpMode_osc.setStyle(helpButtonInactiveStyle);
        }

        //----- draw stuff -----//
        drawGui();
        drawRectangles();
        drawLoudspeaker();

        //text things
        fill("white");
        noStroke();
        textSize(25);
        textAlign(LEFT, CENTER)
        text('Sound', spacingOuter + spacingInner * 2 + 50, spacingOuter * 2 + textBarHeight + spacingInner + 25);
        text('Mute', spacingOuter + colWidth - spacingInner - 55, spacingOuter * 2 + textBarHeight + spacingInner + 25);

        //explainer boxes
        textAlign(CENTER, CENTER)
        text("This is the oscillator.", spacingOuter, spacingOuter + spacingInner, colWidth, textBarHeight);
        text("This is a loudspeaker cut in half. Change the volume and frequency and look what happens!", spacingOuter * 2 + colWidth, spacingOuter + spacingInner, colWidth * 2 + spacingOuter, textBarHeight);
        textSize(20);
        text("1) Electrical current flows through a coil of wire...", spacingOuter * 2 + colWidth + 5, spacingOuter * 2 + textBarHeight * 2.35, colWidth * 0.80, textBarHeight);
        text("2) This creates a magnetic field and an electromagnet...", spacingOuter * 2 + colWidth * 1.5, spacingOuter * 2 + textBarHeight, colWidth * 0.80, textBarHeight);
        text("3) The electromagnet repels and attracts against a permanent magnet...", spacingOuter * 2 + colWidth * 1.5 + 50, spacingOuter * 2 + textBarHeight * 3.75, colWidth * 0.80, textBarHeight);
        text("4) Which makes the cone vibrate and move the air particles - creating sound!", spacingOuter * 2 + colWidth * 2.45, spacingOuter * 2 + textBarHeight * 2.35, colWidth * 0.6);

        textAlign(LEFT, CENTER)

        //slider text labels
        textSize(18)
        if (slider_freqCopy.val > freqToMidi(1000)) {
            text(round(midiToFreq(slider_freqCopy.val) / 1000, 1) + "kHz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        } else {
            text(round(midiToFreq(slider_freqCopy.val)) + "Hz", spacingOuter + colWidth - spacingInner * 2 - 45, spacingOuter * 4 + textBarHeight + buttonHeight * 2 + spacingInner + 45)
        }
        textSize(15)
        text("Vol: " + round(slider_gain.val, 1), spacingOuter + colWidth - spacingInner * 2 - 42, spacingOuter * 2 + textBarHeight + rowHeight - 65)

        //display osc type label based on which toggle is active
        changeTypeLabel();

        // return to main scene
        if (button_mainGui2.isPressed) {
            mgr.showScene(mainScene);
        }

        // ----- pop up hover boxes if help mode on -----//
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

        //----- define UI interactions -----//

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

        //main gain and freq control, adjust loudspeaker drawing
        if (slider_gain.isChanged) {
            currentAmpMain = slider_gain.val;
            oscillatorMain.amp(currentAmpMain, 0.01);
            oscillatorCopy.amp(currentAmpMain, 0.01);
        }
        if (slider_freqCopy.isChanged) {
            currentFreqMain = midiToFreq(slider_freqCopy.val);
            oscillatorCopy.freq(currentFreqMain);
            oscillatorMain.freq(currentFreqMain);
            speedAdjustment = 60 - round(map(slider_freqCopy.val, 1, maxMIDIval, 0, 58)); //map midi range to amount of pixel to move, then minus from 60 (the framerate). large number is slower speed
        }

        //----- get and draw waveforms -----//
        //only actually plots the 'copy' waveform, not the main osc output
        //if mouse is NOT pressed and within region where waveform is drawn, plot live version
        if (!(mouseIsPressed && mouseX > spacingOuter && mouseX < (spacingOuter + colWidth) && mouseY > (rowHeight + spacingOuter * 2 + textBarHeight - 1) && mouseY < (rowHeight * 2 + spacingOuter * 2 + textBarHeight - 1))) {
            waveformCopy = fftCopy.waveform();
        }
        drawWaveform(waveformCopy, spacingOuter, spacingOuter + colWidth, spacingOuter + textBarHeight + rowHeight * 2 + spacingOuter - 1, spacingOuter + textBarHeight + rowHeight + spacingOuter - 1);

    };

    function drawLoudspeaker() {
        var ampLevel = ampAnalyser.getLevel(); //amplitude of output - not a value from a UI element
        centrePointAdjustment = floor(ampLevel * 65); //50 is max amount of movement permitted

        noStroke();

        //permanent magnet
        fill("orange");
        rect(topCornerX, topCornerY, magnetWidth, magnetHeight);
        //bit inside magnet
        fill("brown")
        rect(startingCentrePoint - 50, topCornerY + magnetHeight / 2 - 22, magnetWidth, magnetHeight * (4 / 10) + 4);
        //outer housing
        fill(79)
        beginShape()
        vertex(topCornerX + magnetWidth, topCornerY);
        vertex(topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight);
        vertex(topCornerX + magnetWidth + coneWidth, topCornerY + coneHeight + magnetHeight);
        vertex(topCornerX + magnetWidth, topCornerY + magnetHeight);
        endShape()

        //coil wires - horizontal
        stroke(196, 98, 16);
        line(topCornerX + magnetWidth, topCornerY + magnetHeight / 2 - 10, topCornerX - 40, topCornerY + magnetHeight / 2 - 10)
        line(topCornerX + magnetWidth, topCornerY + magnetHeight / 2 + 10, topCornerX - 40, topCornerY + magnetHeight / 2 + 10)

        //arrow bodies
        stroke(0)
        strokeWeight(1)
        line(topCornerX - 20, topCornerY + 20, topCornerX - 40, topCornerY + 20)
        line(topCornerX - 20, topCornerY + 80, topCornerX - 40, topCornerY + 80)

        noStroke()

        //centrePoint is amount of movement
        //speed is related to how quickly the frames are drawn
        currentSpeed = startingSpeed + speedAdjustment;
        if (toggle_OnOff.val) { //only draw movement if sound is on
            //draw moved version
            if (frameCount % currentSpeed * 2 > currentSpeed - 1) { //divides 60fps into blocks for drawing
                centrePoint = startingCentrePoint + centrePointAdjustment;
                //cone triangle
                fill(130);
                triangle(centrePoint, topCornerY + magnetHeight / 2, topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight + 5, topCornerX + magnetWidth + coneWidth, topCornerY + magnetHeight + coneHeight - 5);
                //core block
                fill(110);
                rect(centrePoint - 50, topCornerY + magnetHeight / 2 - 20, magnetWidth, magnetHeight * (4 / 10));
                circle(centrePoint + 25, topCornerY + magnetHeight / 2, magnetHeight * (4 / 10));
                //core coil - vertical
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
                //arrow heads
                stroke(0);
                strokeWeight(1);
                line(topCornerX - 20, topCornerY + 20, topCornerX - 30, topCornerY + 10);
                line(topCornerX - 20, topCornerY + 20, topCornerX - 30, topCornerY + 30);
                line(topCornerX - 30, topCornerY + magnetHeight - 30, topCornerX - 40, topCornerY + magnetHeight - 20);
                line(topCornerX - 30, topCornerY + magnetHeight - 10, topCornerX - 40, topCornerY + magnetHeight - 20);
                noStroke();

            } else { //draw at original point
                centrePoint = startingCentrePoint;
                //cone triangle
                fill(130);
                triangle(centrePoint, topCornerY + magnetHeight / 2, topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight + 5, topCornerX + magnetWidth + coneWidth, topCornerY + magnetHeight + coneHeight - 5);
                //core
                fill(110);
                rect(centrePoint - 50, topCornerY + magnetHeight / 2 - 20, magnetWidth, magnetHeight * (4 / 10));
                circle(centrePoint + 25, topCornerY + magnetHeight / 2, magnetHeight * (4 / 10));
                //core coil
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
                //arrow heads
                stroke(0);
                strokeWeight(1)
                line(topCornerX - 40, topCornerY + 20, topCornerX - 30, topCornerY + 10);
                line(topCornerX - 40, topCornerY + 20, topCornerX - 30, topCornerY + 30);
                line(topCornerX - 30, topCornerY + magnetHeight - 30, topCornerX - 20, topCornerY + magnetHeight - 20);
                line(topCornerX - 30, topCornerY + magnetHeight - 10, topCornerX - 20, topCornerY + magnetHeight - 20);
                noStroke();
            }
        } else {
            centrePoint = startingCentrePoint;
            //cone triangle
            fill(130);
            triangle(centrePoint, topCornerY + magnetHeight / 2, topCornerX + magnetWidth + coneWidth, topCornerY - coneHeight + 5, topCornerX + magnetWidth + coneWidth, topCornerY + magnetHeight + coneHeight - 5);
            //core
            fill(110);
            rect(centrePoint - 50, topCornerY + magnetHeight / 2 - 20, magnetWidth, magnetHeight * (4 / 10));
            circle(centrePoint + 25, topCornerY + magnetHeight / 2, magnetHeight * (4 / 10));
            //core coil
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
            //arrow heads
            stroke(0);
            strokeWeight(1)
            line(topCornerX - 40, topCornerY + 20, topCornerX - 30, topCornerY + 10);
            line(topCornerX - 40, topCornerY + 20, topCornerX - 30, topCornerY + 30);
            line(topCornerX - 30, topCornerY + magnetHeight - 30, topCornerX - 20, topCornerY + magnetHeight - 20);
            line(topCornerX - 30, topCornerY + magnetHeight - 10, topCornerX - 20, topCornerY + magnetHeight - 20);
            noStroke();
        }

    }

    function drawRectangles() {
        let rounding = 10;
        strokeWeight(4);
        noFill();
        //left most column - sound input
        stroke(255, 193, 84);
        rect(spacingOuter, spacingOuter, colWidth, textBarHeight, rounding, rounding)
        rect(spacingOuter, spacingOuter * 2 + textBarHeight, colWidth, rowHeight * 2 + spacingOuter, rounding, rounding); //sound top
        // rect(spacingOuter, rowHeight + spacingOuter * 3 + textBarHeight, colWidth, rowHeight, rounding, rounding); //sound bottom

        //other bits - sound output
        stroke(88, 44, 77)
        rect(spacingOuter * 2 + colWidth, spacingOuter, colWidth * 2 + spacingOuter, textBarHeight, rounding, rounding)
        rect(spacingOuter * 2 + colWidth, spacingOuter * 2 + textBarHeight, colWidth * 2 + spacingOuter, rowHeight * 2 + spacingOuter, rounding, rounding)

    }
}