var speech = require('@google-cloud/speech');
var fs = require('fs');

var client = new speech.SpeechClient({
    projectId: 'sunny-caldron-246613',
    keyFile: './sunny-caldron-246613-6c58c01cc255.json'
});

console.log("authentication done");

var filename = 'audios/file-1563029659687.wav';

var file = fs.readFile(filename, (err, data)=>{
    var audioBytes = data.toString('base64');
    var audio = {
        content: audioBytes
    };
    var config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US'
    };

    var request = {
        audio: audio,
        config: config
    };

    client.recognize(request, (err, result)=>{
        
        var text = "";
        
        console.log("start error");
        console.log(err);
        console.log("end error");
        

        result['results'].forEach(element => {
            element['alternatives'].forEach(subElement => {
                text += subElement['transcript'] + " ";
            });
        });

        console.log(text);

        console.log("starting another request");

        client.recognize(request, (err, result)=>{
            var text = "";
            result['results'].forEach(element => {
                element['alternatives'].forEach(subElement => {
                    text += subElement['transcript'] + " ";
                });
            });
            console.log(text);
        })

    });

});