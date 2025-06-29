// Comprehensive TypeScript type definitions for Podcast Data

/**
 * Represents a single podcast entry with speaker and text
 */
export interface PodcastEntry {
  /** The speaker name - either Leo or Gwen */
  speaker: "Leo" | "Gwen";
  /** The spoken text content */
  text: string;
}

/**
 * Union type of all available topic keys
 */
export type TopicKey =
  | "intro"
  | "vocabulary"
  | "barriers"
  | "problem"
  | "mindset"
  | "techniques";

/**
 * Main podcast topics structure containing all categorized entries
 */
export interface PodcastTopics {
  /** Opening remarks and podcast introduction */
  intro: PodcastEntry[];
  /** Important phrases and expressions explained */
  vocabulary: PodcastEntry[];
  /** Common obstacles in English speaking */
  barriers: PodcastEntry[];
  /** Understanding vs speaking English difficulty */
  problem: PodcastEntry[];
  /** Changing mental approach to speaking */
  mindset: PodcastEntry[];
  /** Five practical tips for improving speaking */
  techniques: PodcastEntry[];
}

/**
 * Mapping of topic keys to their display titles
 */
export type TopicTitles = Record<keyof PodcastTopics, string>;

/**
 * Mapping of topic keys to their descriptions
 */
export type TopicDescriptions = Record<keyof PodcastTopics, string>;

/**
 * Complete podcast data structure
 */
export interface PodcastData {
  topics: PodcastTopics;
  titles: TopicTitles;
  descriptions: TopicDescriptions;
  metadata: {
    totalEntries: number;
    totalTopics: number;
    speakers: Array<"Leo" | "Gwen">;
    generatedAt: string;
  };
}

