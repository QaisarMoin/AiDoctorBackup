const text = "Start stop Start provisional diagnosis clinical notes enter details clinical findings recommended test RCBC extract stop and extract medical data";
const lowerText = text.toLowerCase();

// Without regex \b, using plain indexOf
const startTriggers = ['hey maddy', 'start maddy', 'start'];
const endTriggers = ['stop maddy', 'stop'];

let lastStartIndex = -1;
let usedStartTrigger = '';
for (const trigger of startTriggers) {
  const index = lowerText.lastIndexOf(trigger);
  if (index > lastStartIndex) {
    lastStartIndex = index;
    usedStartTrigger = trigger;
  }
}

const contentStartIndex = lastStartIndex + usedStartTrigger.length;

let firstEndIndex = Infinity;
let usedEndTrigger = '';
for (const trigger of endTriggers) {
  const index = lowerText.indexOf(trigger, contentStartIndex);
  if (index !== -1 && index < firstEndIndex) {
    firstEndIndex = index;
    usedEndTrigger = trigger;
  }
}

console.log({ 
  lastStartIndex, 
  usedStartTrigger,
  firstEndIndex,
  usedEndTrigger,
  content: lowerText.substring(contentStartIndex, firstEndIndex).trim()
});
