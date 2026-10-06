// Dhikr Garden Grower - content data
// Plain browser script. Sets window.DG_CONTENT. No modules, no imports.

/* Shared morning/evening remembrances (11) */
const DG_SHARED = [
  {
    id: "sayyid-istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allahumma anta rabbi, la ilaha illa anta, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika masta-ta't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika 'alayy, wa abu'u bidhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa ant",
    translation: "O Allah, You are my Lord; there is no deity but You. You created me and I am Your servant. I uphold Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sins, so forgive me — for none forgives sins but You.",
    count: null,
    note: "The best form of seeking forgiveness."
  },
  {
    id: "alim-al-ghayb",
    arabic: "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
    transliteration: "Allahumma 'alimal-ghaybi wash-shahadah, fatiras-samawati wal-ard, rabba kulli shay'in wa malikah, ash-hadu an la ilaha illa anta, a'udhu bika min sharri nafsi, wa min sharrish-shaytani wa shirkihi, wa an aqtarifa 'ala nafsi su'an, aw ajurrahu ila muslim",
    translation: "O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Sovereign of all things: I bear witness that there is no deity but You. I seek refuge in You from the evil of my soul, from the evil of Satan and his traps, and from wronging myself or bringing harm upon a Muslim.",
    count: null,
    note: null
  },
  {
    id: "ushhiduk",
    arabic: "اللَّهُمَّ إِنِّي أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
    transliteration: "Allahumma inni ash-haduka wa ash-hadu hamalata 'arshika wa mala'ikataka wa jami'a khalqik, annaka anta Allahu la ilaha illa anta, wahdaka la sharika lak, wa anna Muhammadan 'abduka wa rasuluk",
    translation: "O Allah, I call You to witness, and I call the bearers of Your Throne, Your angels, and all Your creation to witness, that You are Allah — there is no deity but You, alone without partner — and that Muhammad is Your servant and Messenger.",
    count: "4x",
    note: "Said four times."
  },
  {
    id: "muawwidhat-ikhlas",
    arabic: "قُلْ هُوَ اللهُ أَحَدٌ ۝ اللهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
    transliteration: "Qul huwAllahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakul-lahu kufuwan ahad.",
    translation: "Surah Al-Ikhlas (112): Say, He is Allah, the One; Allah, the Eternal Refuge. He neither begets nor is born, and there is none like Him.",
    count: "3x",
    note: "Recited three times."
  },
  {
    id: "muawwidhat-falaq",
    arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    transliteration: "Qul a'udhu birabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.",
    translation: "Surah Al-Falaq (113): Say, I seek refuge in the Lord of the daybreak, from the evil of what He created, from the evil of darkness when it settles, from the evil of those who blow on knots, and from the evil of the envier when he envies.",
    count: "3x",
    note: "Recited three times."
  },
  {
    id: "muawwidhat-nas",
    arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
    transliteration: "Qul a'udhu birabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
    translation: "Surah An-Nas (114): Say, I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers into the chests of mankind, from among jinn and men.",
    count: "3x",
    note: "Recited three times."
  },
  {
    id: "bismillahil-ladhi",
    arabic: "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahil-ladhi la yadurru ma'a-smihi shay'un fil-ardi wa la fis-sama'i, wa huwas-sami'ul-'alim",
    translation: "In the name of Allah, the One with Whose Name nothing on Earth or in the sky can harm, and He is the One Who hears and knows.",
    count: "3x",
    note: "Whoever says it three times is protected from harm."
  },
  {
    id: "dua-al-hamm",
    arabic: "لَا إِلَهَ إِلَّا اللهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    transliteration: "La ilaha illallahul-'azimul-halim. La ilaha illallahu rabbul-'arshil-'azim. La ilaha illallahu rabbus-samawati wa rabbul-ardi wa rabbul-'arshil-karim",
    translation: "There is no deity but Allah, the Magnificent, the Forbearing. There is no deity but Allah, Lord of the Magnificent Throne. There is no deity but Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.",
    count: null,
    note: "The supplication of the Prophet ﷺ in times of distress."
  },
  {
    id: "hasbiyallah",
    arabic: "حَسْبِيَ اللهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbiyallahu la ilaha illa huwa, 'alayhi tawakkaltu, wa huwa rabbul-'arshil-'azim",
    translation: "Allah is sufficient for me; there is no deity but Him. Upon Him I rely, and He is the Lord of the Mighty Throne.",
    count: "7x",
    note: "Said seven times."
  },
  {
    id: "mann-shahida",
    arabic: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ",
    transliteration: "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasulullah",
    translation: "I bear witness that there is no deity but Allah, and I bear witness that Muhammad is the Messenger of Allah.",
    count: null,
    note: null
  },
  {
    id: "raditu-billahi",
    arabic: "رَضِيتُ بِاللهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
    transliteration: "Raditu billahi rabba, wa bil-islami dina, wa bi-Muhammadin sallallahu 'alayhi wa sallama nabiyya",
    translation: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.",
    count: "3x",
    note: "Said three times."
  },
  {
    id: "subhanallahi-wa-bihamdihi-am",
    arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    transliteration: "SubhanAllahi wa bihamdihi",
    translation: "Glory be to Allah and praise Him.",
    count: "100x",
    note: "Whoever says it 100 times, his sins are forgiven even if like the foam of the sea."
  },
  {
    id: "ya-hayyu-ya-qayyum",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    transliteration: "Ya Hayyu Ya Qayyum, bi rahmatika astaghith, aslih li sha'ni kullah, wa la takilni ila nafsi tarfata 'ayn",
    translation: "O Ever-Living, O Self-Sustaining: by Your mercy I seek help. Rectify all my affairs, and do not leave me to myself even for the blink of an eye.",
    count: null,
    note: null
  }
];

