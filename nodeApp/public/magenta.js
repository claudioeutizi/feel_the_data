const MIN_NOTE = 48; //48
const MAX_NOTE = 83; //83
const SEQ_LENGTH = 32;
const HUMANIZE_TIMING = 0.0085;
const N_INTERPOLATIONS = 8;
const CHORD_SYMBOLS = {
  major: 'M',
  minor: 'm',
  major7th: 'M7',
  minor7th: 'm7',
  dominant7th: '7',
  sus2: 'Msus2',
  sus4: 'Msus4'
};
const SAMPLE_SCALE = [
  'C3',
  'D#3',
  'F#3',
  'A3',
  'C4',
  'D#4',
  'F#4',
  'A4',
  'C5',
  'D#5',
  'F#5',
  'A5'
];
const loopEvent = new Event("loopEvent");

let Tone = mm.Player.tone;
let musicData = {};

Tone.Transport.bpm.value = 80;

let vae = new mm.MusicVAE( 'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_vae/mel_2bar_small');
let rnn = new mm.MusicRNN( 'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv');

let reverb = new Tone.Convolver(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
).toMaster();
reverb.wet.value = 0.15;
let samplers = [
  {
    high: buildSampler(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/marimba-classic-'
    ).connect(new Tone.Panner(-0.4).connect(reverb)),
    mid: buildSampler(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/marimba-classic-mid-'
    ).connect(new Tone.Panner(-0.4).connect(reverb)),
    low: buildSampler(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/marimba-classic-low-'
    ).connect(new Tone.Panner(-0.4).connect(reverb))
  },
  {
    high: buildSampler(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/xylophone-dark-'
    ).connect(new Tone.Panner(0.4).connect(reverb)),
    mid: buildSampler(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/xylophone-dark-mid-'
    ).connect(new Tone.Panner(0.4).connect(reverb)),
    low: buildSampler(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/xylophone-dark-low-'
    ).connect(new Tone.Panner(0.4).connect(reverb))
  }
];

let sixteenth = Tone.Time('16n').toSeconds();
let quarter = Tone.Time('4n').toSeconds();
let temperature = 1.1;
let generatingIndicator = document.querySelector('#generating');
let container = document.querySelector('#vis-elements');
let outputSelector = document.querySelector('#output-selector');
let tempoSourceSelector = document.querySelector('#tempo-source-selector');

let currentStep = 0;
let sequences = [];
let mouseDown = false;
let chordLeft = CHORD_SYMBOLS['major'], chordRight = CHORD_SYMBOLS['major'];
let tonicLeft = 0, tonicRight = 0;
let currentMidiOutput;
let transportPlayerId = null;
let wait_time = 30000;
let loopRestarted = 0;
var check = {restarted: 0};
let pollList = [];
let tempList = [];
let div = document.createElement('div');

function buildSampler(urlPrefix) {
  return new Tone.Sampler(
    _.fromPairs(
      SAMPLE_SCALE.map(n => [
        n,
        new Tone.Buffer(`${urlPrefix}${n.toLowerCase().replace('#', 's')}.mp3`)
      ])
    )
  );
}

function generateSeq(chord, startNotes) {
  let seedSeq = toNoteSequence(startNotes);
  console.log(chord);
  return rnn.continueSequence(seedSeq, SEQ_LENGTH, temperature, [chord]);
}

function toNoteSequence(seq) {
  let notes = [];
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] === -1 && notes.length) {
      _.last(notes).endTime = i * 0.5;
    } else if (seq[i] !== -2 && seq[i] !== -1) {
      if (notes.length && !_.last(notes).endTime) {
        _.last(notes).endTime = i * 0.5;
      }
      notes.push({
        pitch: seq[i],
        startTime: i * 0.5
      });
    }
  }
  if (notes.length && !_.last(notes).endTime) {
    _.last(notes).endTime = seq.length * 0.5;
  }
  return mm.sequences.quantizeNoteSequence(
    {
      ticksPerQuarter: 220,
      totalTime: seq.length * 0.5,
      quantizationInfo: {
        stepsPerQuarter: 1
      },
      timeSignatures: [
        {
          time: 0,
          numerator: 4,
          denominator: 4
        }
      ],
      tempos: [
        {
          time: 0,
          qpm: 120
        }
      ],
      notes
    },
    1
  );
}

function isValidNote(note, forgive = 0) {
  return note <= MAX_NOTE + forgive && note >= MIN_NOTE - forgive;
}

function octaveShift(note) {
  let shift = MAX_NOTE - note > note - MIN_NOTE ? 12 : -12;
  let delta = 0;
  while (isValidNote(note + delta + shift)) {
    delta += shift;
  }
  return note + delta;
}

function transposeIntoRange(note) {
  while (note > MAX_NOTE) {
    note -= 12;
  }
  while (note < MIN_NOTE) {
    note += 12;
  }
  return note;
}

function mountChord(tonic, chord) {
  return Tone.Frequency(tonic, 'midi').toNote() + chord;
}

