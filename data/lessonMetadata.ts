// Lesson metadata from DatoCMS CSV export
// Maps lesson ID (reel_link) to level, cefr, and createdAt
// Regenerated to match production app ordering
// Note: CSV uses order values in multiples of 10 (10, 20, 30...)

export type LessonLevel = 'Zacatecnik' | 'Pokrocily' | 'Frajeris';

export interface LessonMeta {
  level: LessonLevel;
  cefr: string;
  createdAt: string;
  order: number;
}

// Extracted from DatoCMS CSV - reel_link → metadata mapping
// Order values are from CSV (multiples of 10)
export const lessonMetadataMap: Record<string, LessonMeta> = {
  // === ZACATECNIK (A1-A2) ===
  // A1 lessons (order 10-130)
  "YRvAqbanTaml66kldE2KbQ": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-06-14T13:36:43.170+01:00", order: 10 }, // Základní pozdravy
  "NoYpfW5fTzCACLWflAivEQ": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-06-24T03:58:20.077+01:00", order: 20 }, // Sloveso be a povolání
  "QFuk1RxtRE6xRt39wKYixw": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:35:43.730+01:00", order: 30 }, // Fráze, otázky a představení se
  "fh9iwW-5Qa6Dwxa4-Q5Y1g": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:35:52.475+01:00", order: 40 }, // První sprostá slova
  "YhRuTjOATACLnJvWbk8wMA": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:36:01.038+01:00", order: 50 }, // Sloveso do a like + hobbies
  "LNLpCnHVToWVOq8IBM_P2Q": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:36:11.702+01:00", order: 60 }, // Výslovnost V vs W
  "Dky2JEgcTp-c6scS5HDM0A": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:39:14.573+01:00", order: 70 }, // Friends & possessive pronouns
  "Q3r2TaMlQ2GrXEFTFYtS-g": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:36:52.076+01:00", order: 80 }, // Sloveso have + my home
  "O679G30jQ2SGrNjWybvWzg": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:38:31.216+01:00", order: 90 }, // My family this that
  "Oyvk6phuRBi8cMICysWUtA": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:38:46.249+01:00", order: 100 }, // My day: numbers + hodiny
  "ERMapaVrTwKHfRVrxF2Ziw": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:39:04.818+01:00", order: 110 }, // Modální slovesa + restaurace
  "KvZU9m-XRBOzPNM8Mv0YCg": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:39:25.022+01:00", order: 120 }, // Best friend a sloveso DO v 3. osobě
  "5b-1p_s3R7mcr2QKKq7glw": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:33.117+01:00", order: 130 }, // There is there are + nakupování
  "BGsHAmRXS1i3fwnSTS2IyA": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:39:41.680+01:00", order: 140 }, // Nadávky
  "Mo744aYAQWapKDENiD7lrQ": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:39:52.000+01:00", order: 150 }, // Traveling + WH questions
  "Qwl7GGLJQ2qB4XFVrZK4Bg": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:00.996+01:00", order: 160 }, // Phrasal verbs + dating
  "b4KeB50PSIqWK9wzP_RmAQ": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:12.385+01:00", order: 170 }, // Otázky a krátké odpovědi
  "MnmJjOU4QIa-uEn9Dn6L0A": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:20.214+01:00", order: 180 }, // Systém čísel
  "KyZHtPSOSMq4rvHarS6p8A": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:31.026+01:00", order: 190 }, // Prostý a průběhový čas
  "bpcNh8BKQzSA3ieR1Gh4-Q": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:41.622+01:00", order: 200 }, // Other ways to say YES and NO
  "AnRep4YjRmalfKEYf-lZSA": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:49.763+01:00", order: 210 }, // Top 5 Idioms
  "TLFDhNMjRbqEnDI47tAYYQ": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:40:58.113+01:00", order: 220 }, // Výslovnost CH
  "PhckxvZRSQicmbU-kJzL3g": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:41:07.439+01:00", order: 230 }, // Měsíce a počasí
  "cYsukXAyQDmCltEvHVtCtw": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:41:18.109+01:00", order: 240 }, // Co říct když nerozumíš
  "IC3gJQP7S8GOCIbg82t55Q": { level: "Zacatecnik", cefr: "A1", createdAt: "2024-08-01T06:41:26.704+01:00", order: 250 }, // Budoucí čas
  
  // A2 lessons (order 260+)
  "T7JUQGc5RRCbqKjd2Xc32w": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:41:34.291+01:00", order: 260 }, // Business English 1
  "BtldZqN0RNCqf9rmu5vHqQ": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:41:43.756+01:00", order: 270 }, // Every, any, no, some
  "PXEO87t7Q36pJEF6uOqGMQ": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:41:55.024+01:00", order: 280 }, // Nejčastěji špatně vyslovovaná slova
  "TAfmn984S0S_ApKbxCFrRw": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:42:04.405+01:00", order: 290 }, // As vs. like JOBS
  "EOmdyp5QTb-U7CVD_f3njQ": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:42:12.890+01:00", order: 300 }, // Minulý čas be + pravidelná slovesa
  "btAMAk_zTee8UOTK8JZYkg": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:42:22.000+01:00", order: 310 }, // Další idiomy
  "EZB2kmKCTAKXLIl-9AXPRw": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:40:18.596+01:00", order: 320 }, // Past simple + směry
  "jHIEb0N3S0-RBJMW9tYw0w": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:41:45.691+01:00", order: 330 }, // Předložky místa + město
  "sALlSC2WQKe2-VClhX7g4A": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:41:55.817+01:00", order: 340 }, // Přivlastňovací pád + tělo
  "d_mBEd-9SqGNiOqHv_NnmA": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:42:35.291+01:00", order: 350 }, // Object pronouns + oblečení
  "H1I2Hy5hS6O5HHX2GwWYxg": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:42:47.131+01:00", order: 360 }, // Předložky času + svátky
  "6vR8fYlmTxC9L3Hy5Hm9RA": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-08-01T06:42:57.605+01:00", order: 370 }, // Stupňování přídavných jmen
  "LAGVKvpfTcWzolQ1Gom5JA": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-06-14T13:36:43.170+01:00", order: 380 }, // Moderní zkratky GEN Z
  "nNRQQSKcT9a2h3wVgLxNNw": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:48:05.408+01:00", order: 390 }, // Countable uncountable
  "aRPHM0j_Qr6BZFqGYT5D9g": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:48:51.665+01:00", order: 400 }, // Infinitiv účelový
  "W2_bGSFYQZKxwqy0J4bLgA": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:49:37.169+01:00", order: 410 }, // Budoucí čas will
  "l9p_JnffSUuCpVgaZZWSjQ": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:50:47.795+01:00", order: 420 }, // Going to budoucnost
  "gVPcfkRxTFiHKl1hXLXxpg": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:51:37.620+01:00", order: 430 }, // Doplňkové otázky
  "QLOjhQwdRPKQvwLGPCQy7Q": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:52:34.429+01:00", order: 440 }, // Přítomný čas průběhový
  "iy_LRuPuRMuomKfqsN_YpA": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:53:55.696+01:00", order: 450 }, // Past simple vs continuous
  "c4fFqTfXRSa4oOq-sYfhKw": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:54:54.009+01:00", order: 460 }, // Minulý čas průběhový
  "t5LYIeSgT-GHJEUpZ-0X8w": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:55:49.929+01:00", order: 470 }, // Podmínka 1. typu
  "UDkVsW7LSPuH46tJTAj3CA": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:56:51.291+01:00", order: 480 }, // Podmínka 2. typu
  "h60TGXIxSZ2LcW63GF0lqQ": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:57:40.668+01:00", order: 490 }, // Předpřítomný čas
  "jAC9uN2xQkmCRgjdhN5M1Q": { level: "Zacatecnik", cefr: "A2", createdAt: "2024-09-12T10:58:42.892+01:00", order: 500 }, // Modální sloveso should
  "dr5X1sj_RWmLozQ_-qXAMw": { level: "Zacatecnik", cefr: "A2", createdAt: "2025-01-26T15:28:47.885+00:00", order: 510 }, // Weather
  "fhGKI8VFSFymctGXtUGxQw": { level: "Zacatecnik", cefr: "A2", createdAt: "2025-01-26T15:27:57.345+00:00", order: 520 }, // Celebrities

  // === POKROCILY (B1-B2) ===
  "M54G0fg5SuaaAewwH3hvgA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:28:10.564+01:00", order: 340 }, // Češi v zahraničí
  "Dg0dehInTf6YRRrCB501jA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:03:37.989+01:00", order: 350 }, // Předpřítomný strašák
  "Z5pXIdosSQ-IqFAc0dcEXA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T12:54:55.919+01:00", order: 360 }, // Hospodská English
  "Vm24Tzq3TuaV5vFP9myh-A": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T12:54:55.919+01:00", order: 370 }, // Otevřené A
  "n8TrDcX8QyyBQsw55uLkYA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:04:30.376+01:00", order: 380 }, // Podmínka 3. typu
  "A-X6_LraTpqqF1PqD_K1FA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:05:26.296+01:00", order: 390 }, // Will vs going to
  "Xq1aKhpCQO6H0sQMhp5x-A": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:00:24.614+01:00", order: 400 }, // Příslovce a jejich pozice
  "s4GHLk9ST8-Sk__LpI-sGw": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:01:06.875+01:00", order: 410 }, // Frázová slovesa UP
  "p52S5exqRviYeOe4B0jEVw": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:01:51.816+01:00", order: 420 }, // Frázová slovesa DOWN
  "EMXE_Oe4RHyhM-gSWJK8cA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-09-12T11:02:45.195+01:00", order: 430 }, // Frázová slovesa OUT
  "U-PNqcpuQiio7uCr3iTRGg": { level: "Pokrocily", cefr: "B1", createdAt: "2024-11-29T22:26:08.387+00:00", order: 440 }, // Be supposed to
  "Yzsad3PMRyS2NsqXsZeDSA": { level: "Pokrocily", cefr: "B1", createdAt: "2024-11-29T22:27:34.156+00:00", order: 450 }, // Výslovnost slov
  
  // B2 lessons
  "ZUwSrLLKRVSzQhGmfFjK9Q": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:36:03.802+01:00", order: 460 }, // Ticháčky - silent letters
  "WXCzbki2RAyqY3HzhIpYwg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:48:43.887+01:00", order: 470 }, // Otevřené O
  "GShNQT1jTEu-NmeeZFnosw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:48:43.887+01:00", order: 480 }, // Job interview
  "DcNqLXEfTV6jMz8tOTq1_g": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:49:40.276+01:00", order: 490 }, // Dlouhý schwa ER
  "jJyqDIqlTU6PNhIfYWjvaw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:50:26.887+01:00", order: 500 }, // Linking R
  "1i6-nKN-R8WzAlthiw3ZPg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:51:41.096+01:00", order: 510 }, // ED koncovka
  "I2E2nVIQTt-86Vg97BRWcQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:54:13.165+01:00", order: 520 }, // Schwa
  "ILUEC0LdR0-9Gd-N-9y0fQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:55:16.295+01:00", order: 530 }, // I vs Í
  "Ul6rJTfpQYaAGIg0qQ-U8A": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:56:10.143+01:00", order: 540 }, // TH Sound
  "XUu5c_dLSJyKFybbhB5Hzg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:58:01.697+01:00", order: 550 }, // W Sound
  "Yt4RgCZES4yBsM6GXBd5fA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:58:51.495+01:00", order: 560 }, // Flap T
  "7hnA3FniT2aIcY3FMZeIbQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:01:41.655+01:00", order: 570 }, // Britská vs americká ang
  "bbkREYMGRXGDROONnpyRjA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:19:13.143+01:00", order: 580 }, // Work business phrases
  "DSJEYGmvRFas8INA2zgF1Q": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T09:36:03.802+01:00", order: 590 }, // Social media vocabulary
  "gV5K5cQ5Q9iLXhKSLMRGPA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:02:50.124+01:00", order: 600 }, // Idiomy s chlastem
  "dSkbxbWMSV6i_utCgAD7tg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:07:39.332+01:00", order: 610 }, // Způsoby jak říct šukat
  "HME5GJlPSeKH0P4wi8EylA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:08:31.518+01:00", order: 620 }, // Healthy lifestyle - SPANÍ
  "Je9_WR6lT5aOIDjmzd0hIw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:09:16.800+01:00", order: 630 }, // Výslovnostní vychytávky
  "aMBGRJAuTjO3qarBGTDLyw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:10:06.299+01:00", order: 640 }, // Czenglish challenge
  "pWbpEbwISoOR9vGLlwQbtQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:11:00.552+01:00", order: 650 }, // 4 významy slova ASS
  "nq7EoVBZTb6Sd3PwFY4y0w": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:11:48.839+01:00", order: 660 }, // Vazba enough
  "yTFpNYDrRhaT0XFrJJcqPw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:12:57.405+01:00", order: 670 }, // Vazba too + adjective
  "MIVuJKqhQVGT5GX7mEAdpQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:13:51.497+01:00", order: 680 }, // Dating vocabulary
  "9dDwPJJaTQ6TM2LsP0Dw0A": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:14:41.656+01:00", order: 690 }, // Healthy lifestyle - CVIČENÍ
  "vZUUf3Q0TQuB9_jjxpNcOg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:15:35.549+01:00", order: 700 }, // Fall phrasal verbs
  "8ZiXwpHSSK60TJWgx20qsQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:16:54.095+01:00", order: 710 }, // Gerundium
  "D8HNoxF_QB-6kHcHtjWTQA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:18:08.178+01:00", order: 720 }, // Říct něco pozitivního
  "y5MjQ6lLSuOfWz2f7dK2tA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:19:03.009+01:00", order: 730 }, // Be like vs look like
  "PN1hHG7QSAGYl86Gh64oOQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:19:51.397+01:00", order: 740 }, // Slangy pro prachy
  "AjPfWlXiSLqmYuXQg_1ZBw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:33:06.246+01:00", order: 750 }, // Phrasal verbs
  "Mjd9V-zkR_-kKneOZHAT1w": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:19:13.143+01:00", order: 760 }, // Rizz lesson
  "lk8kWhYKRD6mxSGhZGQqVw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:03:41.957+01:00", order: 770 }, // False friends
  "6OjJ51bWQG2BZq-M1Y_Wvw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:04:35.217+01:00", order: 780 }, // Slangy nadávky
  "fKF7C0SbSiCSY95-KHxz5Q": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:05:24.988+01:00", order: 790 }, // Způsoby jak říct naštvaný
  "-KokWt2URfKTEOWmWCGWbQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:06:16.067+01:00", order: 800 }, // Předložky za slovesy
  "UkNazz4mQ6CGgZT_Bn3qpg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-13T10:06:54.952+01:00", order: 810 }, // Filler words
  "8jGI7XFFS2OSu31I9yfuEA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:20:28.912+01:00", order: 820 }, // Antonyma
  "Y_F5xF2nQmibODcODzxU8g": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:21:28.119+01:00", order: 830 }, // Slovní zásoba sport
  "wQ3F3oDFS_OU0bKhxauxDA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:22:19.538+01:00", order: 840 }, // Call phrasal verbs
  "dwMVqXKXTnqpTwXxWCu4dQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:23:16.145+01:00", order: 850 }, // Slovíčka psych. stav
  "SYQXyjPGQquT-5T_O8VDqg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:24:16.189+01:00", order: 860 }, // Fitness slovíčka
  "kG2N_k4sTM-1T-xkXyQ-Jw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:27:06.306+01:00", order: 870 }, // Run phrasal verbs
  "uuSGvq_lRUO6_84rYWVkTA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:27:55.666+01:00", order: 880 }, // Stand phrasal verbs
  "hOyHyqTxR-O2pRQJ2W-u5g": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:28:48.011+01:00", order: 890 }, // Pull phrasal verbs
  "cT7RqRjXSPmWPALBW_Xm-A": { level: "Pokrocily", cefr: "B2", createdAt: "2024-09-23T14:30:07.149+01:00", order: 900 }, // Způsoby jak říct řvát
  "JeCu43HKR5mSO108GuWmgA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:29:44.121+00:00", order: 910 }, // Tázací dovětky
  "JDKxzYzOTgSFxWbXf7Mrpw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:32:11.608+00:00", order: 920 }, // Předpřítomný vs Předminulý
  "HLdeEjWtT7a3HOClaSvZuA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:36:01.981+00:00", order: 930 }, // Screw off lesson
  "KVRB7jU8Q0-qjC3rWaekPw": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:36:01.981+00:00", order: 940 }, // Způsoby jak někoho poslat
  "O2UwiyrLSlimIsXDyiWI5w": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:38:30.254+00:00", order: 950 }, // Významy slova care
  "C7mJJLKNSjyihjh_Rg9rGQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:40:00.955+00:00", order: 960 }, // Frázová slovesa - Cut
  "RKnY6F4NTWWqxgbcmEAfvg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:41:21.085+00:00", order: 970 }, // Frázová slovesa - Bring
  "TWR9ovQeSw-A3vTzYn3_ig": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:42:51.809+00:00", order: 980 }, // Stupňování II
  "DYlQixBsQKG1SKCQ_wS2jQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:44:48.119+00:00", order: 990 }, // Make vs Do
  "qxnCQyxMRE2_56s4w4-YNg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:46:00.666+00:00", order: 1000 }, // Vazba would rather
  "u-1VfKLLR2aTbJa4eYPUMg": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:47:31.509+00:00", order: 1010 }, // Příslovečné určení frekvence
  "N-VvB-PATY2A0UBr7y7_mQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:49:03.109+00:00", order: 1020 }, // Vazba used to
  "3AeaBlS_TjWNmT5Y_7HBzQ": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:51:08.810+00:00", order: 1030 }, // Gerundium vs infinitiv
  "sFZBJtWzSfqtZjX8UtR-oA": { level: "Pokrocily", cefr: "B2", createdAt: "2024-11-29T22:52:43.768+00:00", order: 1040 }, // Wish + Past Simple

  // === FRAJERIS (C1-C2) ===
  "fXbujS2TS9uSxr4hVzgtnQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-23T14:33:40.981+01:00", order: 850 }, // Third Conditional
  "djksRSOgTpq0--zjNjTO7g": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-23T14:25:03.732+01:00", order: 850 }, // Mind-blowing Adjectives
  "YqHrzCDUQkSjkwZkZoLE0g": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-23T14:26:11.162+01:00", order: 880 }, // Underwear Vocabulary
  "RYdH8dboQnGTAkjTGE4GrA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-23T14:26:52.752+01:00", order: 890 }, // Indirect Speech I
  "F_sXGeSuT3SRZ1jdEfSHSA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-23T14:33:06.246+01:00", order: 900 }, // Artificial Intelligence
  "LjgOYpkeS8-sr4sTyiRpcA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-23T14:28:19.299+01:00", order: 920 }, // Using 'DO' for Emphasis
  "UHVcTfyXRfaE4pymHTXuhg": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T22:38:30.254+00:00", order: 930 }, // Just VS Only
  "efpAqmozT-qUgSrI86JyUw": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:31:36.338+01:00", order: 940 }, // Alternative Ways Important
  "Ju6tHszFTJCVuM1bWj2s8w": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:32:32.641+01:00", order: 950 }, // Gobble Gobble Food Idioms
  "iw9iRogLQgqJ7nSEMB-MhQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:33:15.595+01:00", order: 960 }, // Jak říct OK
  "Hx3LWCbXSryM9yJHJqkP7g": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:34:09.133+01:00", order: 970 }, // Indirect Speech II
  "9Oymj__nTb-rLprAVL_Ddw": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:36:46.052+01:00", order: 980 }, // Curse Words Expressions
  "gZ_NZN2wSzCtCAqPLnDLfA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:37:37.159+01:00", order: 990 }, // Time Idioms
  "qMpnq-hTRACc8p4_RtSKTA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:38:24.458+01:00", order: 1000 }, // Body Parts Idioms
  "m5kXqSvPSLm2h0qVw2uaWA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:39:23.420+01:00", order: 1010 }, // Zdravotnická slovíčka
  "tQE-DHNGT0GYZffFNJQpFg": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:40:26.416+01:00", order: 1020 }, // Peníze idiomy
  "WfuKn_BiTpCFUKbH94mfPg": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:41:20.814+01:00", order: 1030 }, // Infinitiv nebo -ing
  "W0KlfhBqT1SeqEk-rq4gKA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:42:34.376+01:00", order: 1040 }, // Trpný rod
  "mwWOdH2ESKW-nwGMdUhMEw": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:43:20.099+01:00", order: 1050 }, // Slovesa s objektem
  "4GLRP5brSj-nF5oYTH-MzQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:44:13.161+01:00", order: 1060 }, // Vazba HAVE sth DONE
  "TGoQ0Sh5TM6eSMC1qDJXsQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:45:23.890+01:00", order: 1070 }, // Slovíčka ze soudní síně
  "S_0y4LoHT1iIwZKpKJvBrg": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:46:16.817+01:00", order: 1080 }, // Quantifiers
  "bwDfSHUJQD-6XNsH-CyXBA": { level: "Frajeris", cefr: "C1", createdAt: "2024-09-24T11:47:04.663+01:00", order: 1090 }, // Vztažné věty
  "oOZRDtNiSKamDRbO2V0vNQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T22:53:55.408+00:00", order: 1100 }, // Přídavná jména na -ed/-ing
  "BO06Dg8_TXKfNs5KqjxMwQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T22:55:29.091+00:00", order: 1110 }, // Podmínka smíšená
  "tAQzW5XIRS-TzC2LTuVgZg": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T22:56:59.694+00:00", order: 1120 }, // Inversion - zápor na začátku
  "AO3EIcM7TdWfOYhwDYMqNw": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T22:58:22.879+00:00", order: 1130 }, // Idiomy s předložkou
  "lz8sQBIYTNmkQFYi8-HUvg": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T22:59:42.420+00:00", order: 1140 }, // Rozepsat číslovky
  "qjm7GR8aS1SFxON1j2iqdg": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:00:56.217+00:00", order: 1150 }, // Sex idiomy
  "V14nAfQwTtSIGAr2LoAdpQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:02:03.893+00:00", order: 1160 }, // Idiomy o smrti
  "UKQCbQmURXCQo5G4e8YJjQ": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:03:13.016+00:00", order: 1170 }, // Idiomy o pití
  "3IgwM5KNQbClCiAhwOTk7A": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:04:21.879+00:00", order: 1180 }, // Idiomy o lásce
  "4jX_baxrRWKvlDxNNpJt0w": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:05:25.568+00:00", order: 1190 }, // Idiomy o ztrátě
  "3p-kDQ7CQF-oWYuN-mDv9g": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:06:35.376+00:00", order: 1200 }, // Kolokace s have
  "kVkdJXcOQuCk3Qe3g_oBZw": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:07:50.679+00:00", order: 1210 }, // Reporting verbs I
  "ZgVsFMSqQ8KSrRluINpq6g": { level: "Frajeris", cefr: "C1", createdAt: "2024-11-29T23:08:53.620+00:00", order: 1220 }, // Reporting verbs II
  "VSwvD2XNRDmR5_wh94-ONA": { level: "Frajeris", cefr: "C1", createdAt: "2025-01-26T15:23:26.020+00:00", order: 1230 }, // Linking words
};

