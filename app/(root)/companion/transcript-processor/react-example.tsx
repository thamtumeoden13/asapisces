"use client";

import { useState, useMemo } from "react";

import {
  processTranscript,
  createTopicConfig,
  PodcastDataUtils,
  type TopicConfig,
} from "@/scripts/transcript-processor";

// Sample data for demo
const SAMPLE_TRANSCRIPT = `Leo: Hey hey hey! What’s up, everybody? 
Leo: Welcome back to Pod Chill!
Leo: I’m Leo – your favorite joke master.
Gwen: And I’m Gwen. 
Gwen: I’m here to help Leo stay on track so that he doesn’t make too many silly jokes.
Leo: That’s my talent! But today we’re not just here for jokes. 
Leo: We’re talking about something serious. Kind of.
Gwen: A problem many English learners face: You can understand English. You watch movies, you understand songs, maybe you even understand us.
Leo: But when it’s your turn to speak?
Gwen: It’s like... blank.
Gwen: You freeze. 
Gwen: Or you say “uh... uh...” like a broken robot.
Leo: So why does this happen?
Gwen: Listening is like watching football. 
Gwen: You understand the game. You know how to pass, shoot, score.
Gwen: But speaking English? 
Gwen: That’s like getting on the field and playing the game yourself.
Leo: That's right.
Leo: Then suddenly, the ball is moving too fast. 
Leo: Your legs won’t move. You fall flat on your face.
Gwen: Today, we will discover the reasons behind that problem.
Leo: Also, Gwen and I will help you solve the problem with five useful tips.
Leo: The last tip is the most important one, so stay with us until the end. Deal?
Gwen: Let’s go!

Leo: Let’s begin with this: Why can you understand English, but not speak it?
Gwen: Well, listening is a passive skill. 
Gwen: Your brain just receives information.
Gwen: You can listen while walking, eating, or even doing your laundry.
Leo: Right. You don’t need to do anything with your mouth, or your confidence.
Gwen: But when it comes to speaking, it's another story.
Gwen: You’ve got to think fast, remember words, pronounce them correctly, keep up with the conversation...
Leo: …and somehow not panic while doing it all at once.
Gwen: Imagine this—you watch cooking shows all the time. 
Gwen: You know what a risotto looks like, you’ve seen a chef flip a steak perfectly,
and you know exactly when to add the garlic.
Gwen: But then someone hands you a pan and says, “Okay, now you cook.”
Gwen: And suddenly, you’re holding the garlic like, “Wait, is this even food?”
Leo: I see where you’re going. 
Leo: Listening to English is like watching someone cook. 
Leo: But speaking English… that’s stepping into the kitchen yourself.
Gwen: Exactly! 
Gwen: You’ve got to train your “speaking muscles.”
Gwen: You just sit back, enjoy the flavors, maybe nod your head and say “Hmm, nice accent.”
Gwen: But speaking? 
Gwen: That’s chopping, mixing, and trying not to burn the house down.
Leo: It takes effort. It takes practice. You actually have to do something.
Gwen: And that’s what many learners forget. 
Leo: Yup. Just because you understand doesn’t mean you’re ready to speak.
Gwen: When it comes to speaking, you have to think of words, 
remember grammar, pronounce things, and do it all quickly.
Gwen: People often try to translate in their head before speaking.
Leo: Yes! Like they hear something, think in their native language, 
and then try to turn it into English word by word.
Gwen: So here’s the thing: translating slows you down. 
Gwen: You speak slower, less naturally, and you feel more unsure.
Leo: And when you feel unsure, guess what kicks in?
Gwen: Fear. 
Gwen: Fear of making mistakes, sounding weird, or being judged.
Leo: Totally. Or someone giving you that look like, “What did you just say?”
Gwen: Yeah. Even when people know the words, they freeze.
Gwen: Like their brain just says “Nope, not today.”
Leo: It’s like… you have the sentence in your head, but your mouth refuses to help.
Gwen: The more you stay quiet, the harder it gets to say anything at all.
Leo: It's like being stuck in a loop. 
Leo: But don’t worry—we’re not gonna leave you hanging. 
Leo: We’ve got five things that actually help.
Gwen: Super simple stuff. 
Gwen: Stuff we’ve tried ourselves, and that really works.
Leo: Trust us, it’s worth staying for.
Gwen: So, the first tip is simple but powerful: stop translating in your head.
Leo: Yeah, seriously. 
Leo: If you’re thinking, “Okay, I want to say something in English… let me build it word by word from my own language”.
Leo: That's when you’re already stuck.
Gwen: That's like ordering fast food but needing to read the whole menu with Google Translate. 
Leo: By the time you decide, your fries are cold.
Gwen: The real solution is: think in English. Even for the small stuff.
Leo: You don’t need big sentences like “Global warming is a serious issue.” 
Gwen: Yup. Just start with what’s around you.
Gwen: Like, look around now. 
Gwen: What do you see, Leo?
Leo: I see a cup of coffee, a messy desk, and my co-host judging me silently.
Gwen: Accurate.
Leo: Say what you’re doing: “I’m walking to class.” “I’m eating lunch.” “I feel tired.”
Gwen: And when that becomes easy, move on to longer thoughts. 
Gwen: Like what you’re planning today, or how your morning went.
Leo: I do this in the shower. 
Leo: Sometimes I sound like a weirdo… but hey, my brain’s learning.
Gwen: The key is creating your English world.
Gwen: That means your phone? Switch it to English.
Gwen: Your playlists? Add English songs.
Gwen: Your TikTok feed? English creators.
Leo: So it’s all about immersion. 
Leo: When your brain hears and sees English all the time, it starts thinking in it naturally.
Gwen: It’s backed by science too.
Gwen: A study from the University of Essex found that students who stopped translating and thought directly in English improved fluency faster than those who didn’t.
Gwen: They felt more confident when speaking, even if their grammar wasn’t perfect.
Leo: Confidence really beats perfect grammar any day.
Leo: That’s how you build fluency. 
Leo: In your head. Before your mouth.
Gwen: Our next tip is called “shadowing.”
Leo: Not like… hiding in the dark behind someone. That’s creepy.
Gwen: No, Leo. 
Gwen: It means listening to someone speak—and repeating what they say, exactly how they say it.
Leo: Like being their echo. But cooler.
Gwen: The goal is to copy their rhythm, pronunciation, and tone.
Leo: Basically, you’re stealing their voice—but legally.
Gwen: Let’s try it right now.
Gwen: Repeat after me: “I’d like a coffee, please.”
Leo: One more time: “I’d like a coffee, please.”
Leo: Hey listeners, don't forget to do it with us!
Leo: Easy, right? 
Leo: It’s like karaoke for your mouth.
Gwen: Then try linking them together. Like:
Gwen: “I’d like a coffee, please. No sugar. Thanks a lot.”
Leo: Right!
Gwen: You don’t need a textbook—just find a podcast, a YouTube video, or your favorite movie scene.
Leo: I used to shadow scenes from Friends.
Leo: So for a while, I spoke English… like Chandler Bing.
Gwen: Smart move, Leo.
Gwen: You’re not just listening, you’re training your muscles to move like a native speaker.
Gwen: That means better pronunciation, faster reaction, and smoother speaking.
Leo: And no need to memorize scripts. 
Leo: You just pick one line, pause, repeat, mimic the voice, and boom—instant practice.
Gwen: Couldn't agree more.
Gwen: Research from the University of Tokyo shows that shadowing helps improve speaking fluency and listening accuracy at the same time.
Leo: Double win.
Leo: Alright, what's next?
Gwen: Okay, tip number three might feel weird at first—but it really works.
Leo: Record. Your. Voice.
Gwen: Yup. Take out your phone. Open the voice recorder. And just talk.
Leo: You can start super simple. Say what you did today.
Leo: Like: “I woke up late. I made noodles. I watched cat videos. Again.”
Gwen: Then press play. Listen to yourself.
Leo: Warning: The first time you hear your voice… you might scream.
Gwen: Everyone does. It’s totally normal.
Leo: I sounded like a confused robot the first time I tried.
Leo: I was like, “Do I really talk like that?”
Gwen: But here’s the magic—you start to notice things.
Leo: Like words you repeat too much.
Gwen: Or where you pause. Or if your “th” sounds more like “d.”
Leo: And you’ll catch tiny grammar mistakes too.
Gwen: Research from Cambridge University shows that self-recording boosts both fluency and confidence—because you become your own coach.
Leo: You don’t need fancy equipment. Just your phone and your voice.
Gwen: Try this: Every night, record a one-minute diary in English.
Leo: “Today I felt tired. I met my friend. We ate noodles again. I need new hobbies.”
Gwen: The next day, listen to it. Then record again.
Leo: It’s like voice journaling—English edition.
Gwen: After a week, you’ll hear a difference. After a month, you’ll feel more confident.
Leo: And one day, you’ll hear yourself and go: “Whoa. That actually sounds… kinda good.”
Gwen: You don’t need perfect grammar. Just a brave voice.
Leo: So start recording. You’re not just practicing.
Gwen: You’re building proof that you’re improving.
Gwen: Let’s move to tip number four: practice useful phrases you hear all the time.
Leo: Yeah! You don’t need to invent new sentences every time you speak.
Leo: Just grab the classics! 
Leo: Like, “I’m good, thanks.”
Gwen: Or “What do you do?”
Leo: My favorite: “Can I get a coffee, please?”
Gwen: These are like muscle memory. The more you say them, the faster they come out.
Leo: You don’t pause to think, “Hmm, how do I express this idea of… requesting caffeine politely?”
Gwen: No! You just say it. Boom.
Leo: It’s kind of like driving. 
Leo: At first, you check every mirror 10 times and sweat when changing lanes.
Leo: But once you get the hang of it, your hands just know what to do.
Gwen: Same with language. These daily phrases become automatic.
Leo: And they’re super useful in real life. 
Leo: Like when someone asks, “What’s your job?”
Leo: You should be able to shoot back: “I work as a designer.”
Gwen: Or “I’m a student.” Or “I work in marketing.”
Leo: Want to sound natural? Practice chunks like:
Leo: “I’m not sure.” “That’s interesting!” “I don’t think so.”
Gwen: These are called “sentence starters” or “speech chunks.”
Leo: Use them like building blocks.
Leo: You don’t need perfect grammar if your phrase is natural.
Leo: Don’t wait to speak full paragraphs.
Leo: Start with fast, friendly phrases.
Gwen: Say them out loud. Every day. In the mirror.
Leo: Or to your dog.
Gwen: Or to Leo. He’ll answer back.
Leo: Always. Especially if you offer snacks.
Gwen: The goal isn’t to sound smart. It’s to sound real.
Leo: Alright, let's introduce the most important tip, Gwen.
Leo: I believe our listeners have waited until the end to discover this tip.
Gwen: Come right there.
Gwen: You can try every technique we mentioned…
Gwen: But if your mindset is stuck in fear—you’ll stay stuck.
Leo: Think about it. 
Leo: Everyone you admire for speaking fluent English…
Leo: …has probably made more than 1,000 embarrassing mistakes.
Gwen: Seriously. Every smooth sentence came after many awkward ones.
Leo: I once said “I am chicken” instead of “I’m scared” on a date.
Gwen: And you still got a second date?
Leo: Nope. But I got a good story.
Gwen: See? Mistakes make you better.
Leo: And funnier.
Gwen: The more you practice, the less scary it gets.
Leo: And that fear? It gets quieter. Smaller.
Leo: Instead of saying, “I’m learning English”…
Leo: Say, “I’m a person who communicates in English.”
Gwen: Good examples, Leo.
Gwen: When you believe that, your brain starts to support it.
Leo: You’ll act like that person. You’ll speak more.
Gwen: And here’s a line you can repeat to yourself, every day:
Gwen: “It’s okay to speak badly. That’s how I learn.”
Leo: Say it one more time. With us.
Gwen: Good job.
Gwen: So stop waiting to feel “ready.”
Leo: Start being the person who speaks—right now.
Gwen: We believe in you.
Leo: We are you.
Gwen: And your English voice?
Leo: It’s already inside. Let’s set it free.

Gwen: Before wrapping up, we will learn some phrases.
Leo: Let me do it first.
Gwen: Alright.
Leo: First up, we have “fall flat on your face.”It means to completely fail in an embarrassing way.
Leo: Example: I tried to impress my English teacher but fell flat on my face when I forgot all my words.
Gwen: Ouch, I’ve been there. So awkward!
Gwen: Next is “stay on track.” It means to keep going in the right direction, especially when learning something.
Gwen: Example: Even if you make mistakes, just stay on track and keep practicing.
Leo: That’s great advice. Don’t give up halfway!
Leo: Here’s “backed by science.” It means something is supported by research.
Leo: Example: Thinking in English is backed by science. It really works.
Gwen: Ooh, that sounds official!
Gwen: Now try “get the hang of it.” It means to start understanding how to do something well.
Gwen: Example: After a few weeks, I got the hang of conversations.
Leo: Practice really does pay off.
Leo: Then we have “muscle memory.” It means your body remembers how to do something after repeating.
Leo: Example: I repeated them so much, they became muscle memory.
Gwen: Like riding a bike!
Gwen: Now, let’s put your knowledge to the test with a few questions!
Leo: Share your answers in the comments below!
Gwen: The first question.
Gwen: Why is translating in our head a problem?
Leo: Because it makes us speak slowly, sound less natural, and often feel less confident.
Gwen: Well done!
Leo: Let’s do one more.
Leo: What does self-recording help learners recognize?
Gwen: Their pronunciation habits, common mistakes, and areas for improvement.
Leo: Bingo!

Leo: So… we started this episode with a big question: Why can we understand English, but can’t speak it?
Gwen: And now, maybe it doesn’t feel like such a mystery anymore. It’s not about intelligence.
Gwen: Listening is passive — but speaking? 
Gwen: That takes practice, effort, and confidence.
Leo: We gave you 5 tips to solve the problem.
Leo: And the most import thing is changing your mindset.
Gwen: Don’t wait to feel ready. Just speak.
Gwen: Even with nervous hands.
Leo: Every word you try is one step closer.
Leo: Every sentence you try is proof that your English voice is already there.
Gwen: So don’t just sit on the bench. Step into the game.
Gwen: We’ll be cheering for you.
Leo: Thanks for spending this time with us.
Leo: Until next time, keep learning…
Gwen: And keep speaking.
`;

