var speech = require('@google-cloud/speech');
var fs = require('fs');

var client = new speech.SpeechClient({
    projectId: 'sunny-caldron-246613',
    keyFile: '../../../Google speech key/sunny-caldron-246613-6c58c01cc255.json'
});

console.log("authentication done");

var filename = 'audios/file-1563134936890.wav';

var config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US'
};

var request = {
    config: config,
    interimResults: false,
};

var stream = client.streamingRecognize(request)
.on('data', (data)=>{
    console.log(data.results[0].alternatives[0].transcript);
})
.on('error', (err)=>{
    console.log(err);
})
fs.createReadStream(filename).pipe(stream);

console.log("receiving...");