/* Morning-only remembrances (4) */
const DG_MORNING_ONLY = [
  {
    id: "bika-asbahna",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namut, wa ilaykan-nushur",
    translation: "O Allah, by You we enter the morning and by You we enter the evening; by You we live and by You we die, and to You is the resurrection.",
    count: null,
    note: "Said in the morning."
  },
  {
    id: "ayat-al-kursi",
    arabic: "اللهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi shay'in min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifdhuhuma, wa huwal-'aliyyul-'azim",
    translation: "Allah — there is no deity but Him, the Ever-Living, the Self-Sustaining. Neither slumber nor sleep overtakes Him. To Him belongs all that is in the heavens and all that is on earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Throne extends over the heavens and the earth, and their preservation does not tire Him. He is the Most High, the Magnificent.",
    count: null,
    note: "The Verse of the Throne (Qur'an 2:255)."
  },
  {
    id: "la-ilaha-wahdahu",
    arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
    translation: "There is no deity but Allah, alone without partner; His is the dominion and His is the praise, and He has power over all things.",
    count: "100x",
    note: "Whoever says it 100 times in a day earns a reward like freeing ten slaves, and it is a protection from Satan until evening."
  },
  {
    id: "a-udhu-bikalimatillah",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    count: "3x",
    note: "Said three times in the morning."
  }
];

/* Evening-only remembrances (1) */
const DG_EVENING_ONLY = [
  {
    id: "amsayna",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    transliteration: "Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhihil-laylati wa khayra ma ba'daha, wa a'udhu bika min sharri ma fi hadhihil-laylati wa sharri ma ba'daha. Rabbi a'udhu bika minal-kasali wa su'il-kibar, rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr",
    translation: "We have entered the evening and at this very time all sovereignty belongs to Allah, and all praise is for Allah. There is no deity but Allah, alone without partner; His is the sovereignty and His is the praise, and He has power over all things. My Lord, I ask You for the good of this night and the good of what follows it, and I seek refuge in You from the evil of this night and the evil of what follows it. My Lord, I seek refuge in You from laziness and the hardships of old age. My Lord, I seek refuge in You from torment in the Fire and torment in the grave.",
    count: null,
    note: "Said in the evening."
  }
];

/* Milestone flower sets: 10 dhikr x 3 tiers x (cumulative / single-session) = 60 names */
function dgMilestoneSet(base, emoji) {
  return {
    cumulative: {
      "100": { name: "Young " + base, emoji: emoji },
      "500": { name: "Blooming " + base, emoji: emoji },
      "1000": { name: "Grand " + base, emoji: emoji }
    },
    single: {
      "100": { name: "Ember " + base, emoji: emoji },
      "500": { name: "Frost " + base, emoji: emoji },
      "1000": { name: "Storm " + base, emoji: emoji }
    }
  };
}