// Exact format as your original
const SAMPLE_TOPIC_CONFIG: TopicConfig[] = [
  {
    key: "intro",
    keyword: "Let’s go!",
    title: "Introduction & Welcome",
  },
  {
    key: "problem",
    keyword:
      "Let’s begin with this: Why can you understand English, but not speak it?",
    title: "The Core Problem",
  },
  {
    key: "barriers",
    keyword: "It's like being stuck in a loop.",
    title: "Speaking Barriers",
  },
  {
    key: "techniques",
    keyword: "You don’t need perfect grammar. Just a brave voice.",
    title: "Practical Techniques",
  },
  {
    key: "mindset",
    keyword: "'It’s already inside. Let’s set it free.",
    title: "Mindset Transformation",
  },
  {
    key: "vocabulary",
    keyword: "Bingo!",
    title: "Key Vocabulary",
  },
];
export default function TranscriptProcessor() {
  const [rawTranscript, setRawTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all");

  // Process transcript
  const processedData = useMemo(() => {
    if (!rawTranscript.trim()) return null;

    return processTranscript(rawTranscript, SAMPLE_TOPIC_CONFIG, {
      defaultTopic: "intro",
      minTextLength: 3,
      enableScoring: true,
    });
  }, [rawTranscript]);

  // Create utils instance
  const utils = useMemo(() => {
    if (!processedData) return null;
    return new PodcastDataUtils(
      processedData.podcastTopics,
      processedData.topicTitles
    );
  }, [processedData]);

  // Get filtered results
  const filteredResults = useMemo(() => {
    if (!utils) return [];

    let results = Object.entries(processedData!.podcastTopics).flatMap(
      ([topic, entries]) => entries.map((entry) => ({ ...entry, topic }))
    );

    if (searchTerm) {
      results = utils.searchEntries(searchTerm);
    }

    if (selectedSpeaker !== "all") {
      results = results.filter((entry) => entry.speaker === selectedSpeaker);
    }

    return results;
  }, [utils, searchTerm, selectedSpeaker, processedData]);

  const handleDownload = (format: "json" | "csv" | "markdown") => {
    if (!utils) return;
    utils.downloadData(`podcast-transcript`, format);
  };

  if (!processedData || !utils) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Transcript Processor</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Raw Transcript:
          </label>
          <textarea
            value={rawTranscript}
            onChange={(e) => setRawTranscript(e.target.value)}
            className="w-full h-32 p-3 border rounded-lg"
            placeholder="Paste your transcript here..."
          />
        </div>
      </div>
    );
  }

  const stats = utils.getStatistics();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Podcast Transcript Processor</h1>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Raw Transcript:
        </label>
        <textarea
          value={rawTranscript}
          onChange={(e) => setRawTranscript(e.target.value)}
          className="w-full h-32 p-3 border rounded-lg"
          placeholder="Paste your transcript here..."
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total Entries</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalEntries}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Topics</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalTopics}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Processing Time</h3>
          <p className="text-2xl font-bold text-purple-600">
            {processedData.metadata.processingTime}ms
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800">Speakers</h3>
          <p className="text-2xl font-bold text-orange-600">
            {processedData.metadata.speakers.length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search in transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <select
          value={selectedSpeaker}
          onChange={(e) => setSelectedSpeaker(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Speakers</option>
          {processedData.metadata.speakers.map((speaker) => (
            <option key={speaker} value={speaker}>
              {speaker}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload("json")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Download JSON
          </button>
          <button
            onClick={() => handleDownload("csv")}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Download CSV
          </button>
          <button
            onClick={() => handleDownload("markdown")}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Download MD
          </button>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">Topic Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stats.topicBreakdown).map(([topic, data]) => (
            <div key={topic} className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold">{data.title}</h3>
              <p className="text-sm text-gray-600">{data.count} entries</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-xl font-bold mb-3">
          Transcript Entries ({filteredResults.length})
        </h2>
        <div className="space-y-3">
          {filteredResults.map((entry, index) => (
            <div
              key={index}
              className="bg-white p-4 border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {processedData.topicTitles[entry.topic]}
                </span>
                <span className="font-semibold text-gray-700">
                  {entry.speaker}:
                </span>
              </div>
              <p className="text-gray-800">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