function restPad(note) {
  if (Math.random() < 0.6) {
    return [note, -2];
  } else if (Math.random() < 0.8) {
    return [note];
  } else {
    return [note, -2, -2];
  }
}

function playStep(time = Tone.now() - Tone.context.lookAhead) {
  let notesToPlay = distributeNotesToPlay(
    collectNotesToPlay(currentStep % SEQ_LENGTH)
  );
  for (let { delay, notes } of notesToPlay) {
    let voice = 0;
    let stepSamplers = _.shuffle(samplers);
    for (let { pitch, path, halo } of notes) {
      let freq = Tone.Frequency(pitch, 'midi');
      let playTime = time + delay + HUMANIZE_TIMING * Math.random();
      let velocity;
      if (delay === 0) velocity = 'high';
      else if (delay === sixteenth / 2) velocity = 'mid';
      else velocity = 'low';
      
      stepSamplers[voice++ % stepSamplers.length][velocity].triggerAttack(
        freq,
        playTime
      );
    }
  }
  if(currentStep % SEQ_LENGTH == 0){
    loopRestarted++;
    div.dispatchEvent(loopEvent);
    console.log(Tone.Transport);
  }
  currentStep++;
}

function collectNotesToPlay(step) {
  let notesToPlay = [];
  for (let seq of sequences) {
    if (!seq.on) continue;
    if (seq.notes.has(step)) {
      notesToPlay.push(seq.notes.get(step));
    }
  }
  return _.shuffle(notesToPlay);
}

function distributeNotesToPlay(notes) {
  index = 1;
  let subdivisions = [
    { delay: 0, notes: [] },
    { delay: sixteenth / 2, notes: [] },
    { delay: sixteenth, notes: [] },
    { delay: (sixteenth * 3) / 2, notes: [] }
  ];
  if (notes.length) {
    subdivisions[0].notes.push(notes.pop());
  }
  if (notes.length) {
    subdivisions[2].notes.push(notes.pop());
  }
  while (notes.length && Math.random() < Math.min(notes.length, 6) / 10) {
    let rnd = Math.random();
    let subdivision;
    if (rnd < 0.4) {
      subdivision = 0;
    } else if (rnd < 0.6) {
      subdivision = 1;
    } else if (rnd < 0.8) {
      subdivision = 2;
    } else {
      subdivision = 3;
    }
    subdivisions[subdivision].notes.push(notes.pop());
  }
  return subdivisions;
}

function toggleSeq(seqObj) {
  if (seqObj.on) {
    seqObj.on = false;
  } else {
    seqObj.on = true;
  }
}

function buildSeed(chord) {
  let notes = Tonal.Chord.notes(chord)
    .map(n => Tonal.Note.midi(n))
    .map(transposeIntoRange);
  return _.flatMap(_.shuffle(notes), restPad);
}

function generateSpace(tonicLeft, chordLeft, tonicRight, chordRight, seqList) {
    let chords = [
      mountChord(octaveShift(MIN_NOTE + tonicLeft), chordLeft),
      mountChord(MIN_NOTE + tonicLeft, chordLeft),
      mountChord(octaveShift(MIN_NOTE + tonicRight), chordRight),
      mountChord(MIN_NOTE + tonicRight, chordRight)
    ];
    return Promise.all([
      generateSeq(chords[0], buildSeed(chords[0])),
      //generateSeq(chords[1], buildSeed(chords[1])),
      generateSeq(chords[2], buildSeed(chords[2])),
      //generateSeq(chords[3], buildSeed(chords[3]))
    ])
      .then(noteSeqs => vae.interpolate(noteSeqs, N_INTERPOLATIONS))
      .then(res => {
        sequences = res.map((noteSeq, idx) => {

          let notes = new Map();
          for ({ pitch, quantizedStartStep, quantizedEndStep } of noteSeq.notes) {
            if (!isValidNote(pitch, 4)) {
              continue;
            }
            notes.set(quantizedStartStep, {
              pitch,
            });
          }

          let seqObj = { notes, on: false };
          seqList.push(seqObj);
          return seqObj;
      });
    });
}

function regenerateSpace() {
  // Pause Tone timeline while regenerating so events don't pile up if it's laggy.
  Tone.Transport.pause();
  generatingIndicator.style.display = 'flex';
  setTimeout(() => {
    generateSpace().then(() => {
      generatingIndicator.style.display = 'none';
      setTimeout(() => Tone.Transport.start(), 0);
    });
  }, 0);
}

function startTransportPlay() {
  if (_.isNull(transportPlayerId)) {
    transportPlayerId = Tone.Transport.scheduleRepeat(playStep, '16n');
  }
}

function stopTransportPlay() {
  if (!_.isNull(transportPlayerId)) {
    Tone.Transport.clear(transportPlayerId);
    transportPlayerId = null;
  }
}

