// Default sounds using real audio clips

function makePlayer(src) {
  return () => {
    const audio = new Audio(src)
    audio.play()
  }
}

export const DEFAULT_SOUNDS = [
  {
    id: 'airhorn',
    name: 'AIR HORN',
    color: '#ef4444',
    audioSrc: '/sounds/airhorn.mp3',
    play: makePlayer('/sounds/airhorn.mp3'),
  },
  {
    id: 'i-am-your-father',
    name: 'I AM YOUR FATHER',
    color: '#f97316',
    audioSrc: '/sounds/i-am-your-father.mp3',
    play: makePlayer('/sounds/i-am-your-father.mp3'),
  },
  {
    id: 'bruh',
    name: 'BRUH',
    color: '#eab308',
    audioSrc: '/sounds/bruh.mp3',
    play: makePlayer('/sounds/bruh.mp3'),
  },
  {
    id: 'you-play-to-win',
    name: 'PLAY TO WIN',
    color: '#22c55e',
    audioSrc: '/sounds/you-play-to-win.mp3',
    play: makePlayer('/sounds/you-play-to-win.mp3'),
  },
  {
    id: 'emotional-damage',
    name: 'EMOTIONAL DAMAGE',
    color: '#3b82f6',
    audioSrc: '/sounds/emotional-damage.mp3',
    play: makePlayer('/sounds/emotional-damage.mp3'),
  },
  {
    id: 'law-and-order',
    name: 'DUN DUN',
    color: '#a855f7',
    audioSrc: '/sounds/law-and-order.mp3',
    play: makePlayer('/sounds/law-and-order.mp3'),
  },
  {
    id: 'imperial-march',
    name: 'IMPERIAL MARCH',
    color: '#ec4899',
    audioSrc: '/sounds/imperial-march.mp3',
    play: makePlayer('/sounds/imperial-march.mp3'),
  },
  {
    id: 'price-is-right',
    name: 'PRICE IS WRONG',
    color: '#06b6d4',
    audioSrc: '/sounds/price-is-right-fail.mp3',
    play: makePlayer('/sounds/price-is-right-fail.mp3'),
  },
  {
    id: 'playoffs',
    name: 'PLAYOFFS?!',
    color: '#84cc16',
    audioSrc: '/sounds/playoffs.mp3',
    play: makePlayer('/sounds/playoffs.mp3'),
  },
  {
    id: 'they-are-who',
    name: 'WHO WE THOUGHT',
    color: '#f59e0b',
    audioSrc: '/sounds/they-are-who-we-thought.mp3',
    play: makePlayer('/sounds/they-are-who-we-thought.mp3'),
  },
  {
    id: 'practice',
    name: 'PRACTICE?!',
    color: '#f43f5e',
    audioSrc: '/sounds/practice.mp3',
    play: makePlayer('/sounds/practice.mp3'),
  },
  {
    id: 'mario-game-over',
    name: 'MARIO DEATH',
    color: '#8b5cf6',
    audioSrc: '/sounds/mario-game-over.mp3',
    play: makePlayer('/sounds/mario-game-over.mp3'),
  },
  {
    id: 'curb',
    name: 'CURB YOUR...',
    color: '#14b8a6',
    audioSrc: '/sounds/curb-your-enthusiasm.mp3',
    play: makePlayer('/sounds/curb-your-enthusiasm.mp3'),
  },
  {
    id: 'rickroll',
    name: 'RICK ROLL',
    color: '#6366f1',
    audioSrc: '/sounds/rickroll.mp3',
    play: makePlayer('/sounds/rickroll.mp3'),
  },
  {
    id: 'mgs-alert',
    name: 'MGS ALERT',
    color: '#d946ef',
    audioSrc: '/sounds/mgs-alert.mp3',
    play: makePlayer('/sounds/mgs-alert.mp3'),
  },
  {
    id: 'free-real-estate',
    name: 'FREE REAL ESTATE',
    color: '#10b981',
    audioSrc: '/sounds/free-real-estate.mp3',
    play: makePlayer('/sounds/free-real-estate.mp3'),
  },
]

export const EXTRA_SOUNDS = [
  {
    id: 'jeopardy',
    name: 'JEOPARDY',
    color: '#3b82f6',
    audioSrc: '/sounds/jeopardy.mp3',
    play: makePlayer('/sounds/jeopardy.mp3'),
  },
  {
    id: 'show-me-the-money',
    name: 'SHOW ME THE MONEY',
    color: '#22c55e',
    audioSrc: '/sounds/show-me-the-money.mp3',
    play: makePlayer('/sounds/show-me-the-money.mp3'),
  },
  {
    id: 'doh',
    name: "D'OH!",
    color: '#eab308',
    audioSrc: '/sounds/doh.mp3',
    play: makePlayer('/sounds/doh.mp3'),
  },
  {
    id: 'noice',
    name: 'NOICE',
    color: '#06b6d4',
    audioSrc: '/sounds/noice.mp3',
    play: makePlayer('/sounds/noice.mp3'),
  },
  {
    id: 'winter-is-coming',
    name: 'WINTER IS COMING',
    color: '#64748b',
    audioSrc: '/sounds/winter-is-coming.mp3',
    play: makePlayer('/sounds/winter-is-coming.mp3'),
  },
  {
    id: 'ill-be-back',
    name: "I'LL BE BACK",
    color: '#ef4444',
    audioSrc: '/sounds/ill-be-back.mp3',
    play: makePlayer('/sounds/ill-be-back.mp3'),
  },
  {
    id: 'alrighty-then',
    name: 'ALRIGHTY THEN',
    color: '#f97316',
    audioSrc: '/sounds/alrighty-then.mp3',
    play: makePlayer('/sounds/alrighty-then.mp3'),
  },
  {
    id: 'finish-him',
    name: 'FINISH HIM!',
    color: '#dc2626',
    audioSrc: '/sounds/finish-him.mp3',
    play: makePlayer('/sounds/finish-him.mp3'),
  },
  {
    id: 'he-could-go',
    name: 'ALL THE WAY!',
    color: '#a855f7',
    audioSrc: '/sounds/he-could-go-all-the-way.mp3',
    play: makePlayer('/sounds/he-could-go-all-the-way.mp3'),
  },
  {
    id: 'back-back-gone',
    name: 'BACK BACK GONE',
    color: '#ec4899',
    audioSrc: '/sounds/back-back-back-gone.mp3',
    play: makePlayer('/sounds/back-back-back-gone.mp3'),
  },
  {
    id: 'ready-to-rumble',
    name: 'READY TO RUMBLE',
    color: '#f43f5e',
    audioSrc: '/sounds/ready-to-rumble.mp3',
    play: makePlayer('/sounds/ready-to-rumble.mp3'),
  },
  {
    id: 'handle-the-truth',
    name: "HANDLE THE TRUTH",
    color: '#8b5cf6',
    audioSrc: '/sounds/handle-the-truth.mp3',
    play: makePlayer('/sounds/handle-the-truth.mp3'),
  },
]
