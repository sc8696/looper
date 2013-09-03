(function(){
	"use strict";

	var loop1, loop2, loop3, loop4;

	loop1 = document.getElementById("loop1");
	loop2 = document.getElementById("loop2");
	loop3 = document.getElementById("loop3");
	loop4 = document.getElementById("loop4");

    var audioBuffer;
    var sourceNode;
    var javascriptNode;
    var analyser;
    var analyser2;
    var particlePoint;
    var mediaStreamSource;

    var context;
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
    }

    setupAudioNodes();

    function setupAudioNodes() {

        // setup a javascript node
        javascriptNode = context.createJavaScriptNode(256, 0, 1);

        // connect to destination, else it isn't called
        javascriptNode.connect(context.destination);
 
        // setup a analyzer
        analyser = context.createAnalyser();
        // analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 1024;
 
        // create a buffer source node
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        analyser.connect(javascriptNode);

        // and connect to destination
        sourceNode.connect(context.destination);
    }

    // success callback when requesting audio input stream
    function gotStream(stream) {
        // Create an AudioNode from the stream.
        mediaStreamSource = context.createMediaStreamSource(stream);
        // Connect it to the destination to hear yourself (or any other node for processing!)
        // mediaStreamSource.connect(context.destination );
        mediaStreamSource.connect(analyser);

        process();
    }

    navigator.webkitGetUserMedia( {audio:true}, gotStream );

    function process(){
        javascriptNode.onaudioprocess = window.audioProcess = function() {
            console.log("hi")
        }
    }

}())