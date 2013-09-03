(function(){
	"use strict";



	var loop1, loop2, loop3, loop4, ctx1, ctx2, ctx3, ctx4, 
        track1 = null, track2 = null, track3 = null, track4 = null, 
        recordingQueue = [];

	loop1 = document.getElementById("loopPanel1");
	loop2 = document.getElementById("loopPanel2");
	loop3 = document.getElementById("loopPanel3");
	loop4 = document.getElementById("loopPanel4");
    ctx1 = loop1.getContext('2d');
    ctx2 = loop2.getContext('2d');
    ctx3 = loop3.getContext('2d');
    ctx4 = loop4.getContext('2d');

    var tracks = [
        {div: loop1, ctx: ctx1, track: track1},
        {div: loop2, ctx: ctx2, track: track2},
        {div: loop3, ctx: ctx3, track: track3},
        {div: loop4, ctx: ctx4, track: track4},
    ];
    var currentTrack = tracks[0];

    function panelSetup(){
        for(var i = 0; i < tracks.length; i+=1){
            tracks[i].div.width = tracks[i].div.offsetWidth;
            clickController(i);
        }

    }

    var metronomeOn = false;

    function clickController(track){
        tracks[track].div.onclick = function(){
            if(!metronomeOn){
                playMetronome();
            }
            addToRecordingQueue(tracks[track]);
        }
    }

    function fireQueue(){
        if(recordingQueue.length > 0){
            recording = true;
            recordTo(recordingQueue.pop());
        }
    }

    function addToRecordingQueue(track){
        recordingQueue.push(track)
    }

    panelSetup();

    window.onresize = function(){
        // panelSetup();
    }


    //Audio stuff
    var audioBuffer;
    var sourceNode;
    var javascriptNode;
    var analyser;
    var analyser2;
    var particlePoint;
    var mediaStreamSource;
    var context;
    var localStream;
    var recording = false;

    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
    }

    setupAudioNodes();


    // METRONOME STUFF //
    var tempo = 120, metronome = null, beat = 1, barLength = 8,
        clickAccent = document.getElementById("clickAccent"),
        click = document.getElementById("click");

    function setMetronomeTime(time){
        clearInterval(metronome);
        tempo = time < 240 ? time : 240
    }

    document.getElementById("tempo").onchange = function(){
        setMetronomeTime(this.value);
    }

     document.getElementById("tempo").onkeydown = function(e){
        if (e.shiftKey === true ) {
            if (e.which == 9) {
                return true;
            }
            return false;
        }
        if (e.which > 57) {
            return false;
        }
        if (e.which === 32) {
            return false;
        }
        if (e.which === 38){
            this.value = parseInt(this.value) + 1;
        }
        if (e.which === 40){
            this.value = parseInt(this.value) - 1;
        }

        setMetronomeTime(this.value);
        return true;
     }

    function playMetronome(){
        metronomeOn = true;
        // loadSound("sounds/claveAccent.mp3", playSound);
        clickAccent.play();
        // beat = beat%4;
        beat += 1;
        metronome = setInterval(function(){
            if(beat === 1){
                clickAccent.play();
            }
            click.play();
            // console.log(beat)

            console.log(beat);
            if (beat === 1 && recording){
                // stopMetronome();
                stopRecording();
            }

            if (beat === 1){
                fireQueue();
                loop();
            }

            beat = beat % barLength;
            beat += 1;

        },1000/(tempo/60));
    }

    function stopMetronome(){
        
        clearInterval(metronome);
    }

    // load the specified sound
    function loadSound(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';


        // When loaded decode the data
        request.onload = function() {
 
            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                callback(buffer);
                // when the audio is decoded play the sound
                
                // drawBuffer(currentTrack.div.width, currentTrack.div.height, currentTrack.ctx, buffer.getChannelData(0));
            });
        }
        request.send(); 
    }

    function playSound(buffer) {
        var sound = context.createBufferSource();
        sound.buffer = buffer;
        sound.connect(context.destination);
        sound.start(0);        
    }

    function loop(){
        for(var i = 0; i < tracks.length; i+=1){
            if(tracks[i].track !== null){
                tracks[i].div.className = "playing";
                playSound(tracks[i].track);
            }
        }
    }


    navigator.webkitGetUserMedia( {audio:true}, gotStream );

    function setupAudioNodes() {

        // setup a javascript node
        javascriptNode = context.createJavaScriptNode(256, 2, 2);

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
        // track1.src = window.URL.createObjectURL(stream);
        localStream = stream;
        // Create an AudioNode from the stream.
        mediaStreamSource = context.createMediaStreamSource(stream);
        // Connect it to the destination to hear yourself (or any other node for processing!)
        // mediaStreamSource.connect(context.destination );
        mediaStreamSource.connect(analyser);

        process();
    }

    function recordTo(track){
        track.div.className = "recording";
        currentTrack = track;
        currentTrack.track = null;
    }

    function stopRecording(){
        recording = false;    
        drawBuffer(currentTrack.div.width, currentTrack.div.height, currentTrack.ctx, currentTrack.track.getChannelData(0));
    }

    function drawSpectrum(array){
        
        // ctx.arc(20,20,20,0, 2*Math.PI, false);

        // ctx1.clearRect(0, 0, loop1.width, loop1.height);
        currentTrack.ctx.clearRect(0, 0, currentTrack.div.width, currentTrack.div.height);
        // ctx3.clearRect(0, 0, currentTrack.div.width, currentTrack.div.height);
        // ctx4.clearRect(0, 0, currentTrack.div.width, currentTrack.div.height);

        currentTrack.ctx.fillStyle="rgb(0,255,0)";
        // ctx2.fillStyle="rgb(0,255,0)";
        // ctx3.fillStyle="rgb(0,255,0)";
        // ctx4.fillStyle="rgb(0,255,0)";

        var l = array.length - 250;

        for(var i = 1; i < l; i+=2){
            currentTrack.ctx.fillRect(i * (currentTrack.div.width/l), currentTrack.div.height - (array[i]/250 * currentTrack.div.height), currentTrack.div.width/l, 500);
            // ctx2.fillRect(i, currentTrack.div.height - (array[i]/250 * currentTrack.div.height), 1, 500);
            // ctx3.fillRect(i, currentTrack.div.height - (array[i]/250 * currentTrack.div.height), 1, 500);
            // ctx4.fillRect(i, currentTrack.div.height - (array[i]/250 * currentTrack.div.height), 1, 500);
        }

    }

    function drawBuffer( width, height, context, data ) {
        context.moveTo(0, height/2);
        context.strokeStyle="#ffffff";
        context.lineWidth = 1;

        context.clearRect(0,0,width,height);

        setTimeout(function(){
            var step = Math.ceil( data.length / width );
            var amp = height / 2;
            context.fillStyle = "silver";
            for(var i=0; i < width; i+=2){

                var min = 1.0;
                var max = -1.0;
                for (var j=0; j<step; j++) {
                    var datum = data[(i*step)+j]; 
                    if (datum < min)
                        min = datum;
                    if (datum > max)
                        max = datum;
                }
                context.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
            }
        },0);
    }



    function getVolume(array){
        var max = 0;
        var maxI = 0;
        for(var i = 0; i < array.length; i+=1){
            if(array[i] > max){
                max = array[i];
                maxI = i;
            }
        }
        return maxI;
    }

    function process(){
        javascriptNode.onaudioprocess = window.audioProcess = function(e) {
            var array =  new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);

            // drawBuffer(800, 150, ctx1, array);
            if(recording){
                // drawSpectrum(array);
            }
            


            if(recording){
                if(currentTrack.track !== null){
                    currentTrack.track = appendBuffer(currentTrack.track, e.inputBuffer)
                }
                else{
                    currentTrack.track = e.inputBuffer;
                }
            }
        }
    }

  function appendBuffer(buffer1, buffer2) {
    var numberOfChannels = Math.min( buffer1.numberOfChannels, buffer2.numberOfChannels );
    var tmp = context.createBuffer( numberOfChannels, (buffer1.length + buffer2.length), buffer1.sampleRate );
    for (var i=0; i<numberOfChannels; i++) {
      var channel = tmp.getChannelData(i);
      channel.set( buffer1.getChannelData(i), 0);
      channel.set( buffer2.getChannelData(i), buffer1.length);
    }
    return tmp;
  }


}())