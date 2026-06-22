"""
VICKI VALE — TikTok Slideshow Content Generator
Generates batches of ready-to-post TikTok slide content.
Run: python tiktok-generator.py
Output: tiktok-content-[date].txt in same folder
"""

import json
import random
from datetime import datetime

# ─── BIRTH MONTH ANIMALS ─────────────────────────────────────────────────────

BIRTH_MONTH_ANIMALS = [
    {"month": "January",   "animal": "Wolf",      "symbol": "🐺", "meanings": ["loyalty", "intuition", "freedom", "leadership"]},
    {"month": "February",  "animal": "Owl",       "symbol": "🦉", "meanings": ["wisdom", "mystery", "transition", "vision"]},
    {"month": "March",     "animal": "Ram",        "symbol": "🐏", "meanings": ["courage", "determination", "new beginnings", "boldness"]},
    {"month": "April",     "animal": "Bull",       "symbol": "🐂", "meanings": ["strength", "patience", "reliability", "abundance"]},
    {"month": "May",       "animal": "Fox",        "symbol": "🦊", "meanings": ["cleverness", "adaptability", "curiosity", "magic"]},
    {"month": "June",      "animal": "Horse",      "symbol": "🐎", "meanings": ["freedom", "passion", "travel", "wildness"]},
    {"month": "July",      "animal": "Crab",       "symbol": "🦀", "meanings": ["protection", "intuition", "home", "loyalty"]},
    {"month": "August",    "animal": "Lion",       "symbol": "🦁", "meanings": ["courage", "confidence", "nobility", "heart"]},
    {"month": "September", "animal": "Bear",       "symbol": "🐻", "meanings": ["strength", "introspection", "healing", "grounding"]},
    {"month": "October",   "animal": "Scorpion",   "symbol": "🦂", "meanings": ["transformation", "power", "mystery", "rebirth"]},
    {"month": "November",  "animal": "Eagle",      "symbol": "🦅", "meanings": ["vision", "freedom", "higher perspective", "truth"]},
    {"month": "December",  "animal": "Deer",       "symbol": "🦌", "meanings": ["grace", "gentleness", "new beginnings", "wisdom"]},
]

# ─── BIRTH MONTH FLOWERS ─────────────────────────────────────────────────────

BIRTH_MONTH_FLOWERS = [
    {"month": "January",   "flower": "Carnation",     "meaning": "love, distinction, fascination"},
    {"month": "February",  "flower": "Violet",         "meaning": "faithfulness, wisdom, hope"},
    {"month": "March",     "flower": "Daffodil",       "meaning": "new beginnings, joy, rebirth"},
    {"month": "April",     "flower": "Daisy",          "meaning": "purity, innocence, true love"},
    {"month": "May",       "flower": "Lily of the Valley", "meaning": "happiness, humility, sweetness"},
    {"month": "June",      "flower": "Rose",           "meaning": "love, passion, beauty, courage"},
    {"month": "July",      "flower": "Larkspur",       "meaning": "lightness, levity, beautiful spirit"},
    {"month": "August",    "flower": "Gladiolus",      "meaning": "strength, integrity, never give up"},
    {"month": "September", "flower": "Aster",          "meaning": "wisdom, faith, love, patience"},
    {"month": "October",   "flower": "Marigold",       "meaning": "creativity, passion, grace, power"},
    {"month": "November",  "flower": "Chrysanthemum",  "meaning": "joy, loyalty, longevity, friendship"},
    {"month": "December",  "flower": "Holly",          "meaning": "hope, protection, eternal life"},
]

# ─── TATTOO IDEAS ────────────────────────────────────────────────────────────

TATTOO_CATEGORIES = {
    "twins": [
        ("Matching sun and moon", "One twin is the sun — bold, warm, present. The other is the moon — calm, deep, constant. Together you light every room and every night."),
        ("Two halves of one fingerprint", "No two fingerprints are identical — but yours? They started in the same place. Perfect for twins who know they're different but came from the same source."),
        ("Yin and yang split", "The classic symbol, split between two people. One holds the light in the dark. One holds the dark in the light. That's twin energy."),
        ("Roman numeral birth date", "The date that changed everything — split down the middle. You each carry half. Together it's complete."),
        ("Womb to tomb", "Simple. Script. True. No explanation needed."),
    ],
    "husband_wife": [
        ("Coordinates of your first date", "Latitude and longitude of the exact spot. The place where the story started. Ink it."),
        ("Wedding date in Roman numerals", "Not just a date. The date. The one that made it official. Roman numerals make it timeless."),
        ("Lock and key", "One of you is the lock. One is the key. You don't work without each other — and that's not a weakness. That's the whole point."),
        ("Sun and moon", "He rises when she sleeps. She glows when he's gone. But when they're in the same sky — that's magic."),
        ("His handwriting / her handwriting", "Her handwriting on his arm. His on hers. There is nothing more intimate than carrying someone's own hand."),
    ],
    "best_friends": [
        ("She's my person / I'm her person", "Grey's Anatomy started it. Life made it real. Two pieces of one truth."),
        ("Matching arrows", "An arrow only moves forward when pulled back. You two keep pulling each other forward."),
        ("Broken heart halves", "You don't need to be lovers to be someone's missing piece. Sometimes it's just your person."),
        ("Pinky swear", "The original promise. Tiny. Permanent. Unbreakable — just like you two."),
        ("Sun with sunflower", "One is the light. One always turns toward the light. Every friendship has these two."),
    ],
    "new_chapter": [
        ("Phoenix rising", "You burned. You broke. You are literally rising from your own ashes right now. Wear that."),
        ("Open book with turning page", "Every chapter ends. Every page turns. This one is yours to write. Make it different."),
        ("Compass rose", "You don't always know where you're going. But now you know how to navigate. True north. Always."),
        ("Butterfly transformation", "The caterpillar doesn't know what it's becoming. Neither did you. Look at you now."),
        ("Mountain with sunrise", "The hard climb behind you. The view ahead. A new peak. A new day. That's where you are."),
    ],
}

