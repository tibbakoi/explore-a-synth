// init stuff
let gui;

let oscillator; //noise makers
let fft;
let button_OnOff, radio_TypeSelect //buttons
let slider_Vol, slider_Freq; //sliders

function setup() {
    let canvas = createCanvas(400, 400);

    canvas.parent('instrumentv1'); //specifies which div to put the canvas in

    //p5 sound objects
    oscillator = new p5.Oscillator('sine');
    fft = new p5.FFT(0.8, 256);

    //UI objects
    button_OnOff = createButton('power').position(10, 10).parent('instrumentv1');
    radio_TypeSelect = createRadio().parent('instrumentv1');
    radio_TypeSelect.option('sine');
    radio_TypeSelect.option('triangle');
    radio_TypeSelect.option('sawtooth');
    radio_TypeSelect.option('square');
    radio_TypeSelect.position(width / 4, 40);

    slider_Vol = createSlider(-40, 0, -40, 1).position(80, 10).style('width', '100px').parent('instrumentv1');
    slider_Freq = createSlider(50, 127, 69, 1).position(230, 10).style('width', '100px').parent('instrumentv1');

    //starting parameters
    radio_TypeSelect.selected('sine');
    oscillator.amp(0);
    oscillator.freq(midiToFreq(69));
    fft.setInput(oscillator);
    noFill();
    stroke('white');

    //event handlers for UI - goes inside setupfunction-out of scope otherwise
    slider_Freq.input(function() {
        oscillator.freq(midiToFreq(this.value()));
    });

    slider_Vol.input(function() {
        if (this.value() > -36) {
            oscillator.amp(pow(10, this.value() / 20), 0.01)
        } else {
            oscillator.amp(map(this.value(), -40, -36, 0, 0.0016), 0.1)
        }
    });

    button_OnOff.mousePressed(function() {
        if (oscillator.started) {
            oscillator.stop();
            button_OnOff.style('background-color', 'white');

        } else {
            oscillator.start();
            button_OnOff.style('background-color', 'gray');
        }
    });

    radio_TypeSelect.changed(function() {
        oscillator.setType(this.value());
    });

}

function draw() {
    background(100);
    // text labels for sliders
    textAlign(RIGHT);
    ampValue = str(slider_Vol.value());
    text(ampValue.concat('dB'), slider_Vol.x + slider_Vol.width + 40, slider_Vol.y * 2.5);
    freqValue = str(round(midiToFreq(slider_Freq.value())));
    text(freqValue.concat('Hz'), slider_Freq.x + slider_Freq.width + 50, slider_Freq.y * 2.5);

    let waveform = fft.waveform();
    let spectrum = fft.analyze();

    // draw waveform
    noFill();
    beginShape();
    // vertex(0, height);
    for (let j = 0; j < waveform.length; j++) {
        vertex(map(j, 0, waveform.length, 0, width), map(waveform[j], -1, 1, height / 2, height));
    }
    // vertex(width, height);
    endShape();

    // draw spectrum
    beginShape();
    vertex(0, height / 2);
    for (let i = 0; i < spectrum.length; i++) {
        vertex(map(i, 0, spectrum.length, 0, width), map(spectrum[i], 0, 255, height / 2, 0));
    }
    vertex(width, height / 2);
    endShape();
}

// to avoid autoplay
function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}