// Level display names for UI
export const levelNames: Record<LessonLevel, string> = {
  Zacatecnik: "Začátečník",
  Pokrocily: "Pokročilý",
  Frajeris: "Frajeris"
};

// Level with CEFR labels for picker
export const levelLabels: Record<LessonLevel, string> = {
  Zacatecnik: "A1-A2",
  Pokrocily: "B1-B2",
  Frajeris: "C1-C2"
};

// CEFR to Level mapping
export const cefrToLevel: Record<string, LessonLevel> = {
  "A1": "Zacatecnik",
  "A2": "Zacatecnik", 
  "B1": "Pokrocily",
  "B2": "Pokrocily",
  "C1": "Frajeris",
  "C2": "Frajeris"
};

// Level filter options for UI picker
export const levelOptions = [
  { value: 'Zacatecnik', label: 'Začátečník', cefr: 'A1-A2' },
  { value: 'Pokrocily', label: 'Pokročilý', cefr: 'B1-B2' },
  { value: 'Frajeris', label: 'Frajeris', cefr: 'C1-C2' }
] as const;

// Helper to find metadata by lesson ID or video_upload_id
function findMeta(lessonId: string, videoUploadId?: string): LessonMeta | undefined {
  if (lessonMetadataMap[lessonId]) {
    return lessonMetadataMap[lessonId];
  }
  if (videoUploadId && lessonMetadataMap[videoUploadId]) {
    return lessonMetadataMap[videoUploadId];
  }
  return undefined;
}