export const podcastTopics: PodcastTopics = {
  intro: [
    {
      speaker: "Leo",

      text: "Hey hey hey! What’s up, everybody?",
    },
    {
      speaker: "Leo",

      text: "Welcome back to Pod Chill!",
    },
    {
      speaker: "Leo",

      text: "I’m Leo – your favorite joke master.",
    },
    {
      speaker: "Gwen",

      text: "And I’m Gwen.",
    },
  ],
  vocabulary: [
    {
      speaker: "Gwen",

      text: "I’m here to help Leo stay on track so that he doesn’t make too many silly jokes.",
    },
    {
      speaker: "Leo",

      text: "That’s my talent! But today we’re not just here for jokes.",
    },
    {
      speaker: "Leo",

      text: "We’re talking about something serious. Kind of.",
    },
    {
      speaker: "Gwen",

      text: "A problem many English learners face: You can understand English. You watch movies, you understand songs, maybe you even understand us.",
    },
    {
      speaker: "Leo",

      text: "But when it’s your turn to speak?",
    },
    {
      speaker: "Gwen",

      text: "It’s like... blank.",
    },
    {
      speaker: "Leo",

      text: "Your legs won’t move. You fall flat on your face.",
    },
    {
      speaker: "Gwen",

      text: "Today, we will discover the reasons behind that problem.",
    },
    {
      speaker: "Leo",

      text: "Also, Gwen and I will help you solve the problem with five useful tips.",
    },
    {
      speaker: "Leo",

      text: "The last tip is the most important one, so stay with us until the end. Deal?",
    },
    {
      speaker: "Gwen",

      text: "Let’s go!",
    },
    {
      speaker: "Gwen",

      text: "It’s backed by science too.",
    },
    {
      speaker: "Gwen",

      text: "A study from the University of Essex found that students who stopped translating and thought directly in English improved fluency faster than those who didn’t.",
    },
    {
      speaker: "Gwen",

      text: "They felt more confident when speaking, even if their grammar wasn’t perfect.",
    },
    {
      speaker: "Leo",

      text: "First up, we have “fall flat on your face.”It means to completely fail in an embarrassing way.",
    },
    {
      speaker: "Leo",

      text: "Example: I tried to impress my English teacher but fell flat on my face when I forgot all my words.",
    },
    {
      speaker: "Gwen",

      text: "Ouch, I’ve been there. So awkward!",
    },
    {
      speaker: "Gwen",

      text: "Next is “stay on track.” It means to keep going in the right direction, especially when learning something.",
    },
    {
      speaker: "Gwen",

      text: "Example: Even if you make mistakes, just stay on track and keep practicing.",
    },
    {
      speaker: "Leo",

      text: "That’s great advice. Don’t give up halfway!",
    },
    {
      speaker: "Leo",

      text: "Here’s “backed by science.” It means something is supported by research.",
    },
    {
      speaker: "Leo",

      text: "Example: Thinking in English is backed by science. It really works.",
    },
    {
      speaker: "Gwen",

      text: "Ooh, that sounds official!",
    },
    {
      speaker: "Gwen",

      text: "Now try “get the hang of it.” It means to start understanding how to do something well.",
    },
    {
      speaker: "Gwen",

      text: "Example: After a few weeks, I got the hang of conversations.",
    },
    {
      speaker: "Leo",

      text: "Practice really does pay off.",
    },
    {
      speaker: "Leo",

      text: "Then we have “muscle memory.” It means your body remembers how to do something after repeating.",
    },
    {
      speaker: "Leo",

      text: "Example: I repeated them so much, they became muscle memory.",
    },
    {
      speaker: "Gwen",

      text: "Like riding a bike!",
    },
    {
      speaker: "Gwen",

      text: "Now, let’s put your knowledge to the test with a few questions!",
    },
    {
      speaker: "Leo",

      text: "Share your answers in the comments below!",
    },
    {
      speaker: "Gwen",

      text: "The first question.",
    },
    {
      speaker: "Gwen",

      text: "Why is translating in our head a problem?",
    },
    {
      speaker: "Leo",

      text: "Because it makes us speak slowly, sound less natural, and often feel less confident.",
    },
    {
      speaker: "Gwen",

      text: "Well done!",
    },
    {
      speaker: "Leo",

      text: "Let’s do one more.",
    },
    {
      speaker: "Leo",

      text: "What does self-recording help learners recognize?",
    },
    {
      speaker: "Gwen",

      text: "Their pronunciation habits, common mistakes, and areas for improvement.",
    },
    {
      speaker: "Leo",

      text: "Bingo!",
    },
    {
      speaker: "Leo",

      text: "So… we started this episode with a big question: Why can we understand English, but can’t speak it?",
    },
    {
      speaker: "Gwen",

      text: "And now, maybe it doesn’t feel like such a mystery anymore. It’s not about intelligence.",
    },
    {
      speaker: "Gwen",

      text: "Listening is passive — but speaking?",
    },
  ],
  barriers: [
    {
      speaker: "Gwen",

      text: "You freeze.",
    },
    {
      speaker: "Gwen",

      text: "Or you say “uh... uh...” like a broken robot.",
    },
    {
      speaker: "Leo",

      text: "So why does this happen?",
    },
    {
      speaker: "Gwen",

      text: "Fear.",
    },
    {
      speaker: "Gwen",

      text: "Fear of making mistakes, sounding weird, or being judged.",
    },
    {
      speaker: "Leo",

      text: "Totally. Or someone giving you that look like, “What did you just say?”",
    },
    {
      speaker: "Gwen",

      text: "Yeah. Even when people know the words, they freeze.",
    },
    {
      speaker: "Gwen",

      text: "Like their brain just says “Nope, not today.”",
    },
    {
      speaker: "Leo",

      text: "It’s like… you have the sentence in your head, but your mouth refuses to help.",
    },
    {
      speaker: "Gwen",

      text: "The more you stay quiet, the harder it gets to say anything at all.",
    },
    {
      speaker: "Leo",

      text: "It's like being stuck in a loop.",
    },
    {
      speaker: "Leo",

      text: "But don’t worry—we’re not gonna leave you hanging.",
    },
    {
      speaker: "Leo",

      text: "We’ve got five things that actually help.",
    },
    {
      speaker: "Gwen",

      text: "Super simple stuff.",
    },
    {
      speaker: "Gwen",

      text: "Stuff we’ve tried ourselves, and that really works.",
    },
    {
      speaker: "Leo",

      text: "Trust us, it’s worth staying for.",
    },
    {
      speaker: "Gwen",

      text: "So, the first tip is simple but powerful: stop translating in your head.",
    },
    {
      speaker: "Leo",

      text: "Yeah, seriously.",
    },
    {
      speaker: "Leo",

      text: "If you’re thinking, “Okay, I want to say something in English… let me build it word by word from my own language”.",
    },
    {
      speaker: "Leo",

      text: "That's when you’re already stuck.",
    },
    {
      speaker: "Gwen",

      text: "That's like ordering fast food but needing to read the whole menu with Google Translate.",
    },
    {
      speaker: "Leo",

      text: "By the time you decide, your fries are cold.",
    },
    {
      speaker: "Leo",

      text: "And that fear? It gets quieter. Smaller.",
    },
    {
      speaker: "Leo",

      text: "Instead of saying, “I’m learning English”…",
    },
    {
      speaker: "Leo",

      text: "Say, “I’m a person who communicates in English.”",
    },
    {
      speaker: "Gwen",

      text: "Good examples, Leo.",
    },
    {
      speaker: "Gwen",

      text: "When you believe that, your brain starts to support it.",
    },
    {
      speaker: "Leo",

      text: "You’ll act like that person. You’ll speak more.",
    },
    {
      speaker: "Gwen",

      text: "And here’s a line you can repeat to yourself, every day:",
    },
    {
      speaker: "Gwen",

      text: "“It’s okay to speak badly. That’s how I learn.”",
    },
    {
      speaker: "Leo",

      text: "Say it one more time. With us.",
    },
    {
      speaker: "Gwen",

      text: "Good job.",
    },
    {
      speaker: "Gwen",

      text: "So stop waiting to feel “ready.”",
    },
    {
      speaker: "Leo",

      text: "Start being the person who speaks—right now.",
    },
    {
      speaker: "Gwen",

      text: "We believe in you.",
    },
    {
      speaker: "Leo",

      text: "We are you.",
    },
    {
      speaker: "Gwen",

      text: "And your English voice?",
    },
    {
      speaker: "Leo",

      text: "It’s already inside. Let’s set it free.",
    },
    {
      speaker: "Gwen",

      text: "Before wrapping up, we will learn some phrases.",
    },
    {
      speaker: "Leo",

      text: "Let me do it first.",
    },
    {
      speaker: "Gwen",

      text: "Alright.",
    },
  ],
  problem: [
    {
      speaker: "Gwen",

      text: "Listening is like watching football.",
    },
    {
      speaker: "Gwen",

      text: "You understand the game. You know how to pass, shoot, score.",
    },
    {
      speaker: "Gwen",

      text: "But speaking English?",
    },
    {
      speaker: "Gwen",

      text: "That’s like getting on the field and playing the game yourself.",
    },
    {
      speaker: "Leo",

      text: "That's right.",
    },
    {
      speaker: "Leo",

      text: "Then suddenly, the ball is moving too fast.",
    },
    {
      speaker: "Leo",

      text: "Let’s begin with this: Why can you understand English, but not speak it?",
    },
    {
      speaker: "Gwen",

      text: "Well, listening is a passive skill.",
    },
    {
      speaker: "Gwen",

      text: "Your brain just receives information.",
    },
    {
      speaker: "Gwen",

      text: "You can listen while walking, eating, or even doing your laundry.",
    },
  ],
  mindset: [
    {
      speaker: "Leo",

      text: "Right. You don’t need to do anything with your mouth, or your confidence.",
    },
    {
      speaker: "Gwen",

      text: "But when it comes to speaking, it's another story.",
    },
    {
      speaker: "Gwen",

      text: "You’ve got to think fast, remember words, pronounce them correctly, keep up with the conversation...",
    },
    {
      speaker: "Leo",

      text: "…and somehow not panic while doing it all at once.",
    },
    {
      speaker: "Gwen",

      text: "Imagine this—you watch cooking shows all the time.",
    },
    {
      speaker: "Gwen",

      text: "You know what a risotto looks like, you’ve seen a chef flip a steak perfectly,",
    },
    {
      speaker: "Gwen",

      text: "and you know exactly when to add the garlic.",
    },
    {
      speaker: "Gwen",

      text: "But then someone hands you a pan and says, “Okay, now you cook.”",
    },
    {
      speaker: "Gwen",

      text: "And suddenly, you’re holding the garlic like, “Wait, is this even food?”",
    },
    {
      speaker: "Leo",

      text: "I see where you’re going.",
    },
    {
      speaker: "Leo",

      text: "Listening to English is like watching someone cook.",
    },
    {
      speaker: "Leo",

      text: "But speaking English… that’s stepping into the kitchen yourself.",
    },
    {
      speaker: "Gwen",

      text: "Exactly!",
    },
    {
      speaker: "Gwen",

      text: "You’ve got to train your “speaking muscles.”",
    },
    {
      speaker: "Gwen",

      text: "You just sit back, enjoy the flavors, maybe nod your head and say “Hmm, nice accent.”",
    },
    {
      speaker: "Gwen",

      text: "But speaking?",
    },
    {
      speaker: "Gwen",

      text: "That’s chopping, mixing, and trying not to burn the house down.",
    },
    {
      speaker: "Leo",

      text: "It takes effort. It takes practice. You actually have to do something.",
    },
    {
      speaker: "Gwen",

      text: "And that’s what many learners forget.",
    },
    {
      speaker: "Leo",

      text: "Yup. Just because you understand doesn’t mean you’re ready to speak.",
    },
    {
      speaker: "Gwen",

      text: "When it comes to speaking, you have to think of words,",
    },
    {
      speaker: "Gwen",

      text: "remember grammar, pronounce things, and do it all quickly.",
    },
    {
      speaker: "Gwen",

      text: "People often try to translate in their head before speaking.",
    },
    {
      speaker: "Leo",

      text: "Yes! Like they hear something, think in their native language,",
    },
    {
      speaker: "Leo",

      text: "and then try to turn it into English word by word.",
    },
    {
      speaker: "Gwen",

      text: "So here’s the thing: translating slows you down.",
    },
    {
      speaker: "Gwen",

      text: "You speak slower, less naturally, and you feel more unsure.",
    },
    {
      speaker: "Leo",

      text: "And when you feel unsure, guess what kicks in?",
    },
    {
      speaker: "Leo",

      text: "Confidence really beats perfect grammar any day.",
    },
    {
      speaker: "Leo",

      text: "That’s how you build fluency.",
    },
    {
      speaker: "Leo",

      text: "In your head. Before your mouth.",
    },
    {
      speaker: "Gwen",

      text: "Research from Cambridge University shows that self-recording boosts both fluency and confidence—because you become your own coach.",
    },
    {
      speaker: "Leo",

      text: "You don’t need fancy equipment. Just your phone and your voice.",
    },
    {
      speaker: "Gwen",

      text: "Try this: Every night, record a one-minute diary in English.",
    },
    {
      speaker: "Leo",

      text: "“Today I felt tired. I met my friend. We ate noodles again. I need new hobbies.”",
    },
    {
      speaker: "Gwen",

      text: "The next day, listen to it. Then record again.",
    },
    {
      speaker: "Leo",

      text: "It’s like voice journaling—English edition.",
    },
    {
      speaker: "Gwen",

      text: "After a week, you’ll hear a difference. After a month, you’ll feel more confident.",
    },
    {
      speaker: "Leo",

      text: "And one day, you’ll hear yourself and go: “Whoa. That actually sounds… kinda good.”",
    },
    {
      speaker: "Gwen",

      text: "You don’t need perfect grammar. Just a brave voice.",
    },
    {
      speaker: "Leo",

      text: "So start recording. You’re not just practicing.",
    },
    {
      speaker: "Gwen",

      text: "You’re building proof that you’re improving.",
    },
    {
      speaker: "Gwen",

      text: "Let’s move to tip number four: practice useful phrases you hear all the time.",
    },
    {
      speaker: "Leo",

      text: "Yeah! You don’t need to invent new sentences every time you speak.",
    },
    {
      speaker: "Leo",

      text: "Just grab the classics!",
    },
    {
      speaker: "Leo",

      text: "Like, “I’m good, thanks.”",
    },
    {
      speaker: "Gwen",

      text: "Or “What do you do?”",
    },
    {
      speaker: "Leo",

      text: "My favorite: “Can I get a coffee, please?”",
    },
    {
      speaker: "Gwen",

      text: "These are like muscle memory. The more you say them, the faster they come out.",
    },
    {
      speaker: "Leo",

      text: "You don’t pause to think, “Hmm, how do I express this idea of… requesting caffeine politely?”",
    },
    {
      speaker: "Gwen",

      text: "No! You just say it. Boom.",
    },
    {
      speaker: "Leo",

      text: "It’s kind of like driving.",
    },
    {
      speaker: "Leo",

      text: "At first, you check every mirror 10 times and sweat when changing lanes.",
    },
    {
      speaker: "Leo",

      text: "But once you get the hang of it, your hands just know what to do.",
    },
    {
      speaker: "Gwen",

      text: "Same with language. These daily phrases become automatic.",
    },
    {
      speaker: "Leo",

      text: "And they’re super useful in real life.",
    },
    {
      speaker: "Leo",

      text: "Like when someone asks, “What’s your job?”",
    },
    {
      speaker: "Leo",

      text: "You should be able to shoot back: “I work as a designer.”",
    },
    {
      speaker: "Gwen",

      text: "Or “I’m a student.” Or “I work in marketing.”",
    },
    {
      speaker: "Leo",

      text: "Want to sound natural? Practice chunks like:",
    },
    {
      speaker: "Leo",

      text: "“I’m not sure.” “That’s interesting!” “I don’t think so.”",
    },
    {
      speaker: "Gwen",

      text: "These are called “sentence starters” or “speech chunks.”",
    },
    {
      speaker: "Leo",

      text: "Use them like building blocks.",
    },
    {
      speaker: "Leo",

      text: "You don’t need perfect grammar if your phrase is natural.",
    },
    {
      speaker: "Leo",

      text: "Don’t wait to speak full paragraphs.",
    },
    {
      speaker: "Leo",

      text: "Start with fast, friendly phrases.",
    },
    {
      speaker: "Gwen",

      text: "Say them out loud. Every day. In the mirror.",
    },
    {
      speaker: "Leo",

      text: "Or to your dog.",
    },
    {
      speaker: "Gwen",

      text: "Or to Leo. He’ll answer back.",
    },
    {
      speaker: "Leo",

      text: "Always. Especially if you offer snacks.",
    },
    {
      speaker: "Gwen",

      text: "The goal isn’t to sound smart. It’s to sound real.",
    },
    {
      speaker: "Leo",

      text: "Alright, let's introduce the most important tip, Gwen.",
    },
    {
      speaker: "Leo",

      text: "I believe our listeners have waited until the end to discover this tip.",
    },
    {
      speaker: "Gwen",

      text: "Come right there.",
    },
    {
      speaker: "Gwen",

      text: "You can try every technique we mentioned…",
    },
    {
      speaker: "Gwen",

      text: "But if your mindset is stuck in fear—you’ll stay stuck.",
    },
    {
      speaker: "Leo",

      text: "Think about it.",
    },
    {
      speaker: "Leo",

      text: "Everyone you admire for speaking fluent English…",
    },
    {
      speaker: "Leo",

      text: "…has probably made more than 1,000 embarrassing mistakes.",
    },
    {
      speaker: "Gwen",

      text: "Seriously. Every smooth sentence came after many awkward ones.",
    },
    {
      speaker: "Leo",

      text: "I once said “I am chicken” instead of “I’m scared” on a date.",
    },
    {
      speaker: "Gwen",

      text: "And you still got a second date?",
    },
    {
      speaker: "Leo",

      text: "Nope. But I got a good story.",
    },
    {
      speaker: "Gwen",

      text: "See? Mistakes make you better.",
    },
    {
      speaker: "Leo",

      text: "And funnier.",
    },
    {
      speaker: "Gwen",

      text: "The more you practice, the less scary it gets.",
    },
    {
      speaker: "Gwen",

      text: "That takes practice, effort, and confidence.",
    },
    {
      speaker: "Leo",

      text: "We gave you 5 tips to solve the problem.",
    },
    {
      speaker: "Leo",

      text: "And the most import thing is changing your mindset.",
    },
    {
      speaker: "Gwen",

      text: "Don’t wait to feel ready. Just speak.",
    },
    {
      speaker: "Gwen",

      text: "Even with nervous hands.",
    },
    {
      speaker: "Leo",

      text: "Every word you try is one step closer.",
    },
    {
      speaker: "Leo",

      text: "Every sentence you try is proof that your English voice is already there.",
    },
    {
      speaker: "Gwen",

      text: "So don’t just sit on the bench. Step into the game.",
    },
    {
      speaker: "Gwen",

      text: "We’ll be cheering for you.",
    },
    {
      speaker: "Leo",

      text: "Thanks for spending this time with us.",
    },
    {
      speaker: "Leo",

      text: "Until next time, keep learning…",
    },
    {
      speaker: "Gwen",

      text: "And keep speaking.",
    },
  ],
  techniques: [
    {
      speaker: "Gwen",

      text: "The real solution is: think in English. Even for the small stuff.",
    },
    {
      speaker: "Leo",

      text: "You don’t need big sentences like “Global warming is a serious issue.”",
    },
    {
      speaker: "Gwen",

      text: "Yup. Just start with what’s around you.",
    },
    {
      speaker: "Gwen",

      text: "Like, look around now.",
    },
    {
      speaker: "Gwen",

      text: "What do you see, Leo?",
    },
    {
      speaker: "Leo",

      text: "I see a cup of coffee, a messy desk, and my co-host judging me silently.",
    },
    {
      speaker: "Gwen",

      text: "Accurate.",
    },
    {
      speaker: "Leo",

      text: "Say what you’re doing: “I’m walking to class.” “I’m eating lunch.” “I feel tired.”",
    },
    {
      speaker: "Gwen",

      text: "And when that becomes easy, move on to longer thoughts.",
    },
    {
      speaker: "Gwen",

      text: "Like what you’re planning today, or how your morning went.",
    },
    {
      speaker: "Leo",

      text: "I do this in the shower.",
    },
    {
      speaker: "Leo",

      text: "Sometimes I sound like a weirdo… but hey, my brain’s learning.",
    },
    {
      speaker: "Gwen",

      text: "The key is creating your English world.",
    },
    {
      speaker: "Gwen",

      text: "That means your phone? Switch it to English.",
    },
    {
      speaker: "Gwen",

      text: "Your playlists? Add English songs.",
    },
    {
      speaker: "Gwen",

      text: "Your TikTok feed? English creators.",
    },
    {
      speaker: "Leo",

      text: "So it’s all about immersion.",
    },
    {
      speaker: "Leo",

      text: "When your brain hears and sees English all the time, it starts thinking in it naturally.",
    },
    {
      speaker: "Gwen",

      text: "Our next tip is called “shadowing.”",
    },
    {
      speaker: "Leo",

      text: "Not like… hiding in the dark behind someone. That’s creepy.",
    },
    {
      speaker: "Gwen",

      text: "No, Leo.",
    },
    {
      speaker: "Gwen",

      text: "It means listening to someone speak—and repeating what they say, exactly how they say it.",
    },
    {
      speaker: "Leo",

      text: "Like being their echo. But cooler.",
    },
    {
      speaker: "Gwen",

      text: "The goal is to copy their rhythm, pronunciation, and tone.",
    },
    {
      speaker: "Leo",

      text: "Basically, you’re stealing their voice—but legally.",
    },
    {
      speaker: "Gwen",

      text: "Let’s try it right now.",
    },
    {
      speaker: "Gwen",

      text: "Repeat after me: “I’d like a coffee, please.”",
    },
    {
      speaker: "Leo",

      text: "One more time: “I’d like a coffee, please.”",
    },
    {
      speaker: "Leo",

      text: "Hey listeners, don't forget to do it with us!",
    },
    {
      speaker: "Leo",

      text: "Easy, right?",
    },
    {
      speaker: "Leo",

      text: "It’s like karaoke for your mouth.",
    },
    {
      speaker: "Gwen",

      text: "Then try linking them together. Like:",
    },
    {
      speaker: "Gwen",

      text: "“I’d like a coffee, please. No sugar. Thanks a lot.”",
    },
    {
      speaker: "Leo",

      text: "Right!",
    },
    {
      speaker: "Gwen",

      text: "You don’t need a textbook—just find a podcast, a YouTube video, or your favorite movie scene.",
    },
    {
      speaker: "Leo",

      text: "I used to shadow scenes from Friends.",
    },
    {
      speaker: "Leo",

      text: "So for a while, I spoke English… like Chandler Bing.",
    },
    {
      speaker: "Gwen",

      text: "Smart move, Leo.",
    },
    {
      speaker: "Gwen",

      text: "You’re not just listening, you’re training your muscles to move like a native speaker.",
    },
    {
      speaker: "Gwen",

      text: "That means better pronunciation, faster reaction, and smoother speaking.",
    },
    {
      speaker: "Leo",

      text: "And no need to memorize scripts.",
    },
    {
      speaker: "Leo",

      text: "You just pick one line, pause, repeat, mimic the voice, and boom—instant practice.",
    },
    {
      speaker: "Gwen",

      text: "Couldn't agree more.",
    },
    {
      speaker: "Gwen",

      text: "Research from the University of Tokyo shows that shadowing helps improve speaking fluency and listening accuracy at the same time.",
    },
    {
      speaker: "Leo",

      text: "Double win.",
    },
    {
      speaker: "Leo",

      text: "Alright, what's next?",
    },
    {
      speaker: "Gwen",

      text: "Okay, tip number three might feel weird at first—but it really works.",
    },
    {
      speaker: "Leo",

      text: "Record. Your. Voice.",
    },
    {
      speaker: "Gwen",

      text: "Yup. Take out your phone. Open the voice recorder. And just talk.",
    },
    {
      speaker: "Leo",

      text: "You can start super simple. Say what you did today.",
    },
    {
      speaker: "Leo",

      text: "Like: “I woke up late. I made noodles. I watched cat videos. Again.”",
    },
    {
      speaker: "Gwen",

      text: "Then press play. Listen to yourself.",
    },
    {
      speaker: "Leo",

      text: "Warning: The first time you hear your voice… you might scream.",
    },
    {
      speaker: "Gwen",

      text: "Everyone does. It’s totally normal.",
    },
    {
      speaker: "Leo",

      text: "I sounded like a confused robot the first time I tried.",
    },
    {
      speaker: "Leo",

      text: "I was like, “Do I really talk like that?”",
    },
    {
      speaker: "Gwen",

      text: "But here’s the magic—you start to notice things.",
    },
    {
      speaker: "Leo",

      text: "Like words you repeat too much.",
    },
    {
      speaker: "Gwen",

      text: "Or where you pause. Or if your “th” sounds more like “d.”",
    },
    {
      speaker: "Leo",

      text: "And you’ll catch tiny grammar mistakes too.",
    },
  ],
};