# ─── BIBLE VERSES ────────────────────────────────────────────────────────────

BIBLE_VERSES = [
    {
        "verse": "Jeremiah 29:11",
        "text": "For I know the plans I have for you, declares the Lord — plans to prosper you and not to harm you, plans to give you hope and a future.",
        "modern": "You're grinding and you don't see results yet. The path feels unclear. The timeline doesn't make sense. This is your reminder: the plan was already designed before you started worrying about it. You don't have to figure it all out today. Just keep building.",
        "who_needs_this": "Entrepreneurs. People starting over. Anyone who feels behind.",
        "hashtags": "#faith #bibleverseoftheday #jeremiah2911 #christianentrepreneur #godsplan",
    },
    {
        "verse": "Philippians 4:13",
        "text": "I can do all things through Christ who strengthens me.",
        "modern": "Before your pitch. Before your hard conversation. Before you open that door and walk into a room full of people you need to impress. Say it out loud. Not because it makes you invincible — because it reminds you that the strength isn't coming from you alone.",
        "who_needs_this": "Business owners. Athletes. Anyone walking into something hard today.",
        "hashtags": "#philippians413 #faith #christianmotivation #Godisable #dailyverse",
    },
    {
        "verse": "Proverbs 3:5-6",
        "text": "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight.",
        "modern": "The plan fell apart. The deal fell through. The person you trusted let you down. Your own logic is failing you. This is the verse for the moment you have to let go of control. The path gets straight when you stop white-knuckling the wheel.",
        "who_needs_this": "Anyone in transition. Leaders under pressure. People letting go of something.",
        "hashtags": "#proverbs #trustgod #faithoverfear #christianleader #bibleversetoday",
    },
    {
        "verse": "Isaiah 40:31",
        "text": "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
        "modern": "You're tired. Not lazy — tired. There's a difference. You've been running hard and the finish line keeps moving. This is your permission to slow down, refuel, and let something bigger than you carry you for a minute. Eagles don't flap constantly. They catch the wind.",
        "who_needs_this": "Burned out leaders. Working parents. Anyone who hasn't slept enough in years.",
        "hashtags": "#isaiah4031 #renewstrength #faith #burnout #Godsgot this",
    },
    {
        "verse": "Romans 8:28",
        "text": "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
        "modern": "That thing that went wrong? It wasn't wasted. The job you didn't get. The relationship that ended. The business that failed. God is a master recycler. Nothing you've been through is going to waste — it's going into something you can't see yet.",
        "who_needs_this": "People in pain. Entrepreneurs after a setback. Anyone who feels like their past defines them.",
        "hashtags": "#romans828 #allthings #Godhasaplan #faith #christianentrepreneur",
    },
]

# ─── LEADERSHIP + SCRIPTURE ──────────────────────────────────────────────────

LEADERSHIP_VERSES = [
    {
        "principle": "Servant leadership",
        "verse": "Mark 10:45",
        "text": "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
        "application": "The most powerful leaders in history — in business, in family, in faith — led from the bottom up. They cleared the path for others. They carried the weight so their team didn't have to. The title doesn't make you a leader. The service does.",
        "hashtags": "#servantleadership #leadership #mark1045 #faithandwork #leadershipdevelopment",
    },
    {
        "principle": "Integrity over image",
        "verse": "Proverbs 11:3",
        "text": "The integrity of the upright guides them, but the unfaithful are destroyed by their duplicity.",
        "application": "Your character is your actual brand. You can fake results for a season. You can fake your numbers on a spreadsheet. You cannot fake integrity forever. The business that's built on who you actually are — in the dark, when no one's watching — that's the one that lasts.",
        "hashtags": "#integrity #proverbs113 #leadership #charactermatters #faithinbusiness",
    },
    {
        "principle": "Write the vision",
        "verse": "Habakkuk 2:2",
        "text": "Write down the revelation and make it plain on tablets so that a herald may run with it.",
        "application": "God told a prophet: write it down so clearly that someone running past can read it. That's your business plan. That's your morning routine. That's your 5-year goal. If you can't write it plain enough for someone else to run with, you don't know it well enough yet. Write the vision.",
        "hashtags": "#vision #habakkuk22 #businessplanning #faithentrepreneur #writedownyourgoals",
    },
]