// Get level for a lesson
export function getLessonLevel(lessonId: string, order: number, videoUploadId?: string): LessonLevel {
  const meta = findMeta(lessonId, videoUploadId);
  if (meta) return meta.level;
  
  // Fallback based on order (CSV uses multiples of 10)
  if (order <= 330) return 'Zacatecnik';
  if (order <= 850) return 'Pokrocily';
  return 'Frajeris';
}

// Get CEFR for a lesson
export function getLessonCefr(lessonId: string, order: number, videoUploadId?: string): string {
  const meta = findMeta(lessonId, videoUploadId);
  if (meta) return meta.cefr;
  
  // Fallback
  if (order <= 250) return 'A1';
  if (order <= 330) return 'A2';
  if (order <= 450) return 'B1';
  if (order <= 850) return 'B2';
  return 'C1';
}

// Get order from metadata
export function getLessonOrder(lessonId: string, fallbackOrder: number, videoUploadId?: string): number {
  const meta = findMeta(lessonId, videoUploadId);
  return meta?.order ?? fallbackOrder;
}

// Get created date for a lesson
export function getLessonCreatedAt(lessonId: string): string | undefined {
  return lessonMetadataMap[lessonId]?.createdAt;
}

// Get CEFR label for a level
export function getCefrForLevel(level: LessonLevel): string {
  return levelLabels[level];
}

// Get total lesson count
export function getTotalLessonCount(): number {
  return Object.keys(lessonMetadataMap).length;
}
