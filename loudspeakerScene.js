function loudspeakerScene() {
    let button_mainGui2;

    this.setup = function() {

        guiSound = createGui();
        // back to main GUI
        button_mainGui2 = createButton("x", width - spacingOuter * 3 - spacingInner * 2, spacingOuter * 2, 25, 25);


    };
    this.enter = function() {
        this.setup();
    };
    this.draw = function() {
        background(84, 106, 118);
        drawGui();

        textAlign(CENTER, CENTER)
        stroke(88, 44, 77)
        fill(88, 44, 77)
        text("There will be information about how sound/vibration/loudspeakers work here", width / 2, height / 2)

        // return to main scene
        if (button_mainGui2.isPressed) {
            mgr.showScene(mainScene);
        }
    };
}