/* ---------------- switchable themes ----------------
   garden:  the original flower garden (default).
   highway: car racing — milestone blooms become cars, the Herbarium becomes the Racing Garage.
   mine:    precious-metal mining — blooms become gems/minerals, the Herbarium becomes the Mineral Vault.
   Rarity tiers are unchanged; only names, illustrations, and copy re-skin.
   Progress (counts, earned milestones, discoveries) is theme-agnostic. */
const DG_THEMES = {
  garden: {
    name: "Garden",
    tagline: "Grow a bloom with every dhikr",
    emoji: "🌱",
    collection: "Herbarium",
    themeColor: "#0b100e",
    copy: {
      collection: "Herbarium",
      homeKicker: "Your quiet patch",
      homeName: "Garden",
      heroKicker: "Your garden",
      heroTitle: "What you remember, grows.",
      milestoneUnit: "milestone blooms",
      statUnit: "blooms",
      gsKicker: "New to the garden?",
      gsBody: "Learn how practice grows your garden and unlocks new blooms.",
      previewKicker: "Collection preview",
      atmosphereKicker: "Garden atmosphere",
      defaultSeason: "Everyday garden",
      awaySing: "flower bloomed",
      awayPlur: "flowers bloomed",
      rewardDoneTitle: "Garden complete",
      rewardDoneBody: "Every bloom discovered. May your garden keep growing with every remembrance.",
      awardNoun: "bloom",
      awardVerb: "planted in your garden 🌱",
      sessionVerb: "was planted",
      sessionEmoji: "🌱",
      tapEmoji: "🌱",
      defaultEmoji: "🌸",
      stageSeed: "🌱",
      stageSprout: "🌿",
      herbariumLede: "Undiscovered blooms stay in silhouette. Every reveal comes from a clear milestone—never chance, trading, or comparison with anyone else.",
      secretTitle: "Secret bloom",
      secretHidden: "A hidden bloom",
      progressSub: "Your remembrance journey, in numbers and blooms.",
      secretTease: "A secret bloom hides in this garden… keep remembering.",
      themeKicker: "Choose your world",
      themeTitle: "Pick a theme",
      gsEmoji: "🌱",
      gsSub: "Four steps to your first bloom.",
      fbStep3Title: "Grow your garden",
      fbStep3Body: "Every finished session plants a flower. Flowers start as seeds 🌱, sprout 🌿, and bloom 🌸 in real time — even while the app is closed.",
      fbStep4Body: "Check the Daily Rhythm for morning and evening remembrances, and visit your Herbarium to see every bloom you have discovered."
    }
  },
  highway: {
    name: "Highway",
    tagline: "Race a mile with every dhikr",
    emoji: "🏁",
    collection: "Racing Garage",
    themeColor: "#0a0e16",
    rewardBases: {
      "subhanallah": { name: "City Sedan", emoji: "🚗" },
      "alhamdulillah": { name: "Family Wagon", emoji: "🚙" },
      "allahu-akbar": { name: "Work Pickup", emoji: "🛻" },
      "astaghfirullah": { name: "City Taxi", emoji: "🚕" },
      "hasbunallah": { name: "Patrol Cruiser", emoji: "🚓" },
      "tahlil": { name: "Rally Racer", emoji: "🏎️" },
      "salawat": { name: "Tour Coach", emoji: "🚚" },
      "subhanallahi-wa-bihamdihi": { name: "Big Hauler", emoji: "🚛" },
      "subhanallahil-azim": { name: "Sport Bike", emoji: "🏍️" },
      "la-hawla": { name: "Victory Scooter", emoji: "🛵" }
    },
    tierWords: {
      cumulative: { "100": "Rookie", "500": "Pro", "1000": "Champion" },
      single: { "100": "Night", "500": "Drift", "1000": "Turbo" }
    },
    goldenPrefix: "Golden",
    specials: {
      "10000": { name: "Aurora GT Racer", emoji: "🏎️" },
      "70000": { name: "Twin Turbo Legends", emoji: "🏁" }
    },
    secret: { name: "Diamond Grand Prix Trophy", emoji: "🏆" },
    copy: {
      collection: "Racing Garage",
      homeKicker: "Your home stretch",
      homeName: "Highway",
      heroKicker: "Your highway",
      heroTitle: "What you remember, drives you.",
      milestoneUnit: "milestone cars",
      statUnit: "cars",
      gsKicker: "New to the race?",
      gsBody: "Learn how practice fuels your race and unlocks new cars.",
      previewKicker: "Collection preview",
      atmosphereKicker: "Track atmosphere",
      defaultSeason: "Everyday highway",
      awaySing: "car got tuned",
      awayPlur: "cars got tuned",
      rewardDoneTitle: "Garage complete",
      rewardDoneBody: "Every car unlocked. May your highway keep stretching with every remembrance.",
      awardNoun: "car",
      awardVerb: "rolled into your garage 🏁",
      sessionVerb: "rolled into your garage",
      sessionEmoji: "🏁",
      tapEmoji: "🏁",
      defaultEmoji: "🏎️",
      stageSeed: "🏁",
      stageSprout: "🔧",
      herbariumLede: "Undiscovered cars stay under covers. Every reveal comes from a clear milestone—never chance, trading, or comparison with anyone else.",
      secretTitle: "Secret car",
      secretHidden: "A hidden car",
      progressSub: "Your remembrance journey, in numbers and cars.",
      secretTease: "A secret car hides in this garage… keep remembering.",
      themeKicker: "Choose your world",
      themeTitle: "Pick a theme",
      gsEmoji: "🏁",
      gsSub: "Four steps to your first car.",
      fbStep3Title: "Grow your garage",
      fbStep3Body: "Every finished session parks a car. Cars get tuned in real time — even while the app is closed, your garage keeps what you earned.",
      fbStep4Body: "Check the Daily Rhythm for morning and evening remembrances, and visit your Racing Garage to see every car you have unlocked."
    },
    gettingStarted: [
      { title: "Choose a remembrance", body: "Pick a dhikr from the Practice page and tap to count each repetition." },
      { title: "Complete counts to park cars", body: "Finishing a dhikr's target count parks its car in your Racing Garage and moves you along the learning path." },
      { title: "Check Daily Rhythm", body: "Work through the morning and evening remembrances each day to keep your engine warm." },
      { title: "Discover milestones", body: "Reach 100, 500, and 1,000 repetitions — in total and in a single sitting — to unlock rare cars and grow your Racing Garage collection." }
    ]
  },
  mine: {
    name: "Mine",
    tagline: "Unearth treasure with every dhikr",
    emoji: "⛏️",
    collection: "Mineral Vault",
    themeColor: "#100c08",
    rewardBases: {
      "subhanallah": { name: "Copper Nugget", emoji: "🟤" },
      "alhamdulillah": { name: "Coal Seam", emoji: "⚫" },
      "allahu-akbar": { name: "Ironstone", emoji: "🪨" },
      "astaghfirullah": { name: "Silver Vein", emoji: "⚪" },
      "hasbunallah": { name: "Amber Drop", emoji: "🟠" },
      "tahlil": { name: "Sapphire Heart", emoji: "🔷" },
      "salawat": { name: "Ruby Ember", emoji: "🔴" },
      "subhanallahi-wa-bihamdihi": { name: "Jade Stone", emoji: "🟢" },
      "subhanallahil-azim": { name: "Amethyst Geode", emoji: "🟣" },
      "la-hawla": { name: "Diamond Core", emoji: "💎" }
    },
    tierWords: {
      cumulative: { "100": "Rough", "500": "Cut", "1000": "Flawless" },
      single: { "100": "Dusty", "500": "Polished", "1000": "Radiant" }
    },
    goldenPrefix: "Golden",
    specials: {
      "10000": { name: "Aurora Diamond", emoji: "💠" },
      "70000": { name: "Twin Crown Jewels", emoji: "👑" }
    },
    secret: { name: "The Mother Lode", emoji: "⛏️" },
    copy: {
      collection: "Mineral Vault",
      homeKicker: "Your claim",
      homeName: "Mine",
      heroKicker: "Your mine",
      heroTitle: "What you remember, shines.",
      milestoneUnit: "milestone gems",
      statUnit: "gems",
      gsKicker: "New to the mine?",
      gsBody: "Learn how practice deepens your mine and unearths new gems.",
      previewKicker: "Collection preview",
      atmosphereKicker: "Mine atmosphere",
      defaultSeason: "Everyday mine",
      awaySing: "gem was polished",
      awayPlur: "gems were polished",
      rewardDoneTitle: "Vault complete",
      rewardDoneBody: "Every gem unearthed. May your mine keep yielding with every remembrance.",
      awardNoun: "gem",
      awardVerb: "added to your vault ⛏️",
      sessionVerb: "was added to your vault",
      sessionEmoji: "⛏️",
      tapEmoji: "⛏️",
      defaultEmoji: "💎",
      stageSeed: "⛏️",
      stageSprout: "🪨",
      herbariumLede: "Undiscovered gems stay in the rough. Every reveal comes from a clear milestone—never chance, trading, or comparison with anyone else.",
      secretTitle: "Secret gem",
      secretHidden: "A hidden gem",
      progressSub: "Your remembrance journey, in numbers and gems.",
      secretTease: "A secret gem hides in this vault… keep remembering.",
      themeKicker: "Choose your world",
      themeTitle: "Pick a theme",
      gsEmoji: "⛏️",
      gsSub: "Four steps to your first gem.",
      fbStep3Title: "Fill your vault",
      fbStep3Body: "Every finished session unearths a gem. Gems are polished in real time — even while the app is closed, your vault keeps what you earned.",
      fbStep4Body: "Check the Daily Rhythm for morning and evening remembrances, and visit your Mineral Vault to see every gem you have unearthed."
    },
    gettingStarted: [
      { title: "Choose a remembrance", body: "Pick a dhikr from the Practice page and tap to count each repetition." },
      { title: "Complete counts to unearth gems", body: "Finishing a dhikr's target count adds its gem to your Mineral Vault and moves you along the learning path." },
      { title: "Check Daily Rhythm", body: "Work through the morning and evening remembrances each day to keep your lamp lit." },
      { title: "Discover milestones", body: "Reach 100, 500, and 1,000 repetitions — in total and in a single sitting — to unearth rare gems and grow your Mineral Vault collection." }
    ]
  }
};