function mainProcess(){
  console.log("main process");
  //Chiamata OW
  mainOpenWeather().then(res => {
    setGraphicParameters(res);
    
    newMusicData = extractOWData(res);
    let pollList2 = [];
    let tempList2 = [];
    console.log("new poll " + newMusicData.pollution_chord);
    console.log("old poll " + musicData.pollution_chord);
    console.log("new poll " + newMusicData.weather_chord);
    console.log("old poll " + musicData.weather_chord);
    Promise.all([
      generateSpace(0,musicData.pollution_chord, 0, newMusicData.pollution_chord, pollList2), 
      generateSpace(0,musicData.weather_chord, 0, newMusicData.weather_chord, tempList2)])
      .then(() => {
        musicData = newMusicData;
        i = 0;
        pollList = pollList2;
        tempList = tempList2;
        
        pollList[0].on = true;
        tempList[0].on = true;

        div.addEventListener("loopEvent", eventFunction)
    })
    
  });
}

function eventFunction(){
  if(pollList[i].on == false){
    pollList[i-1].on = false;
    pollList[i].on = true;
  }
  if(tempList[i].on == false){
    tempList[i-1].on = false;
    tempList[i].on = true;
  }
  i++;
  if(i >= N_INTERPOLATIONS){
    console.log("end");
    div.removeEventListener("loopEvent", eventFunction);
    setTimeout(mainProcess, wait_time);
  }
}

function extractOWData(data){
  no2 = data["pollution"].list[0].components.no2;
  if(no2 > 350) no2 = 350;
  valence = mapValue(no2, 0, 350, 1, -1);
  console.log("valence: " + valence);

  pm10 = data["pollution"].list[0].components.pm10;
  if(pm10 > 180) pm10 = 180;
  arousal = mapValue(pm10, 0, 180, -1, 1);
  console.log("arousal: " + arousal);

  console.log(valuesToChords(valence, arousal));
  return {
    pollution_chord: valuesToChords(valence, arousal),
    weather_chord: weatherToChords(data["weather"].weather[0].main)
  }
}

function mapValue(value, fromMin, fromMax, toMin, toMax) {
  var proportion = (value - fromMin) / (fromMax - fromMin);
  var outputValue = (proportion * (toMax - toMin)) + toMin;
  return outputValue;
}

function weatherToChords(string){
  if(string == "Clear"){
    Tone.Transport.bpm.value = 50;
    return CHORD_SYMBOLS['major'];
  } else if(string == "Thunderstorm"){
    Tone.Transport.bpm.value = 120;
    return CHORD_SYMBOLS["minor7th"];
  } else if(string == "Rain"){
    Tone.Transport.bpm.value = 50;
    return CHORD_SYMBOLS["minor"];
  } else if(string == "Snow"){
    Tone.Transport.bpm.value = 70;
    return CHORD_SYMBOLS["sus2"];
  } else if(string == "Atmosphere"){
    Tone.Transport.bpm.value = 60;
    return CHORD_SYMBOLS["sus4"];
  } else if(string == "Drizzle"){
    Tone.Transport.bpm.value = 90;
    return CHORD_SYMBOLS["major7th"];
  } else if(string == "Clouds"){
    Tone.Transport.bpm.value = 55;
    return CHORD_SYMBOLS["dominant7th"];
  }
}

//ritorna l'accordo secondo il piano valence-arousal di chatGPT
//funzione testata
function valuesToChords(val, ar){
  if(val >= 0 && ar < 0){
    return CHORD_SYMBOLS['major'];
  } else if (val >= 0.5 && ar>=0){
    return CHORD_SYMBOLS['major7th'];
  } else if ((val < 0.5 && val >= -0.5) && (ar >= 0 && ar < 0.75)){
    return CHORD_SYMBOLS['sus2'];
  } else if ((val < 0.5 && val >= -0.5) && (ar >= 0.75)){
    return CHORD_SYMBOLS['sus4'];
  } else if ((val < -0.5) && (ar >= 0 && ar < 0.5)){
    return CHORD_SYMBOLS['dominant7th'];
  } else if ((val < -0.5) && (ar >= 0.5)){
    return CHORD_SYMBOLS['minor7th'];
  } else if ((val < 0) && (ar < 0)){
    return CHORD_SYMBOLS['minor'];
  }
}


Promise.all([
  rnn.initialize(),
  vae.initialize(),
  new Promise(res => Tone.Buffer.on('load', res))
])
  .then(() => {
  mainOpenWeather().then(res => {
    musicData = extractOWData(res);
    console.log("accordo1 "+ musicData.pollution_chord);
    console.log("accordo2 "+ musicData.weather_chord);
    Promise.all([
      generateSpace(0,musicData.pollution_chord,0, musicData.pollution_chord, pollList), 
      generateSpace(0,musicData.weather_chord,0, musicData.weather_chord, tempList)])
      .then(() => {
        console.log("generata prima sequenza");
        pollList[0].on = true;
        tempList[0].on = true;
        //Dopo 5 sec chiama la funzione principale
        setTimeout(mainProcess, 5000);
    })
  });
  })


StartAudioContext(Tone.context, container);