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
        background("lightblue");
        drawGui();

        // return to main scene
        if (button_mainGui2.isPressed) {
            mgr.showScene(mainScene);
        }
    };
}