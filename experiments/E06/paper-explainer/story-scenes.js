// Coordinates are percentages of the illustration stage. Width follows the stage
// width; the artwork keeps its own aspect ratio. Motion cues are semantic only.
const piece = (id, art, x, y, width, layer = 2, label = null) =>
  ({ id, art, position: { x, y, width }, layer, label });
const link = (id, from, to, meaning, inset = 11) => ({ id, from, to, meaning, inset });

globalThis.paperScenes = {
  'flights-hook': {
    locale: 'en-IN', topic: 'Why are flights so expensive?', beat: 'hook',
    heading: 'Why are flights so expensive?',
    narrationCaption: 'One ticket helps pay for much more than the seat.',
    objects: [
      piece('fare-backdrop', 'ground', 49, 48, 95, 0),
      piece('boarding-ticket', 'ticket', 48, 61, 73),
      piece('departing-aircraft', 'airplane', 48, 39, 86, 3),
      piece('fare-question', 'question', 81, 17, 16, 4),
    ],
    relationships: [link('question-points-to-fare', 'fare-question', 'boarding-ticket', 'calls attention to the ticket', 17)],
    cues: [
      { object: 'boarding-ticket', when: 'ticket is introduced', action: 'place' },
      { object: 'departing-aircraft', when: 'the seat is mentioned', action: 'lift-and-settle' },
    ],
  },
  'flights-mechanism': {
    locale: 'en-IN', topic: 'Why are flights so expensive?', beat: 'mechanism',
    heading: 'What it takes to fly',
    narrationCaption: 'Even before boarding, an airline has to get the aircraft, crew and airport services ready.',
    objects: [
      piece('cost-backdrop', 'ground', 51, 49, 91, 0),
      piece('operating-flight', 'airplane', 50, 52, 47, 3),
      piece('fuel-supply', 'fuel-cutout', 23, 21, 25, 2, 'Fuel'),
      piece('flight-crew', 'crew-cutout', 77, 21, 25, 2, 'People'),
      piece('aircraft-upkeep', 'tools-cutout', 23, 79, 25, 2, 'Aircraft upkeep'),
      piece('airport-services', 'airport-cutout', 77, 79, 25, 2, 'Airport services'),
    ],
    relationships: [
      link('fuel-to-flight', 'fuel-supply', 'operating-flight', 'powers', 9),
      link('crew-to-flight', 'flight-crew', 'operating-flight', 'operates', 9),
      link('upkeep-to-flight', 'aircraft-upkeep', 'operating-flight', 'maintains', 9),
      link('airport-to-flight', 'airport-services', 'operating-flight', 'supports departure and landing', 9),
    ],
    cues: ['fuel-supply','flight-crew','aircraft-upkeep','airport-services'].map(object =>
      ({ object, when: 'its operating cost is named', action: 'reveal-with-connector' })),
  },
  'flights-closing': {
    locale: 'en-IN', topic: 'Why are flights so expensive?', beat: 'takeaway',
    heading: 'Same route. Different fare.',
    narrationCaption: 'If your plans are flexible, compare nearby departure dates.',
    objects: [
      piece('date-backdrop', 'ground', 50, 50, 96, 0),
      piece('route-ghost', 'airplane', 51, 46, 54, 1),
      piece('date-tab-a', 'calendar', 28, 24, 24, 2, 'One date'),
      piece('date-tab-b', 'calendar', 74, 24, 24, 2, 'Another date'),
      piece('fare-ticket-a', 'ticket', 27, 70, 44, 3, 'Check fare'),
      piece('fare-ticket-b', 'ticket-alt', 73, 76, 44, 3, 'Check fare'),
    ],
    relationships: [
      link('one-date-to-fare', 'date-tab-a', 'fare-ticket-a', 'choose a date and compare its fare', 17),
      link('other-date-to-fare', 'date-tab-b', 'fare-ticket-b', 'choose a second date on the same route', 17),
    ],
    cues: [
      { object: 'date-tab-a', when: 'nearby dates are introduced', action: 'place' },
      { object: 'date-tab-b', when: 'compare is spoken', action: 'place' },
      { object: 'fare-ticket-b', when: 'comparison settles', action: 'emphasize' },
    ],
  },
  'wifi-mechanism': {
    locale: 'en-IN', topic: 'How does Wi-Fi work?', beat: 'mechanism',
    heading: 'How does Wi-Fi work?',
    narrationCaption: 'Your device sends data over radio. The router forwards traffic toward the internet.',
    objects: [
      piece('network-backdrop', 'ground', 50, 51, 94, 0),
      piece('your-device', 'phone', 22, 63, 28, 3, 'Your device'),
      piece('home-router', 'router', 54, 42, 38, 3, 'Router'),
      piece('upstream-network', 'cloud', 81, 20, 31, 3, 'Internet'),
      piece('radio-annotation', null, 28, 36, 31, 4, 'Wi-Fi radio'),
      piece('uplink-annotation', null, 82, 42, 25, 4, 'Uplink'),
    ],
    relationships: [
      { ...link('device-radio-router', 'your-device', 'home-router', 'local radio link', 14), dashed: true },
      link('router-to-internet', 'home-router', 'upstream-network', 'forwards traffic upstream', 12),
    ],
    cues: [
      { object: 'device-radio-router', when: 'over radio is spoken', action: 'trace' },
      { object: 'router-to-internet', when: 'forwards is spoken', action: 'trace' },
    ],
  },
};