window.DG_CONTENT = {
  meta: { appName: "Dhikr Garden Grower", version: 1 },
  themes: DG_THEMES,

  rarityOrder: ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Exotic", "Mythic", "Diamond"],

  practiceDhikr: [
    { id: "subhanallah", arabic: "سُبْحَانَ اللهِ", transliteration: "subhanallah", translation: "Glory be to Allah", target: 33, virtue: "Part of the four most beloved words to Allah.", flower: { name: "Sunflower", emoji: "🌻", rarity: "Common" }, stage: 1 },
    { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "alhamdulillah", translation: "All praise is due to Allah", target: 33, virtue: "Part of the four most beloved words to Allah.", flower: { name: "Rose", emoji: "🌹", rarity: "Common" }, stage: 1 },
    { id: "allahu-akbar", arabic: "اللهُ أَكْبَرُ", transliteration: "Allahu akbar", translation: "Allah is the Greatest", target: 34, virtue: "Part of the four most beloved words to Allah.", flower: { name: "Tulip", emoji: "🌷", rarity: "Common" }, stage: 1 },
    { id: "astaghfirullah", arabic: "أَسْتَغْفِرُ اللهَ", transliteration: "Astaghfirullah", translation: "I seek Allah's forgiveness", target: 100, virtue: "The Prophet ﷺ sought Allah's forgiveness 100 times a day. Including others (e.g. one's parents) multiplies the reward.", flower: { name: "Daisy", emoji: "🌼", rarity: "Uncommon" }, stage: 2 },
    { id: "hasbunallah", arabic: "حَسْبُنَا اللهُ وَنِعْمَ الْوَكِيلُ", transliteration: "Hasbunallahu wa ni'mal wakeel", translation: "Allah is sufficient for us, and He is the best Disposer of affairs", target: 33, virtue: "The saying of the believers in times of hardship (Qur'an 3:173).", flower: { name: "Golden Wheat", emoji: "🌾", rarity: "Uncommon" }, stage: 2 },
    { id: "tahlil", arabic: "لَا إِلَهَ إِلَّا اللهُ", transliteration: "La ilaha illa Allah", translation: "There is no deity but Allah", target: 100, virtue: "The best dhikr; the best of the four most beloved words.", flower: { name: "Cherry Blossom", emoji: "🌸", rarity: "Rare" }, stage: 3 },
    { id: "salawat", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", transliteration: "Allahumma salli 'ala Muhammad", translation: "O Allah, send blessings upon Muhammad", target: 100, virtue: "Whoever sends one blessing upon the Prophet ﷺ, Allah sends ten upon him.", flower: { name: "Hibiscus", emoji: "🌺", rarity: "Rare" }, stage: 3 },
    { id: "subhanallahi-wa-bihamdihi", arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", transliteration: "SubhanAllahi wa bihamdihi", translation: "Glory be to Allah and praise Him", target: 100, virtue: "Whoever says it 100 times, a palm tree is planted for him in Paradise — and his sins are forgiven even if like the foam of the sea.", flower: { name: "Lotus", emoji: "🪷", rarity: "Epic" }, stage: 4 },
    { id: "subhanallahil-azim", arabic: "سُبْحَانَ اللهِ الْعَظِيمِ", transliteration: "SubhanAllahil-Azim", translation: "Glory be to Allah, the Magnificent", target: 100, virtue: "Two phrases light on the tongue, heavy on the Scale, beloved to the Most Merciful.", flower: { name: "Moonlight Blossom", emoji: "💮", rarity: "Epic" }, stage: 4 },
    { id: "la-hawla", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ", transliteration: "La hawla wa la quwwata illa billah", translation: "There is no power nor strength except with Allah", target: 100, virtue: "A treasure from the treasures of Paradise.", flower: { name: "Starlight Bloom", emoji: "🌟", rarity: "Legendary" }, stage: 5 }
  ],

  unlockStages: [
    { stage: 1, name: "Seedling", sessionsRequired: 0, description: "Begin with the three daily tasbihat." },
    { stage: 2, name: "Sprout", sessionsRequired: 5, description: "Unlock seeking forgiveness and reliance." },
    { stage: 3, name: "Blossom", sessionsRequired: 12, description: "Unlock the best dhikr and blessings on the Prophet ﷺ." },
    { stage: 4, name: "Gardener", sessionsRequired: 20, description: "Unlock the heavy-on-the-Scale phrases." },
    { stage: 5, name: "Paradise", sessionsRequired: 25, description: "Unlock the treasure of Paradise." }
  ],

  dailyRhythm: {
    morning: DG_MORNING_ONLY.concat(DG_SHARED),
    evening: DG_MORNING_ONLY.concat(DG_SHARED, DG_EVENING_ONLY)
  },

  milestones: {
    perDhikr: [100, 500, 1000],
    tierRarity: { "100": "Common", "500": "Uncommon", "1000": "Rare" },
    flowers: {
      "subhanallah": dgMilestoneSet("Sunflower", "🌻"),
      "alhamdulillah": dgMilestoneSet("Rose", "🌹"),
      "allahu-akbar": dgMilestoneSet("Tulip", "🌷"),
      "astaghfirullah": dgMilestoneSet("Daisy", "🌼"),
      "hasbunallah": dgMilestoneSet("Golden Wheat", "🌾"),
      "tahlil": dgMilestoneSet("Cherry Blossom", "🌸"),
      "salawat": dgMilestoneSet("Hibiscus", "🌺"),
      "subhanallahi-wa-bihamdihi": dgMilestoneSet("Lotus", "🪷"),
      "subhanallahil-azim": dgMilestoneSet("Moonlight Blossom", "💮"),
      "la-hawla": dgMilestoneSet("Starlight Bloom", "🌟")
    },
    goldenVariants: {
      "subhanallah": { name: "Golden Sunflower", emoji: "🌻" },
      "alhamdulillah": { name: "Golden Rose", emoji: "🌹" },
      "allahu-akbar": { name: "Golden Tulip", emoji: "🌷" },
      "astaghfirullah": { name: "Golden Daisy", emoji: "🌼" },
      "hasbunallah": { name: "Golden Wheat", emoji: "🌾" },
      "tahlil": { name: "Golden Cherry Blossom", emoji: "🌸" },
      "salawat": { name: "Golden Hibiscus", emoji: "🌺" },
      "subhanallahi-wa-bihamdihi": { name: "Golden Lotus", emoji: "🪷" },
      "subhanallahil-azim": { name: "Golden Moonlight Blossom", emoji: "💮" },
      "la-hawla": { name: "Golden Starlight Bloom", emoji: "🌟" }
    },
    specials: [
      {
        id: "celestial-orchid",
        name: "Celestial Orchid",
        emoji: "🌺",
        rarity: "Exotic",
        dhikrId: "tahlil",
        threshold: 10000,
        kind: "cumulative",
        description: "Awarded for 10,000 La ilaha illa Allah in total."
      },
      {
        id: "twin-constellation",
        name: "Twin Constellation Bloom",
        emoji: "✨",
        rarity: "Mythic",
        dhikrId: "tahlil",
        threshold: 70000,
        kind: "cumulative",
        description: "Twice as rare as the Celestial Orchid: 70,000 La ilaha illa Allah in total."
      }
    ],
    secret: {
      id: "diamond-desert-rose",
      name: "Diamond Desert Rose",
      emoji: "💎",
      rarity: "Diamond",
      threshold: 1000000,
      kind: "lifetime",
      hidden: true,
      description: "A desert rose made of diamond. Revealed only when lifetime dhikr reaches 1,000,000."
    }
  },

  learningPath: [
    {
      stage: 1,
      title: "The Seedling Path",
      description: "Begin with the three daily tasbihat — the short phrases recited after each prayer and throughout the day.",
      dhikrIds: ["subhanallah", "alhamdulillah", "allahu-akbar"]
    },
    {
      stage: 2,
      title: "The Sprout Path",
      description: "Add seeking forgiveness and reliance on Allah: the words of the believers in times of hardship.",
      dhikrIds: ["astaghfirullah", "hasbunallah"]
    },
    {
      stage: 3,
      title: "The Blossom Path",
      description: "Unlock the best dhikr of all, and blessings upon the Prophet ﷺ.",
      dhikrIds: ["tahlil", "salawat"]
    },
    {
      stage: 4,
      title: "The Gardener Path",
      description: "Unlock the phrases that are light on the tongue and heavy on the Scale.",
      dhikrIds: ["subhanallahi-wa-bihamdihi", "subhanallahil-azim"]
    },
    {
      stage: 5,
      title: "The Paradise Path",
      description: "Unlock the treasure of Paradise.",
      dhikrIds: ["la-hawla"]
    }
  ],

  articles: [
    {
      id: "benefits-of-remembering-allah",
      title: "The Benefits of Remembering Allah",
      description: "An article on what remembrance is, its types and their ranks, the best forms of seeking forgiveness, and how to count your remembrances.",
      url: "https://www.aicp.org/index.php/islamic-information/text/english/74-the-benefits-of-remembering-allah",
      embed: true
    },
    {
      id: "eid-takbir",
      title: "The Takbir of Eid",
      description: "The full Eid takbir with transliteration and an explanation of its meanings.",
      url: "https://www.aicp.org/index.php/islamic-information/text/english/70-takbirat-of-id",
      embed: true
    },
    {
      id: "how-to-pray-eid-prayer",
      title: "How to Pray the Eid Prayer",
      description: "A step-by-step guide to the Eid prayer, including the extra takbirs and the words said between them.",
      url: "https://aicp.org/index.php/islamic-information/text/english/46-how-to-pray-the-id-prayer",
      embed: true
    },
    {
      id: "ramadan-has-returned",
      title: "Ramadan Has Returned",
      description: "The remembrances taught for Ramadan: a morning and evening protection said three times, what to say at iftar, and a du'a before sleep.",
      url: "https://www.aicp.org/index.php/islamic-information/text/english/59-ramadan-has-returned",
      embed: true
    },
    {
      id: "awrad-al-tahsin-audio",
      title: "Morning & Evening Protection Remembrances (Audio)",
      description: "Audio recitation of the morning and evening remembrances of protection.",
      url: "https://www.aicp.org/index.php/islamic-information/audio/2015-06-04-14-18-23/558-2015-09-27-15-26-58",
      embed: true
    },
    {
      id: "glossary",
      title: "Glossary of Islamic Terms",
      description: "Definitions of dhikr vocabulary such as tasbih, tahmid, takbir, and tahlil.",
      url: "https://aicp.org/index.php/islamic-information/text/english/541-glossary",
      embed: true
    }
  ],

  studySections: [
    {
      id: "counting",
      title: "How to count your dhikr",
      body: "It is better to count dhikr with the fingers — the Prophet ﷺ counted tasbih on his right hand. Prayer beads are permissible."
    },
    {
      id: "pace",
      title: "A calm pace",
      body: "Scholars measure stillness in prayer by the time it takes to say 'subhanallah' once — let each utterance be unhurried."
    },
    {
      id: "eid-takbir",
      title: "The Eid takbir",
      body: "Full Eid takbir text with meanings: 'Allahu akbaru kabira, wal-hamdu lillahi kathira, wa subhanallahi wa bihamdihi bukrataw wa asila' — Allah is Great; all praise is due to Allah; glory be to Allah and praise Him morning and evening."
    },
    {
      id: "iftar-bedtime",
      title: "Iftar and bedtime remembrances",
      body: "At iftar: 'Allahumma laka sumtu wa 'ala rizqika aftartu' (اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ) — O Allah, for You I fasted and with Your provision I break my fast; then: 'dhahabadh-dhama'u wabtallatil-'uruqu wathabatal-ajru in sha' Allah' (ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللهُ) — thirst is gone, the veins are moistened, and the reward is assured, if Allah wills. Before sleep: 'Allahumma bismika amutu wa ahya' (اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا) — O Allah, by Your name I die and I live."
    }
  ],

  seasons: [
    {
      id: "ramadan",
      name: "Ramadan",
      hijriMonth: 9,
      description: "The month of fasting; the garden glows at night.",
      theme: { sky1: "#0b1d3a", sky2: "#1c2f55", accent: "#f5c86b" }
    },
    {
      id: "eid-fitr",
      name: "Eid al-Fitr",
      hijriMonth: 10,
      hijriDay: 1,
      description: "The festival of breaking the fast; the garden celebrates.",
      theme: { sky1: "#eaf7ff", sky2: "#fff3d6", accent: "#f2b632" }
    },
    {
      id: "dhul-hijjah",
      name: "Dhul-Hijjah",
      hijriMonth: 12,
      description: "The ten best days; the garden is at its most radiant.",
      theme: { sky1: "#1a1033", sky2: "#3b1f5e", accent: "#ffd166" }
    },
    {
      id: "eid-adha",
      name: "Eid al-Adha",
      hijriMonth: 12,
      hijriDay: 10,
      description: "The festival of sacrifice; the garden shines in warm gold.",
      theme: { sky1: "#fdf0e6", sky2: "#ffe3c2", accent: "#e07b39" }
    },
    {
      id: "muharram",
      name: "Muharram",
      hijriMonth: 1,
      description: "The new Hijri year.",
      theme: { sky1: "#10151f", sky2: "#243040", accent: "#c9d6e3" }
    },
    {
      id: "default",
      name: "Everyday Garden",
      description: "The garden in its everyday calm.",
      theme: { sky1: "#bfe3ff", sky2: "#eafaf1", accent: "#4caf50" }
    }
  ],

  gettingStarted: [
    {
      title: "Choose a remembrance",
      body: "Pick a dhikr from the Practice page and tap to count each repetition."
    },
    {
      title: "Complete counts to plant flowers",
      body: "Finishing a dhikr's target count plants its flower in your garden and moves you along the learning path."
    },
    {
      title: "Check Daily Rhythm",
      body: "Work through the morning and evening remembrances each day to keep your garden thriving."
    },
    {
      title: "Discover milestones",
      body: "Reach 100, 500, and 1,000 repetitions — in total and in a single sitting — to bloom rare flowers and grow your Herbarium collection."
    }
  ]
};
