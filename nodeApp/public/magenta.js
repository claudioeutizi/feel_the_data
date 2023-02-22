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
  sus4: 'Msus4',
  diminished: 'o',
  halfDiminished: 'm7b5',
  add9: 'add9',
  major7thaug11: 'M7#11'
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

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

let Tone = mm.Player.tone;
let musicData = {};
let rootNote = 0;

Tone.Transport.bpm.value = 80;

let vae = new mm.MusicVAE('https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_vae/mel_2bar_small');
let rnn = new mm.MusicRNN('https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv');

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
let wait_time = 4000;
let loopRestarted = 0;
var check = { restarted: 0 };
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
  if (currentStep % SEQ_LENGTH == 0) {
    loopRestarted++;
    div.dispatchEvent(loopEvent);
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
    console.log("stopping play");
    transportPlayerId = null;
  }
}

function mainProcess() {
  console.log("main process");
  //Chiamata OW
  mainOpenWeather().then(res => {
    setGraphicParameters(res);
    console.log("pre extraction");
    newMusicData = extractOWData(res);
    let pollList2 = [];
    let tempList2 = [];
    console.log("new poll " + newMusicData.chord);
    console.log("old poll " + musicData.chord);
    Promise.all([
      generateSpace(rootNote, musicData.chord, rootNote, newMusicData.chord, pollList2),
      generateSpace(rootNote, musicData.chord, rootNote, newMusicData.chord, tempList2)])
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

function eventFunction() {
  if (pollList[i].on == false) {
    pollList[i - 1].on = false;
    pollList[i].on = true;
  }
  if (tempList[i].on == false) {
    tempList[i - 1].on = false;
    tempList[i].on = true;
  }
  i++;
  if (i >= N_INTERPOLATIONS) {
    console.log("end");
    div.removeEventListener("loopEvent", eventFunction);
    setTimeout(mainProcess, wait_time);
  }
}

function extractOWData(data) {
  valence = mapValue(data["pollution"].list[0].main.aqi, 5, 1, -1, 1);
  arousal = weatherToArousal(data["weather"].weather[0].id);
  //no2 = data["pollution"].list[0].components.no2;
  //if (no2 > 350) no2 = 350;
  //valence = mapValue(no2, 0, 350, 1, -1);
  console.log("valence: " + valence);
  console.log("pollution " + data["pollution"].list[0].main.aqi);

  //pm10 = data["pollution"].list[0].components.pm10;
  //if (pm10 > 180) pm10 = 180;
  //arousal = mapValue(pm10, 0, 180, -1, 1);
  console.log("arousal: " + arousal);

  console.log("weather " + data["weather"].weather[0].id);
  return {
    chord: valuesToChords(
      valence,
      arousal)
  }
}

function testvaluestochords(){
  valence = mapValue(5, 5, 1, -1, 1);
  arousal = weatherToArousal(800);
  console.log("min " + valuesToChords(valence, arousal));
  valence = mapValue(1, 5, 1, -1, 1);
  arousal = weatherToArousal(800);
  console.log("maj " + valuesToChords(valence, arousal));
}

function mapValue(value, fromMin, fromMax, toMin, toMax) {
  if(fromMax - fromMin == 0){
    //caso divisione per 0
    return (toMin + toMax /2);
  } else {
    var proportion = (value - fromMin) / (fromMax - fromMin);
    console.log("proportion : " + proportion + "fromMin " + fromMin + "fromMax " + fromMax + "toMin "+ toMin + "toMax " + toMax + "value " + value);
    var outputValue = (proportion * (toMax - toMin)) + toMin;
    return outputValue;
  }
}

function weatherToArousal(id) {
  if (id == 800) {
    //clear
    changeBPM(50);
    return -1;
  } else if (id >= 200 && id <= 232) {
    //thunderstorm
    changeBPM(120);
    return mapValue(id, 200, 232, ((2 / 3) + 0.0001), 1);
  } else if (id >= 500 && id <= 531) {
    //rain
    changeBPM(50);
    return mapValue(id, 500, 531, (0 + 0.0001), (1 / 3));
  } else if (id >= 600 && id <= 622) {
    //snow
    changeBPM(70);
    return mapValue(id, 600, 622, ((1 / 3) + 0.0001), (2 / 3));
  } else if (id >= 701 && id <= 781) {
    //atmosphere
    changeBPM(60);
    return mapValue(id, 701, 781, (-1 + 0.0001), (-2 / 3));
  } else if (id >= 300 && id <= 321) {
    //drizzle
    changeBPM(90);
    return mapValue(id, 300, 321, (((-1 / 3) + 0.0001)), 0);
  } else if (id >= 801 && id <= 804) {
    //clouds
    changeBPM(55);
    return mapValue(id, 801, 804, ((-2 / 3) + 0.0001), -(1 / 3));
  }
}

function changeBPM(value) {
  /*Tone.Transport.stop();
  Tone.Transport.bpm.value = value;
  Tone.Transport.start();*/
  console.log("stopping to change to " + value);
  /*
  new Promise((resolve) =>{
    stopTransportPlay()
    setTimeout(resolve, 1);
  }).then(Tone.Transport.bpm.rampTo(value, 1));

  console.log("value changed");
  startTransportPlay();
  */
}

//ritorna l'accordo secondo il piano valence-arousal di chatGPT
//funzione testata
function valuesToChords(val, ar) {
  //clear
  if ((val <= 1 && val >= 0.5) && (ar == -1)) {
    return CHORD_SYMBOLS['major'];
  } else if ((val < 0.5 && val > -0.5) && (ar == -1)) {
    return CHORD_SYMBOLS['dominant7th'];
  } else if ((val <= -0.5 && val >= -1) && (ar == -1)) {
    return CHORD_SYMBOLS['minor'];
  } 
  //mid-low arousal (atmosphere - rain)
  else if ((val <= 1 && val >= 0.5) && (ar > -1 && ar <= -(1/3))) {
    return CHORD_SYMBOLS['major7th'];
  } else if ((val < 0.5 && val > -0.5) && (ar > -1 && ar <= 0)){
    return CHORD_SYMBOLS['sus2'];
  } else if ((val <= -0.5 && val >= -1) && (ar > -1 && ar <= -(1/3))){
    return CHORD_SYMBOLS['minor7th'];
  }
  //mid-high arousal
  else if ((val <= 1 && val >= 0.5) && (ar > -(1/3) && ar <= (2/3))) {
    return CHORD_SYMBOLS['add9'];
  } else if ((val < 0.5 && val > -0.5) && (ar > 0 && ar <= 1)){
    return CHORD_SYMBOLS['sus4'];
  } else if ((val <= -0.5 && val >= -1) && (ar > -(1/3) && ar <= (2/3))){
    return CHORD_SYMBOLS['halfDiminished'];
  }
  //high arousal
  else if ((val <= 1 && val >= 0.5) && (ar > (2/3) && ar <= 1)) {
    return CHORD_SYMBOLS['major7thaug11'];
  } else if ((val <= -0.5 && val >= -1) && (ar > (2/3) && ar <= 1)){
    return CHORD_SYMBOLS['diminished'];
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
      rootNote = randomIntFromInterval(0, 12);
      console.log("accordo1 " + musicData.chord);
      Promise.all([
        generateSpace(rootNote, musicData.chord, rootNote, musicData.chord, pollList),
        generateSpace(rootNote, musicData.chord, rootNote, musicData.chord, tempList)])
        .then(() => {
          console.log("generata prima sequenza");
          pollList[0].on = true;
          tempList[0].on = true;
          setGraphicParameters(res);
          //Dopo 5 sec chiama la funzione principale
          setTimeout(mainProcess, 2000);
        })
    });
  })
  .then(() => startTransportPlay())


StartAudioContext(Tone.context, container);