export const topicTitles: TopicTitles = {
  intro: "Introduction & Welcome",
  problem: "The Core Problem",
  barriers: "Speaking Barriers",
  techniques: "Practical Techniques",
  mindset: "Mindset Transformation",
  vocabulary: "Key Vocabulary",
};

export const topicDescriptions: TopicDescriptions = {
  intro: "Opening remarks and podcast introduction",
  problem: "Understanding vs speaking English difficulty",
  barriers: "Common obstacles in English speaking",
  techniques: "Five practical tips for improving speaking",
  mindset: "Changing mental approach to speaking",
  vocabulary: "Important phrases and expressions explained",
};

export const podcastData: PodcastData = {
  topics: podcastTopics,
  titles: topicTitles,
  descriptions: topicDescriptions,
  metadata: {
    totalEntries: 255,
    totalTopics: 6,
    speakers: ["Leo", "Gwen"],
    generatedAt: "2025-06-29T09:45:33.337Z",
  },
};

// Utility functions with TypeScript support

/**
 * Get all entries for a specific topic
 */
export function getTopicEntries(topic: TopicKey): PodcastEntry[] {
  return podcastTopics[topic] || [];
}

/**
 * Get entries by speaker across all topics
 */
export function getEntriesBySpeaker(speaker: "Leo" | "Gwen"): PodcastEntry[] {
  return Object.values(podcastTopics)
    .flat()
    .filter((entry) => entry.speaker === speaker);
}

/**
 * Search for entries containing specific text
 */
export function searchEntries(
  searchText: string
): Array<PodcastEntry & { topic: TopicKey }> {
  const results: Array<PodcastEntry & { topic: TopicKey }> = [];

  Object.entries(podcastTopics).forEach(([topic, entries]) => {
    entries.forEach((entry) => {
      if (entry.text.toLowerCase().includes(searchText.toLowerCase())) {
        results.push({ ...entry, topic: topic as TopicKey });
      }
    });
  });

  return results;
}
