export interface QuizAnswer {
  text: string;
  correct: boolean;
  explanation: string | null;
}

export interface QuizQuestion {
  timestamp: number;
  type: string;
  form: {
    question: string;
    answers: QuizAnswer[];
  };
}

export interface Interactions {
  interactions: QuizQuestion[];
}

export interface LessonSummary {
  description: string;
  key_phrases: {
    text_content: string;
    text_content_translation: string;
  }[];
  keywords: {
    text_content: string;
  }[];
}

export interface Lesson {
  id: string;
  name: string;
  kind: string;
  order: number;
  level?: 'Zacatecnik' | 'Pokrocily' | 'Frajeris';
  cefr?: string;
  createdAt?: string;
  video_upload_id?: string;
  interactions?: Interactions;
  summary?: LessonSummary;
}

// Complete lessons from DatoCMS metadata - 151 total lessons
// A1-A2: 38 lessons, B1-B2: 79 lessons, C1-C2: 34 lessons
export const lessons: Lesson[] = [
  // ============================================
  // ZAČÁTEČNÍK (A1-A2) - 38 lessons
  // ============================================
  {
    id: "YRvAqbanTaml66kldE2KbQ",
    name: "Základní pozdravy",
    kind: "conversation",
    order: 1,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Každá konverzace začíná pozdravem. Představili jsme si pozdravy vhodné pro formální i neformální situace.",
      key_phrases: [
        { text_content: "Hello, how are you?", text_content_translation: "Dobrý den, jak se máte?" },
        { text_content: "Hi, how are you doing?", text_content_translation: "Ahoj, jak se máš?" },
        { text_content: "Hey, what's up?", text_content_translation: "Čus, jak je?" }
      ],
      keywords: [{ text_content: "hello" }, { text_content: "fine" }, { text_content: "awesome" }]
    }
  },
  {
    id: "NoYpfW5fTzCACLWflAivEQ",
    name: "Sloveso be a povolání",
    kind: "grammar",
    order: 2,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Sloveso být je základním kamenem každého jazyka. Vysvětlili jsme si, jak toto nepravidelné sloveso časovat.",
      key_phrases: [
        { text_content: "You are a dancer.", text_content_translation: "Jsi tanečnice." },
        { text_content: "She is a nurse.", text_content_translation: "Ona je sestřička." },
        { text_content: "He isn't a driver.", text_content_translation: "On není řidič." },
        { text_content: "Is he drunk?", text_content_translation: "Je opilej?" }
      ],
      keywords: [{ text_content: "construction worker" }, { text_content: "dancer" }, { text_content: "nurse" }]
    }
  },
  {
    id: "QFuk1RxtRE6xRt39wKYixw",
    name: "Fráze, otázky a představení se",
    kind: "conversation",
    order: 3,
    level: "Zacatecnik",
    cefr: "A1",
    video_upload_id: "EH3UTNpPTRe29Xzfp6q_Ag",
    interactions: {
      interactions: [
        { timestamp: 31550, type: "single-choice", form: { question: "What is your name? _______.", answers: [{ text: "My name is", correct: true, explanation: null }, { text: "Name is", correct: false, explanation: "Name is je píčovinka, dear friend. My to chceme hezky." }] } },
        { timestamp: 62580, type: "single-choice", form: { question: "How old are you?", answers: [{ text: "I am 24 years old.", correct: true, explanation: null }, { text: "I have 24 years.", correct: false, explanation: "\"Já mám 24 let\" v angličtině říct nemůžeme. Musíme říct, že jsem 24 let starý." }] } },
        { timestamp: 113580, type: "single-choice", form: { question: "What are your hobbies? My hobbies____", answers: [{ text: "are reading and playing chess.", correct: true, explanation: null }, { text: "is reading and swimming.", correct: false, explanation: "\"My hobbies is\" by znamenalo moje koníčky je, musíme říct moje koníčky jsou." }] } },
        { timestamp: 145580, type: "single-choice", form: { question: "Who is your favorite teacher?", answers: [{ text: "My favorite teacher is Kuba.", correct: true, explanation: null }, { text: "Mai favorit teacher is Mrs. Bullshitová.", correct: false, explanation: "Tvůj nejoblíbenější učitel jsem přece já, ne?" }] } }
      ]
    },
    summary: {
      description: "Dneska jsme se podívali na typické seznamovací fráze se slovesem být a připomněli si výslovnost písmene H. Bacha na větu 'Je mi ___ let', ať nezníš jak jantar.",
      key_phrases: [
        { text_content: "What's your name?", text_content_translation: "Jak se jmenuješ?" },
        { text_content: "I am Peter.", text_content_translation: "Jsem Peter." },
        { text_content: "How old are you?", text_content_translation: "Jak jsi starý?" },
        { text_content: "Where are you from?", text_content_translation: "Odkud jsi?" },
        { text_content: "Nice to meet you.", text_content_translation: "Rád tě poznávám." }
      ],
      keywords: [{ text_content: "hobby" }, { text_content: "chess" }, { text_content: "teacher" }]
    }
  },
  {
    id: "fh9iwW-5Qa6Dwxa4-Q5Y1g",
    name: "První sprostá slova",
    kind: "slang",
    order: 4,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Nadávky jsou normální součástí jazyka a slovo fuck slyšíš všude. Používá se když jsi nadšenej, něco se podělá, nebo tě něco naštve.",
      key_phrases: [
        { text_content: "What the fuck (WTF)?", text_content_translation: "Co to kurva?" },
        { text_content: "Kuba is the fucking best.", text_content_translation: "Kuba je zatracenej nejlepší." },
        { text_content: "English is fucking easy.", text_content_translation: "Angličtina je mega lehká." },
        { text_content: "Fuck yeah.", text_content_translation: "Si piš, že jo." }
      ],
      keywords: [{ text_content: "easy" }, { text_content: "life" }]
    }
  },
  {
    id: "RtuPksSeRL-qmbcbv_L4bw",
    name: "Úvod do appky",
    kind: "conversation",
    order: 5,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Úvodní lekce do aplikace. Jak funguje učení s Kubou.",
      key_phrases: [],
      keywords: []
    }
  },
  {
    id: "YhRuTjOATACLnJvWbk8wMA",
    name: "Sloveso do a like + hobbies",
    kind: "grammar",
    order: 6,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Sloveso do jako pomocné a sloveso like pro vyjádření zálib.",
      key_phrases: [
        { text_content: "I like reading.", text_content_translation: "Rád čtu." },
        { text_content: "Do you like sports?", text_content_translation: "Máš rád sporty?" },
        { text_content: "I don't like waking up early.", text_content_translation: "Nerad vstávám brzy." }
      ],
      keywords: [{ text_content: "hobby" }, { text_content: "like" }, { text_content: "do" }]
    }
  },
  {
    id: "LNLpCnHVToWVOq8IBM_P2Q",
    name: "Výslovnost V vs W",
    kind: "pronunciation",
    order: 7,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Rozdíl mezi V a W je pro Čechy těžký. W vyslovujeme se zakulacenými rty.",
      key_phrases: [
        { text_content: "Wine vs Vine", text_content_translation: "Víno vs Réva" },
        { text_content: "West vs Vest", text_content_translation: "Západ vs Vesta" },
        { text_content: "Wet vs Vet", text_content_translation: "Mokrý vs Veterinář" }
      ],
      keywords: [{ text_content: "wine" }, { text_content: "west" }, { text_content: "wet" }]
    }
  },
  {
    id: "Dky2JEgcTp-c6scS5HDM0A",
    name: "Friends & possessive pronouns",
    kind: "grammar",
    order: 8,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Přivlastňovací zájmena - my, your, his, her, its, our, their.",
      key_phrases: [
        { text_content: "This is my friend.", text_content_translation: "Tohle je můj kamarád." },
        { text_content: "Her name is Anna.", text_content_translation: "Jmenuje se Anna." },
        { text_content: "Their house is big.", text_content_translation: "Jejich dům je velký." }
      ],
      keywords: [{ text_content: "my" }, { text_content: "your" }, { text_content: "their" }]
    }
  },
  {
    id: "Q3r2TaMlQ2GrXEFTFYtS-g",
    name: "Sloveso have + my home",
    kind: "grammar",
    order: 9,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Sloveso have a slovní zásoba pro popis domova.",
      key_phrases: [
        { text_content: "I have a big house.", text_content_translation: "Mám velký dům." },
        { text_content: "She has a nice apartment.", text_content_translation: "Má hezký byt." },
        { text_content: "Do you have a garden?", text_content_translation: "Máš zahradu?" }
      ],
      keywords: [{ text_content: "house" }, { text_content: "apartment" }, { text_content: "room" }]
    }
  },
  {
    id: "O679G30jQ2SGrNjWybvWzg",
    name: "My family this that",
    kind: "grammar",
    order: 10,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Ukazovací zájmena this/that/these/those a slovní zásoba pro rodinu.",
      key_phrases: [
        { text_content: "This is my mother.", text_content_translation: "Tohle je moje máma." },
        { text_content: "Those are my cousins.", text_content_translation: "Tamto jsou moji bratranci." },
        { text_content: "That's my sister.", text_content_translation: "Tamta je moje sestra." }
      ],
      keywords: [{ text_content: "family" }, { text_content: "this" }, { text_content: "that" }]
    }
  },
  {
    id: "Oyvk6phuRBi8cMICysWUtA",
    name: "My day: numbers + hodiny",
    kind: "grammar",
    order: 11,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Čísla a jak říct kolik je hodin v angličtině.",
      key_phrases: [
        { text_content: "It's half past seven.", text_content_translation: "Je půl osmé." },
        { text_content: "I wake up at six.", text_content_translation: "Vstávám v šest." },
        { text_content: "What time is it?", text_content_translation: "Kolik je hodin?" }
      ],
      keywords: [{ text_content: "time" }, { text_content: "clock" }, { text_content: "numbers" }]
    }
  },
  {
    id: "ERMapaVrTwKHfRVrxF2Ziw",
    name: "Modální slovesa + restaurace",
    kind: "grammar",
    order: 12,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Can, could, may a fráze pro restauraci.",
      key_phrases: [
        { text_content: "Can I have the menu?", text_content_translation: "Mohu dostat jídelní lístek?" },
        { text_content: "Could you bring the bill?", text_content_translation: "Mohl byste přinést účet?" },
        { text_content: "May I sit here?", text_content_translation: "Smím si tady sednout?" }
      ],
      keywords: [{ text_content: "restaurant" }, { text_content: "can" }, { text_content: "could" }]
    }
  },
  {
    id: "KvZU9m-XRBOzPNM8Mv0YCg",
    name: "Best friend a sloveso DO v 3. osobě",
    kind: "grammar",
    order: 13,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Jak se mění sloveso DO na DOES ve třetí osobě.",
      key_phrases: [
        { text_content: "She does yoga.", text_content_translation: "Dělá jógu." },
        { text_content: "He doesn't like coffee.", text_content_translation: "Nemá rád kávu." },
        { text_content: "Does he play guitar?", text_content_translation: "Hraje na kytaru?" }
      ],
      keywords: [{ text_content: "does" }, { text_content: "doesn't" }, { text_content: "friend" }]
    }
  },
  {
    id: "EZB2kmKCTAKXLIl-9AXPRw",
    name: "Past simple + směry",
    kind: "grammar",
    order: 14,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "Minulý čas prostý a jak se zeptat na cestu.",
      key_phrases: [
        { text_content: "I went to the store.", text_content_translation: "Šel jsem do obchodu." },
        { text_content: "Turn left at the corner.", text_content_translation: "Zahni doleva na rohu." },
        { text_content: "Go straight ahead.", text_content_translation: "Jdi rovně." }
      ],
      keywords: [{ text_content: "went" }, { text_content: "left" }, { text_content: "right" }]
    }
  },
  {
    id: "5b-1p_s3R7mcr2QKKq7glw",
    name: "There is there are + nakupování",
    kind: "grammar",
    order: 15,
    level: "Zacatecnik",
    cefr: "A1",
    summary: {
      description: "There is/are a slovní zásoba pro nakupování.",
      key_phrases: [
        { text_content: "There is a sale today.", text_content_translation: "Dnes jsou výprodeje." },
        { text_content: "Are there any discounts?", text_content_translation: "Jsou nějaké slevy?" },
        { text_content: "There are many shops here.", text_content_translation: "Je tady hodně obchodů." }
      ],
      keywords: [{ text_content: "shop" }, { text_content: "sale" }, { text_content: "buy" }]
    }
  },
  {
    id: "BtldZqN0RNCqf9rmu5vHqQ",
    name: "Every, any, no, some",
    kind: "grammar",
    order: 16,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Neurčitá zájmena every, any, no, some a jejich složeniny.",
      key_phrases: [
        { text_content: "Everyone is here.", text_content_translation: "Všichni jsou tady." },
        { text_content: "Is anyone home?", text_content_translation: "Je někdo doma?" },
        { text_content: "I need something.", text_content_translation: "Potřebuji něco." }
      ],
      keywords: [{ text_content: "everyone" }, { text_content: "something" }, { text_content: "nothing" }]
    }
  },
  {
    id: "jHIEb0N3S0-RBJMW9tYw0w",
    name: "Předložky místa + město",
    kind: "grammar",
    order: 17,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "In, on, at, behind, in front of a slovní zásoba pro město.",
      key_phrases: [
        { text_content: "The bank is next to the post office.", text_content_translation: "Banka je vedle pošty." },
        { text_content: "The park is behind the church.", text_content_translation: "Park je za kostelem." },
        { text_content: "I live in the city center.", text_content_translation: "Bydlím v centru města." }
      ],
      keywords: [{ text_content: "next to" }, { text_content: "behind" }, { text_content: "city" }]
    }
  },
  {
    id: "sALlSC2WQKe2-VClhX7g4A",
    name: "Přivlastňovací pád + tělo",
    kind: "grammar",
    order: 18,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Přivlastňovací pád s 's a části těla.",
      key_phrases: [
        { text_content: "My brother's car is red.", text_content_translation: "Auto mého bratra je červené." },
        { text_content: "My head hurts.", text_content_translation: "Bolí mě hlava." },
        { text_content: "She broke her arm.", text_content_translation: "Zlomila si ruku." }
      ],
      keywords: [{ text_content: "body" }, { text_content: "head" }, { text_content: "arm" }]
    }
  },
  {
    id: "d_mBEd-9SqGNiOqHv_NnmA",
    name: "Object pronouns + oblečení",
    kind: "grammar",
    order: 19,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Předmětová zájmena me, you, him, her a slovní zásoba pro oblečení.",
      key_phrases: [
        { text_content: "Give it to me.", text_content_translation: "Dej mi to." },
        { text_content: "I like your shirt.", text_content_translation: "Líbí se mi tvoje košile." },
        { text_content: "These shoes fit him.", text_content_translation: "Tyhle boty mu sedí." }
      ],
      keywords: [{ text_content: "clothes" }, { text_content: "shirt" }, { text_content: "shoes" }]
    }
  },
  {
    id: "H1I2Hy5hS6O5HHX2GwWYxg",
    name: "Předložky času + svátky",
    kind: "grammar",
    order: 20,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "In, on, at pro vyjádření času a slovní zásoba pro svátky.",
      key_phrases: [
        { text_content: "We celebrate Christmas in December.", text_content_translation: "Vánoce slavíme v prosinci." },
        { text_content: "I was born on July 4th.", text_content_translation: "Narodil jsem se 4. července." },
        { text_content: "At midnight, we toast.", text_content_translation: "O půlnoci si připíjíme." }
      ],
      keywords: [{ text_content: "Christmas" }, { text_content: "birthday" }, { text_content: "holiday" }]
    }
  },
  {
    id: "6vR8fYlmTxC9L3Hy5Hm9RA",
    name: "Stupňování přídavných jmen",
    kind: "grammar",
    order: 21,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Jak tvořit druhý a třetí stupeň přídavných jmen.",
      key_phrases: [
        { text_content: "He is taller than me.", text_content_translation: "Je vyšší než já." },
        { text_content: "This is the best pizza.", text_content_translation: "Tohle je nejlepší pizza." },
        { text_content: "She is more beautiful.", text_content_translation: "Ona je krásnější." }
      ],
      keywords: [{ text_content: "taller" }, { text_content: "best" }, { text_content: "more" }]
    }
  },
  {
    id: "LAGVKvpfTcWzolQ1Gom5JA",
    name: "Moderní zkratky GEN Z",
    kind: "slang",
    order: 22,
    level: "Zacatecnik",
    cefr: "A1",
    video_upload_id: "ecKXI2lTRxibAxLq-bQeDw",
    interactions: {
      interactions: [
        { timestamp: 68500, type: "single-choice", form: { question: "Jak vyjádří Gen Z anglicky, že je někdo tupá ovce?", answers: [{ text: "NPC", correct: true, explanation: null }, { text: "SIMP", correct: false, explanation: "Slovo SIMP už jsme v jedné předchozí lekci probírali a byl to ten vlezlej ubožák, co dolejzá za holkama." }] } },
        { timestamp: 139500, type: "single-choice", form: { question: "Nebudu lhát. Nemám rád rozmazlený spratky. -Pravda.", answers: [{ text: "NGL, I don't like spoiled brats. -FR.", correct: true, explanation: null }, { text: "FYI, I don't like spoiled brats. -RIP.", correct: false, explanation: "FYI znamená pro tvou informaci a RIP znamená odpočívej v pokoji." }] } },
        { timestamp: 161500, type: "single-choice", form: { question: "Kuba je ten největší borec všech dob.", answers: [{ text: "Kuba is the GOAT.", correct: true, explanation: null }, { text: "Kuba is the FART.", correct: false, explanation: "Ses uklikl, že? S prdama nemám nic společnýho." }] } },
        { timestamp: 201500, type: "single-choice", form: { question: "Jsem ožralej jako svině.", answers: [{ text: "I'm drunk AF.", correct: true, explanation: null }, { text: "I'm drunk FR.", correct: false, explanation: "FR jsme už měli a znamená to vážně." }] } }
      ]
    },
    summary: {
      description: "Zkratek Generace Z máme plnej internet, a proto je potřeba se v nich aspoň základně orientovat.",
      key_phrases: [
        { text_content: "NPC (non-playable character)", text_content_translation: "člověk bez vlastního názoru" },
        { text_content: "NGL (not gonna lie)", text_content_translation: "nebudu lhát" },
        { text_content: "FR (for real)", text_content_translation: "jako fakt" },
        { text_content: "the GOAT (the greatest of all time)", text_content_translation: "největší borec všech dob" },
        { text_content: "AF (as fuck)", text_content_translation: "jako svině" }
      ],
      keywords: [{ text_content: "ily" }, { text_content: "for real?" }]
    }
  },
  {
    id: "WKkvBwrfRj2vArA2Lm3XEg",
    name: "Otázky a krátké odpovědi",
    kind: "grammar",
    order: 23,
    level: "Zacatecnik",
    cefr: "A1",
    video_upload_id: "b4KeB50PSIqWK9wzP_RmAQ",
    interactions: {
      interactions: [
        { timestamp: 105500, type: "single-choice", form: { question: "Do you know him? -I think____.", answers: [{ text: "I do.", correct: true, explanation: null }, { text: "I'm.", correct: false, explanation: "I think I'm by znamenalo myslím, že jsem." }] } },
        { timestamp: 127500, type: "single-choice", form: { question: "Do you need to sleep? No_______", answers: [{ text: "I don't.", correct: true, explanation: null }, { text: "I'm not.", correct: false, explanation: "No, I'm not by znamenalo Ne, nejsem." }] } },
        { timestamp: 152500, type: "single-choice", form: { question: "Are you a teacher? Yes______.", answers: [{ text: "I'm.", correct: true, explanation: null }, { text: "I be.", correct: false, explanation: "Yes I be je blbost, protože to znamená ano, já být." }] } },
        { timestamp: 173500, type: "single-choice", form: { question: "Will you do it? No_____", answers: [{ text: "I won't", correct: true, explanation: null }, { text: "I don't", correct: false, explanation: "V otázce je operátor Will, takže potřebujeme will v záporu tedy won't" }] } }
      ]
    },
    summary: {
      description: "V angličtině jsou případy, kdy nemůžeš na otázku odpovědět jenom 'yes' a 'no' ale musíš odpovědět pomocí operátoru.",
      key_phrases: [
        { text_content: "Do you like beer? -Yes, I do.", text_content_translation: "Máš rád pivo. -Ano, mám." },
        { text_content: "Do you think that you love him? -No, I don't.", text_content_translation: "Myslíš si, že ho miluješ? -Myslím, že ne." },
        { text_content: "Are you gay? -Yes, I am.", text_content_translation: "Jsi gay? -Ano, jsem." }
      ],
      keywords: [{ text_content: "yes, I do" }, { text_content: "no, I don't" }]
    }
  },
  {
    id: "EH3UTNpPTRe29Xzfp6q_Ag",
    name: "Video lesson",
    kind: "conversation",
    order: 24,
    level: "Zacatecnik",
    cefr: "A1"
  },
  {
    id: "dr5X1sj_RWmLozQ_-qXAMw",
    name: "Weather",
    kind: "conversation",
    order: 25,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Slovní zásoba pro počasí a jak o něm mluvit.",
      key_phrases: [
        { text_content: "What's the weather like?", text_content_translation: "Jaké je počasí?" },
        { text_content: "It's sunny today.", text_content_translation: "Dnes je slunečno." },
        { text_content: "It might rain later.", text_content_translation: "Později možná bude pršet." }
      ],
      keywords: [{ text_content: "sunny" }, { text_content: "rain" }, { text_content: "cloudy" }]
    }
  },
  {
    id: "fhGKI8VFSFymctGXtUGxQw",
    name: "Celebrities",
    kind: "conversation",
    order: 26,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Jak mluvit o slavných lidech a popisovat osobnosti.",
      key_phrases: [
        { text_content: "She's famous for her music.", text_content_translation: "Je známá svou hudbou." },
        { text_content: "He's a talented actor.", text_content_translation: "Je talentovaný herec." }
      ],
      keywords: [{ text_content: "famous" }, { text_content: "celebrity" }, { text_content: "talent" }]
    }
  },
  {
    id: "nNRQQSKcT9a2h3wVgLxNNw",
    name: "Countable uncountable",
    kind: "grammar",
    order: 27,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Rozdíl mezi počitatelnými a nepočitatelnými podstatnými jmény.",
      key_phrases: [
        { text_content: "I need some water.", text_content_translation: "Potřebuji trochu vody." },
        { text_content: "How much money?", text_content_translation: "Kolik peněz?" },
        { text_content: "How many apples?", text_content_translation: "Kolik jablek?" }
      ],
      keywords: [{ text_content: "much" }, { text_content: "many" }, { text_content: "some" }]
    }
  },
  {
    id: "aRPHM0j_Qr6BZFqGYT5D9g",
    name: "Infinitiv účelový",
    kind: "grammar",
    order: 28,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Infinitiv pro vyjádření účelu - proč něco děláme.",
      key_phrases: [
        { text_content: "I went to the store to buy milk.", text_content_translation: "Šel jsem do obchodu koupit mléko." },
        { text_content: "She studied to pass the exam.", text_content_translation: "Učila se, aby složila zkoušku." }
      ],
      keywords: [{ text_content: "to + infinitive" }, { text_content: "purpose" }]
    }
  },
  {
    id: "W2_bGSFYQZKxwqy0J4bLgA",
    name: "Budoucí čas will",
    kind: "grammar",
    order: 29,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Budoucí čas s will pro spontánní rozhodnutí a předpovědi.",
      key_phrases: [
        { text_content: "I will help you.", text_content_translation: "Pomůžu ti." },
        { text_content: "It will rain tomorrow.", text_content_translation: "Zítra bude pršet." },
        { text_content: "She won't come.", text_content_translation: "Nepřijde." }
      ],
      keywords: [{ text_content: "will" }, { text_content: "won't" }, { text_content: "future" }]
    }
  },
  {
    id: "l9p_JnffSUuCpVgaZZWSjQ",
    name: "Going to budoucnost",
    kind: "grammar",
    order: 30,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Going to pro plány a záměry do budoucnosti.",
      key_phrases: [
        { text_content: "I'm going to visit Paris.", text_content_translation: "Chystám se navštívit Paříž." },
        { text_content: "She's going to get married.", text_content_translation: "Bude se vdávat." },
        { text_content: "It's going to rain.", text_content_translation: "Bude pršet." }
      ],
      keywords: [{ text_content: "going to" }, { text_content: "plan" }, { text_content: "intention" }]
    }
  },
  {
    id: "gVPcfkRxTFiHKl1hXLXxpg",
    name: "Doplňkové otázky",
    kind: "grammar",
    order: 31,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Jak tvořit doplňovací otázky s what, where, when, why, how.",
      key_phrases: [
        { text_content: "What do you do?", text_content_translation: "Co děláš?" },
        { text_content: "Where are you from?", text_content_translation: "Odkud jsi?" },
        { text_content: "Why are you late?", text_content_translation: "Proč jdeš pozdě?" }
      ],
      keywords: [{ text_content: "what" }, { text_content: "where" }, { text_content: "why" }]
    }
  },
  {
    id: "QLOjhQwdRPKQvwLGPCQy7Q",
    name: "Přítomný čas průběhový",
    kind: "grammar",
    order: 32,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Present continuous pro akce probíhající právě teď.",
      key_phrases: [
        { text_content: "I am reading a book.", text_content_translation: "Čtu knihu." },
        { text_content: "She is working.", text_content_translation: "Pracuje." },
        { text_content: "Are you listening?", text_content_translation: "Posloucháš?" }
      ],
      keywords: [{ text_content: "am/is/are + -ing" }, { text_content: "now" }, { text_content: "at the moment" }]
    }
  },
  {
    id: "iy_LRuPuRMuomKfqsN_YpA",
    name: "Past simple vs continuous",
    kind: "grammar",
    order: 33,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Rozdíl mezi minulým časem prostým a průběhovým.",
      key_phrases: [
        { text_content: "I was sleeping when you called.", text_content_translation: "Spal jsem, když jsi volal." },
        { text_content: "While I was cooking, he arrived.", text_content_translation: "Zatímco jsem vařil, přišel." }
      ],
      keywords: [{ text_content: "was/were + -ing" }, { text_content: "while" }, { text_content: "when" }]
    }
  },
  {
    id: "c4fFqTfXRSa4oOq-sYfhKw",
    name: "Minulý čas průběhový",
    kind: "grammar",
    order: 34,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Past continuous pro akce probíhající v určitém momentě v minulosti.",
      key_phrases: [
        { text_content: "I was watching TV at 8.", text_content_translation: "V 8 jsem se díval na televizi." },
        { text_content: "They were playing football.", text_content_translation: "Hráli fotbal." }
      ],
      keywords: [{ text_content: "was" }, { text_content: "were" }, { text_content: "-ing" }]
    }
  },
  {
    id: "t5LYIeSgT-GHJEUpZ-0X8w",
    name: "Podmínka 1. typu",
    kind: "grammar",
    order: 35,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "První kondicionál pro reálné situace v budoucnosti.",
      key_phrases: [
        { text_content: "If it rains, I will stay home.", text_content_translation: "Když bude pršet, zůstanu doma." },
        { text_content: "If you study, you will pass.", text_content_translation: "Když se budeš učit, projdeš." }
      ],
      keywords: [{ text_content: "if + present, will" }]
    }
  },
  {
    id: "UDkVsW7LSPuH46tJTAj3CA",
    name: "Podmínka 2. typu",
    kind: "grammar",
    order: 36,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Druhý kondicionál pro nereálné situace.",
      key_phrases: [
        { text_content: "If I were rich, I would travel.", text_content_translation: "Kdybych byl bohatý, cestoval bych." },
        { text_content: "If I had time, I would help.", text_content_translation: "Kdybych měl čas, pomohl bych." }
      ],
      keywords: [{ text_content: "if + past, would" }]
    }
  },
  {
    id: "h60TGXIxSZ2LcW63GF0lqQ",
    name: "Předpřítomný čas",
    kind: "grammar",
    order: 37,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Present perfect pro zkušenosti a akce s dopadem na přítomnost.",
      key_phrases: [
        { text_content: "I have been to Paris.", text_content_translation: "Byl jsem v Paříži." },
        { text_content: "She has finished her work.", text_content_translation: "Dokončila svou práci." }
      ],
      keywords: [{ text_content: "have/has + past participle" }, { text_content: "ever" }, { text_content: "never" }]
    }
  },
  {
    id: "jAC9uN2xQkmCRgjdhN5M1Q",
    name: "Modální sloveso should",
    kind: "grammar",
    order: 38,
    level: "Zacatecnik",
    cefr: "A2",
    summary: {
      description: "Should pro rady a doporučení.",
      key_phrases: [
        { text_content: "You should see a doctor.", text_content_translation: "Měl bys jít k doktorovi." },
        { text_content: "She shouldn't eat so much.", text_content_translation: "Neměla by tolik jíst." }
      ],
      keywords: [{ text_content: "should" }, { text_content: "shouldn't" }, { text_content: "advice" }]
    }
  },

  // ============================================
  // POKROČILÝ (B1-B2) - 79 lessons
  // ============================================
  {
    id: "M54G0fg5SuaaAewwH3hvgA",
    name: "Češi v zahraničí",
    kind: "conversation",
    order: 100,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Jak se Češi chovají v zahraničí a typické situace.",
      key_phrases: [],
      keywords: []
    }
  },
  {
    id: "Dg0dehInTf6YRRrCB501jA",
    name: "Předpřítomný strašák",
    kind: "grammar",
    order: 101,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Detailní rozbor předpřítomného času.",
      key_phrases: [],
      keywords: []
    }
  },
  {
    id: "Z5pXIdosSQ-IqFAc0dcEXA",
    name: "Hospodská English",
    kind: "slang",
    order: 102,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Angličtina, kterou uslyšíš v hospodě.",
      key_phrases: [],
      keywords: []
    }
  },
  {
    id: "n8TrDcX8QyyBQsw55uLkYA",
    name: "Podmínka 3. typu",
    kind: "grammar",
    order: 103,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "A-X6_LraTpqqF1PqD_K1FA",
    name: "Will vs going to",
    kind: "grammar",
    order: 104,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "Xq1aKhpCQO6H0sQMhp5x-A",
    name: "Příslovce a jejich pozice",
    kind: "grammar",
    order: 105,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "s4GHLk9ST8-Sk__LpI-sGw",
    name: "Frázová slovesa UP",
    kind: "phrasal",
    order: 106,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "p52S5exqRviYeOe4B0jEVw",
    name: "Frázová slovesa DOWN",
    kind: "phrasal",
    order: 107,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "EMXE_Oe4RHyhM-gSWJK8cA",
    name: "Frázová slovesa OUT",
    kind: "phrasal",
    order: 108,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "U-PNqcpuQiio7uCr3iTRGg",
    name: "Be supposed to",
    kind: "grammar",
    order: 109,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "Yzsad3PMRyS2NsqXsZeDSA",
    name: "Výslovnost slov",
    kind: "pronunciation",
    order: 110,
    level: "Pokrocily",
    cefr: "B1"
  },
  {
    id: "ITrK13y9TCq-NcoGCRilfA",
    name: "Insults",
    kind: "slang",
    order: 111,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Mrkli jsme se spolu na častý urážky v angličtině a zakomponovali jsme do toho i idiomy.",
      key_phrases: [
        { text_content: "You are not the sharpest tool in the shed.", text_content_translation: "Nejsi nejostřejší tužka v pouzdře." },
        { text_content: "You bring everyone's IQ down by just talking.", text_content_translation: "Už jen tím, že mluvíš všem snižuješ IQ." }
      ],
      keywords: [{ text_content: "shed" }, { text_content: "prick" }]
    }
  },
  {
    id: "S296QhEyRRe8uVgLbloh_A",
    name: "Emails",
    kind: "business",
    order: 112,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Prošli jsme si, jak napsat správně email. Rozdělili jsme si to podle formálnosti.",
      key_phrases: [
        { text_content: "I hope you're doing well.", text_content_translation: "Doufám, že se máš dobře." },
        { text_content: "I'm reaching out regarding your absence.", text_content_translation: "Kontaktuji tě kvůli tvojí absenci." },
        { text_content: "Best regards", text_content_translation: "S pozdravem" }
      ],
      keywords: [{ text_content: "reply" }, { text_content: "attached" }]
    }
  },
  {
    id: "X0wysltxRBSff5Mq3o2ucA",
    name: "Informal Expressions (Slang)",
    kind: "slang",
    order: 113,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Na ukázkovým dialogu ze života jsme si ukázali pár slangových výrazů, který můžeš použít s kámošema.",
      key_phrases: [
        { text_content: "You wanna hang out tonight?", text_content_translation: "Chceš se dneska večer potkat?" },
        { text_content: "See you around!", text_content_translation: "Zatím se měj!" }
      ],
      keywords: [{ text_content: "lit" }, { text_content: "fucked up" }, { text_content: "turn in" }]
    }
  },
  {
    id: "ZgA_vnqTQNCxtvyFhmpx6w",
    name: "Used to, old days vs new days",
    kind: "grammar",
    order: 114,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Zjistil jsi, že slovo used to má kořen usu, který znamená obvyklý. Doslova jím říkáš, že v minulosti pro tebe bylo něco obvyklý.",
      key_phrases: [
        { text_content: "I used to rule the world.", text_content_translation: "Dřív jsem vládl světu." },
        { text_content: "I'm used to smoking.", text_content_translation: "Jsem zvyklej kouřit." },
        { text_content: "I got used to him.", text_content_translation: "Zvykl jsem si na něj." }
      ],
      keywords: [{ text_content: "smoking" }, { text_content: "get angry" }]
    }
  },
  {
    id: "GtDCpIgLSLy5W8b7yvYToQ",
    name: "Žrádelní idiomy",
    kind: "idioms",
    order: 115,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Mrkli jsme se na idiomy, který souvisí s jídlem. Teď už víš, jak říct brát něco s rezervou, kraksna, zešílet.",
      key_phrases: [
        { text_content: "take something with a grain of salt", text_content_translation: "brát něco s rezervou" },
        { text_content: "lemon", text_content_translation: "kraksna" },
        { text_content: "go bananas", text_content_translation: "zešílet" }
      ],
      keywords: [{ text_content: "low-hanging fruit" }]
    }
  },
  {
    id: "CMAULVtvQ2ifqE9JBc51cA",
    name: "Předminulý čas",
    kind: "grammar",
    order: 116,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Předminulý čas je předpřítomný čas hozenej do minulosti. Používáš ho, když se nějaká věc stala ještě před tou druhou.",
      key_phrases: [
        { text_content: "When I started watching the movie, I realized that I had already seen it.", text_content_translation: "Když jsem začal ten film sledovat, uvědomil jsem si, že už jsem ho předtím viděl." },
        { text_content: "When I called Horst, he had already fallen asleep.", text_content_translation: "Když jsem Horstovi zavolal, tak už předtím usnul." }
      ],
      keywords: [{ text_content: "fall asleep" }, { text_content: "virginity" }]
    }
  },
  {
    id: "fBjL7Zu-SUCYfNcf3ha-nQ",
    name: "Say tell speak talk",
    kind: "grammar",
    order: 117,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Probrali jsme si rozdíly mezi say, tell, speak a talk, protože se mega pletou.",
      key_phrases: [
        { text_content: "He said something very mean.", text_content_translation: "Řekl něco velmi ošklivýho." },
        { text_content: "They didn't tell me about the problem.", text_content_translation: "Neřekli mi o tom problému." },
        { text_content: "I need to speak to the manager.", text_content_translation: "Potřebuji hovořit s vedoucím." }
      ],
      keywords: [{ text_content: "say" }, { text_content: "tell" }, { text_content: "talk" }]
    }
  },
  {
    id: "IKsk7-KmSNCNqNd6XPVNRw",
    name: "Sexual english 2",
    kind: "slang",
    order: 118,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Dneska jsme si probrali sexuální věci. Už víš, jak říct vzrušený a znáš nejčastější sexuální polohy.",
      key_phrases: [
        { text_content: "turned on", text_content_translation: "vzrušený" },
        { text_content: "get hard", text_content_translation: "vzrušit se" },
        { text_content: "get wet", text_content_translation: "zvlhnout" }
      ],
      keywords: [{ text_content: "missionary" }]
    }
  },
  {
    id: "ZNlc1yesSF6TN7dSfcHBQg",
    name: "Informal contractions",
    kind: "slang",
    order: 119,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "V neformální angličtině mají lidi nehoráznou potřebu všechno zkracovat. Proto jsme si prošli nejčastější zkratky.",
      key_phrases: [
        { text_content: "I'm going to go to the store. (Imma go to the store.)", text_content_translation: "Půjdu do obchodu" },
        { text_content: "I wanna make love to you.", text_content_translation: "Chci se s tebou milovat." },
        { text_content: "I gotta go.", text_content_translation: "Musím jít" }
      ],
      keywords: [{ text_content: "imma" }, { text_content: "wanna" }, { text_content: "gotta" }]
    }
  },
  {
    id: "A9ILpt-2RkKvX73wTib-Hw",
    name: "Frázová slovesa se slovem look",
    kind: "phrasal",
    order: 120,
    level: "Pokrocily",
    cefr: "B1",
    summary: {
      description: "Potrénovali jsme si frázová slovesa se slovem look. Vysvětlili jsme si je anglicky.",
      key_phrases: [
        { text_content: "I'm looking for my phone.", text_content_translation: "Hledám svůj mobil." },
        { text_content: "I'm looking after my little son.", text_content_translation: "Hlídám svého synáčka." },
        { text_content: "I'm looking forward to the Papa Roach show.", text_content_translation: "Těším se na koncert Papa Roach." }
      ],
      keywords: [{ text_content: "look up to someone" }, { text_content: "look something up" }]
    }
  },
  {
    id: "ZUwSrLLKRVSzQhGmfFjK9Q",
    name: "Ticháčky - silent letters",
    kind: "pronunciation",
    order: 121,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "WXCzbki2RAyqY3HzhIpYwg",
    name: "Otevřené O",
    kind: "pronunciation",
    order: 122,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "GShNQT1jTEu-NmeeZFnosw",
    name: "Job interview",
    kind: "business",
    order: 123,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "DcNqLXEfTV6jMz8tOTq1_g",
    name: "Dlouhý schwa ER",
    kind: "pronunciation",
    order: 124,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "jJyqDIqlTU6PNhIfYWjvaw",
    name: "Linking R",
    kind: "pronunciation",
    order: 125,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "1i6-nKN-R8WzAlthiw3ZPg",
    name: "ED koncovka",
    kind: "pronunciation",
    order: 126,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "I2E2nVIQTt-86Vg97BRWcQ",
    name: "Schwa",
    kind: "pronunciation",
    order: 127,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "ILUEC0LdR0-9Gd-N-9y0fQ",
    name: "I vs Í",
    kind: "pronunciation",
    order: 128,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "Ul6rJTfpQYaAGIg0qQ-U8A",
    name: "TH Sound",
    kind: "pronunciation",
    order: 129,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "XUu5c_dLSJyKFybbhB5Hzg",
    name: "W Sound",
    kind: "pronunciation",
    order: 130,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "Yt4RgCZES4yBsM6GXBd5fA",
    name: "Flap T",
    kind: "pronunciation",
    order: 131,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "7hnA3FniT2aIcY3FMZeIbQ",
    name: "Britská vs americká ang",
    kind: "pronunciation",
    order: 132,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "bbkREYMGRXGDROONnpyRjA",
    name: "Work business phrases",
    kind: "business",
    order: 133,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "DSJEYGmvRFas8INA2zgF1Q",
    name: "Social media vocabulary",
    kind: "conversation",
    order: 134,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "gV5K5cQ5Q9iLXhKSLMRGPA",
    name: "Idiomy s chlastem",
    kind: "idioms",
    order: 135,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "dSkbxbWMSV6i_utCgAD7tg",
    name: "Způsoby jak říct šukat",
    kind: "slang",
    order: 136,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "HME5GJlPSeKH0P4wi8EylA",
    name: "Healthy lifestyle - SPANÍ",
    kind: "conversation",
    order: 137,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "Je9_WR6lT5aOIDjmzd0hIw",
    name: "Výslovnostní vychytávky",
    kind: "pronunciation",
    order: 138,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "aMBGRJAuTjO3qarBGTDLyw",
    name: "Czenglish challenge",
    kind: "conversation",
    order: 139,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "pWbpEbwISoOR9vGLlwQbtQ",
    name: "4 významy slova ASS",
    kind: "slang",
    order: 140,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "nq7EoVBZTb6Sd3PwFY4y0w",
    name: "Vazba enough",
    kind: "grammar",
    order: 141,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "yTFpNYDrRhaT0XFrJJcqPw",
    name: "Vazba too + adjective",
    kind: "grammar",
    order: 142,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "MIVuJKqhQVGT5GX7mEAdpQ",
    name: "Dating vocabulary",
    kind: "conversation",
    order: 143,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "9dDwPJJaTQ6TM2LsP0Dw0A",
    name: "Healthy lifestyle - CVIČENÍ",
    kind: "conversation",
    order: 144,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "vZUUf3Q0TQuB9_jjxpNcOg",
    name: "Fall phrasal verbs",
    kind: "phrasal",
    order: 145,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "8ZiXwpHSSK60TJWgx20qsQ",
    name: "Gerundium",
    kind: "grammar",
    order: 146,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "D8HNoxF_QB-6kHcHtjWTQA",
    name: "Říct něco pozitivního",
    kind: "conversation",
    order: 147,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "y5MjQ6lLSuOfWz2f7dK2tA",
    name: "Be like vs look like",
    kind: "grammar",
    order: 148,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "PN1hHG7QSAGYl86Gh64oOQ",
    name: "Slangy pro prachy",
    kind: "slang",
    order: 149,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "AjPfWlXiSLqmYuXQg_1ZBw",
    name: "Phrasal verbs",
    kind: "phrasal",
    order: 150,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "Mjd9V-zkR_-kKneOZHAT1w",
    name: "Rizz lesson",
    kind: "slang",
    order: 151,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "lk8kWhYKRD6mxSGhZGQqVw",
    name: "False friends",
    kind: "grammar",
    order: 152,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "6OjJ51bWQG2BZq-M1Y_Wvw",
    name: "Slangy nadávky",
    kind: "slang",
    order: 153,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "fKF7C0SbSiCSY95-KHxz5Q",
    name: "Způsoby jak říct naštvaný",
    kind: "conversation",
    order: 154,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "-KokWt2URfKTEOWmWCGWbQ",
    name: "Předložky za slovesy",
    kind: "grammar",
    order: 155,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "UkNazz4mQ6CGgZT_Bn3qpg",
    name: "Filler words",
    kind: "conversation",
    order: 156,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "8jGI7XFFS2OSu31I9yfuEA",
    name: "Antonyma",
    kind: "grammar",
    order: 157,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "Y_F5xF2nQmibODcODzxU8g",
    name: "Slovní zásoba sport",
    kind: "conversation",
    order: 158,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "wQ3F3oDFS_OU0bKhxauxDA",
    name: "Call phrasal verbs",
    kind: "phrasal",
    order: 159,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "dwMVqXKXTnqpTwXxWCu4dQ",
    name: "Slovíčka psych. stav",
    kind: "conversation",
    order: 160,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "SYQXyjPGQquT-5T_O8VDqg",
    name: "Fitness slovíčka",
    kind: "conversation",
    order: 161,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "kG2N_k4sTM-1T-xkXyQ-Jw",
    name: "Run phrasal verbs",
    kind: "phrasal",
    order: 162,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "uuSGvq_lRUO6_84rYWVkTA",
    name: "Stand phrasal verbs",
    kind: "phrasal",
    order: 163,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "hOyHyqTxR-O2pRQJ2W-u5g",
    name: "Pull phrasal verbs",
    kind: "phrasal",
    order: 164,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "cT7RqRjXSPmWPALBW_Xm-A",
    name: "Způsoby jak říct řvát",
    kind: "conversation",
    order: 165,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "JeCu43HKR5mSO108GuWmgA",
    name: "Tázací dovětky",
    kind: "grammar",
    order: 166,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "JDKxzYzOTgSFxWbXf7Mrpw",
    name: "Předpřítomný vs Předminulý",
    kind: "grammar",
    order: 167,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "HLdeEjWtT7a3HOClaSvZuA",
    name: "Screw off lesson",
    kind: "slang",
    order: 168,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "KVRB7jU8Q0-qjC3rWaekPw",
    name: "Způsoby jak někoho poslat",
    kind: "slang",
    order: 169,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "O2UwiyrLSlimIsXDyiWI5w",
    name: "Významy slova care",
    kind: "grammar",
    order: 170,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "C7mJJLKNSjyihjh_Rg9rGQ",
    name: "Frázová slovesa - Cut",
    kind: "phrasal",
    order: 171,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "RKnY6F4NTWWqxgbcmEAfvg",
    name: "Frázová slovesa - Bring",
    kind: "phrasal",
    order: 172,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "TWR9ovQeSw-A3vTzYn3_ig",
    name: "Stupňování II",
    kind: "grammar",
    order: 173,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "DYlQixBsQKG1SKCQ_wS2jQ",
    name: "Make vs Do",
    kind: "grammar",
    order: 174,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "qxnCQyxMRE2_56s4w4-YNg",
    name: "Vazba would rather",
    kind: "grammar",
    order: 175,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "u-1VfKLLR2aTbJa4eYPUMg",
    name: "Příslovečné určení frekvence",
    kind: "grammar",
    order: 176,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "N-VvB-PATY2A0UBr7y7_mQ",
    name: "Vazba used to",
    kind: "grammar",
    order: 177,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "3AeaBlS_TjWNmT5Y_7HBzQ",
    name: "Gerundium vs infinitiv",
    kind: "grammar",
    order: 178,
    level: "Pokrocily",
    cefr: "B2"
  },
  {
    id: "sFZBJtWzSfqtZjX8UtR-oA",
    name: "Wish + Past Simple",
    kind: "grammar",
    order: 179,
    level: "Pokrocily",
    cefr: "B2"
  },

  // ============================================
  // FRAJERIS (C1-C2) - 34 lessons
  // ============================================
  {
    id: "fXbujS2TS9uSxr4hVzgtnQ",
    name: "Third Conditional",
    kind: "grammar",
    order: 200,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "YqHrzCDUQkSjkwZkZoLE0g",
    name: "Underwear Vocabulary",
    kind: "conversation",
    order: 201,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "RYdH8dboQnGTAkjTGE4GrA",
    name: "Indirect Speech I",
    kind: "grammar",
    order: 202,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "F_sXGeSuT3SRZ1jdEfSHSA",
    name: "Artificial Intelligence",
    kind: "conversation",
    order: 203,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "UHVcTfyXRfaE4pymHTXuhg",
    name: "Just VS Only",
    kind: "grammar",
    order: 204,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "efpAqmozT-qUgSrI86JyUw",
    name: "Alternative Ways Important",
    kind: "conversation",
    order: 205,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "Ju6tHszFTJCVuM1bWj2s8w",
    name: "Gobble Gobble Food Idioms",
    kind: "idioms",
    order: 206,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "iw9iRogLQgqJ7nSEMB-MhQ",
    name: "Jak říct OK",
    kind: "conversation",
    order: 207,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "Hx3LWCbXSryM9yJHJqkP7g",
    name: "Indirect Speech II",
    kind: "grammar",
    order: 208,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "9Oymj__nTb-rLprAVL_Ddw",
    name: "Curse Words Expressions",
    kind: "slang",
    order: 209,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "gZ_NZN2wSzCtCAqPLnDLfA",
    name: "Time Idioms",
    kind: "idioms",
    order: 210,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "qMpnq-hTRACc8p4_RtSKTA",
    name: "Body Parts Idioms",
    kind: "idioms",
    order: 211,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "m5kXqSvPSLm2h0qVw2uaWA",
    name: "Zdravotnická slovíčka",
    kind: "conversation",
    order: 212,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "tQE-DHNGT0GYZffFNJQpFg",
    name: "Peníze idiomy",
    kind: "idioms",
    order: 213,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "WfuKn_BiTpCFUKbH94mfPg",
    name: "Infinitiv nebo -ing",
    kind: "grammar",
    order: 214,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "W0KlfhBqT1SeqEk-rq4gKA",
    name: "Trpný rod",
    kind: "grammar",
    order: 215,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "mwWOdH2ESKW-nwGMdUhMEw",
    name: "Slovesa s objektem",
    kind: "grammar",
    order: 216,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "4GLRP5brSj-nF5oYTH-MzQ",
    name: "Vazba HAVE sth DONE",
    kind: "grammar",
    order: 217,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "TGoQ0Sh5TM6eSMC1qDJXsQ",
    name: "Slovíčka ze soudní síně",
    kind: "conversation",
    order: 218,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "S_0y4LoHT1iIwZKpKJvBrg",
    name: "Quantifiers",
    kind: "grammar",
    order: 219,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "bwDfSHUJQD-6XNsH-CyXBA",
    name: "Vztažné věty",
    kind: "grammar",
    order: 220,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "oOZRDtNiSKamDRbO2V0vNQ",
    name: "Přídavná jména na -ed/-ing",
    kind: "grammar",
    order: 221,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "BO06Dg8_TXKfNs5KqjxMwQ",
    name: "Podmínka smíšená",
    kind: "grammar",
    order: 222,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "tAQzW5XIRS-TzC2LTuVgZg",
    name: "Inversion - zápor na začátku",
    kind: "grammar",
    order: 223,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "AO3EIcM7TdWfOYhwDYMqNw",
    name: "Idiomy s předložkou",
    kind: "idioms",
    order: 224,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "lz8sQBIYTNmkQFYi8-HUvg",
    name: "Rozepsat číslovky",
    kind: "grammar",
    order: 225,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "qjm7GR8aS1SFxON1j2iqdg",
    name: "Sex idiomy",
    kind: "idioms",
    order: 226,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "V14nAfQwTtSIGAr2LoAdpQ",
    name: "Idiomy o smrti",
    kind: "idioms",
    order: 227,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "UKQCbQmURXCQo5G4e8YJjQ",
    name: "Idiomy o pití",
    kind: "idioms",
    order: 228,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "3IgwM5KNQbClCiAhwOTk7A",
    name: "Idiomy o lásce",
    kind: "idioms",
    order: 229,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "4jX_baxrRWKvlDxNNpJt0w",
    name: "Idiomy o ztrátě",
    kind: "idioms",
    order: 230,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "3p-kDQ7CQF-oWYuN-mDv9g",
    name: "Kolokace s have",
    kind: "grammar",
    order: 231,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "kVkdJXcOQuCk3Qe3g_oBZw",
    name: "Reporting verbs I",
    kind: "grammar",
    order: 232,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "ZgVsFMSqQ8KSrRluINpq6g",
    name: "Reporting verbs II",
    kind: "grammar",
    order: 233,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "VSwvD2XNRDmR5_wh94-ONA",
    name: "Linking words",
    kind: "grammar",
    order: 234,
    level: "Frajeris",
    cefr: "C1"
  },
  {
    id: "K2WvPaULR0igXcGzwKe8YA",
    name: "Test lekce",
    kind: "conversation",
    order: 235,
    level: "Frajeris",
    cefr: "C1"
  }
];

// Category mapping for display
export const categoryNames: Record<string, string> = {
  "conversation": "Konverzace",
  "slang": "Slang & Nadávky", 
  "grammar": "Gramatika",
  "idioms": "Idiomy",
  "phrasal": "Frázová slovesa",
  "business": "Obchodní angličtina",
  "travel": "Cestování",
  "pronunciation": "Výslovnost"
};

export const getCategoryName = (kind: string): string => {
  return categoryNames[kind] || "Ostatní";
};

// Get category color for visual distinction
export const getCategoryColor = (kind: string): string => {
  const colors: Record<string, string> = {
    "conversation": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "slang": "bg-red-500/20 text-red-400 border-red-500/30",
    "grammar": "bg-green-500/20 text-green-400 border-green-500/30",
    "idioms": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "phrasal": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "business": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "travel": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "pronunciation": "bg-pink-500/20 text-pink-400 border-pink-500/30"
  };
  return colors[kind] || "bg-primary/20 text-primary border-primary/30";
};