# ─── GENERATORS ──────────────────────────────────────────────────────────────

def gen_birth_month_animal(entry):
    m = entry["month"]
    a = entry["animal"]
    s = entry["symbol"]
    meanings = entry["meanings"]
    return {
        "topic": f"Birth month animal — {m}",
        "slides": [
            f"If you were born in {m}...",
            f"Your birth month animal is\nthe {a} {s}",
            f"The {a} represents:\n" + "\n".join(f"• {x.capitalize()}" for x in meanings),
            f"People born in {m} carry the spirit of the {a}:\nthey {meanings[0]} deeply, move with {meanings[1]},\nand protect those they love.",
            f"Born in {m}?\nYou're a {a}.\nOwn it. {s}",
        ],
        "caption": f"Born in {m}? Your spirit animal is the {a} {s} — and here's what that actually means. {' '.join('#'+m.lower() for m in [m, a.lower(), 'birthmonthanimal', 'spiritanimal', 'birthmonth', 'astrology', 'tattoo', 'tattooinspo'])}",
    }


def gen_tattoo_set(category, ideas):
    labels = {
        "twins": "Tattoo ideas for twins",
        "husband_wife": "Tattoo ideas for married couples",
        "best_friends": "Tattoo ideas for best friends",
        "new_chapter": "Tattoo ideas for a new chapter",
    }
    label = labels.get(category, f"Tattoo ideas — {category}")
    idea = random.choice(ideas)
    name, story = idea
    return {
        "topic": label,
        "slides": [
            f"{label} 🖤",
            f"Idea #{random.randint(1,5)}: {name}",
            story[:120] + ("..." if len(story) > 120 else ""),
            story[120:240] + ("..." if len(story) > 240 else "") if len(story) > 120 else "The meaning runs deeper than the ink.",
            f"Would you get this?\nSave this for your person. 🖤",
        ],
        "caption": f"{label} that actually mean something. Save this for when you're ready. 🖤 #tattoo #tattooinspo #tattoodesign #tattooart #{category.replace('_','')} #matchingtattoos #tattoocouple #tattoobestfriends",
    }


def gen_bible_verse(entry):
    return {
        "topic": f"Bible verse — {entry['verse']}",
        "slides": [
            f"This verse hits different\nwhen you're in the middle of it.",
            f"{entry['verse']}\n\n\"{entry['text'][:100]}...\"",
            entry["modern"][:150],
            entry["modern"][150:] if len(entry["modern"]) > 150 else "Let that land.",
            f"Who needs this today?\nTag them. {entry['hashtags'].split()[0]}",
        ],
        "caption": f"{entry['verse']} — {entry['modern'][:120]}... {entry['hashtags']}",
    }


def gen_leadership(entry):
    return {
        "topic": f"Leadership + faith — {entry['principle']}",
        "slides": [
            f"Leadership truth that\nmost people skip over.",
            f"{entry['principle'].upper()}",
            f"{entry['verse']}:\n\"{entry['text'][:120]}\"",
            entry["application"][:160],
            f"Build different.\nLead different.\n{entry['hashtags'].split()[0]}",
        ],
        "caption": f"{entry['principle'].capitalize()} — {entry['application'][:120]}... {entry['hashtags']}",
    }


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def generate_batch(count=10):
    batch = []

    # All 12 birth month animals
    for entry in BIRTH_MONTH_ANIMALS:
        batch.append(gen_birth_month_animal(entry))

    # All tattoo categories
    for cat, ideas in TATTOO_CATEGORIES.items():
        batch.append(gen_tattoo_set(cat, ideas))

    # All bible verses
    for entry in BIBLE_VERSES:
        batch.append(gen_bible_verse(entry))

    # All leadership entries
    for entry in LEADERSHIP_VERSES:
        batch.append(gen_leadership(entry))

    random.shuffle(batch)
    return batch


def format_output(batch):
    lines = []
    today = datetime.now().strftime("%B %d, %Y")
    lines.append(f"TIKTOK SLIDESHOW CONTENT BATCH — {today}")
    lines.append(f"Total sets: {len(batch)}")
    lines.append("=" * 60)

    for i, item in enumerate(batch, 1):
        lines.append(f"\n{'─' * 60}")
        lines.append(f"SET {i}: {item['topic'].upper()}")
        lines.append(f"{'─' * 60}")
        for j, slide in enumerate(item["slides"], 1):
            lines.append(f"\n[SLIDE {j}]")
            lines.append(slide)
        lines.append(f"\n[CAPTION + HASHTAGS]")
        lines.append(item["caption"])

    lines.append(f"\n{'=' * 60}")
    lines.append("END OF BATCH — Vicki Vale / PTorro Holdings")
    return "\n".join(lines)


if __name__ == "__main__":
    import os
    batch = generate_batch()
    output = format_output(batch)

    out_dir = os.path.dirname(os.path.abspath(__file__))
    date_str = datetime.now().strftime("%Y-%m-%d")
    out_path = os.path.join(out_dir, f"tiktok-content-{date_str}.txt")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Generated {len(batch)} content sets → {out_path}")
