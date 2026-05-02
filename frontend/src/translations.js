// translations.js — single source of truth for all UI text
// Usage: import { T, EXAMPLES, DID_YOU_KNOW_AR } from './translations';

export const T = {
  en: {
    // Nav
    nav: {
      brand: 'مرآة ✦ Mirror',
      reflect: 'Reflect',
      journal: 'Journal',
      toggle: 'العربية',
    },

    // Home
    home: {
      eyebrow: 'Quran Life Mirror',
      h1a: "What's weighing on",
      h1b: 'your heart today?',
      subtitle: 'Describe your situation or emotion and discover Quranic verses that speak directly to where you are right now.',
      label: "Share what you're going through",
      placeholder: "e.g. I feel overwhelmed and like nothing I do is ever enough. I'm exhausted trying to keep up with everything...",
      btn: 'Find Verses ✦',
      btnLoading: 'Searching...',
      searching: "Searching the Quran for your heart's question...",
      found: (n) => `${n} verse${n > 1 ? 's' : ''} found for you`,
      errorShort: "Please share a bit more about what you're going through.",
      errorGeneral: 'Something went wrong. Please try again.',
      tip: 'Tip: Be specific about your feelings for better results. Cmd+Enter to search.',
      login: 'Login with Quran Foundation',
      logout: 'Logout',
      loggedIn: '✓ Logged in',
      loginLoading: '⏳ Logging in...',
      loginError: 'Could not initiate login: ',
    },

    // Journal
    journal: {
      eyebrow: 'Your Journal',
      h1a: 'Your Life, Mirrored',
      h1b: 'in the Quran',
      subtitle: "Every situation you've brought. Every verse that answered.",
      reflections: 'Reflections',
      versesDiscovered: 'Verses Discovered',
      dayJourney: 'Day Journey',
      empty: 'Your journal is empty. Go reflect on a situation to begin.',
      loading: 'Loading...',
      editNote: 'Edit your note...',
      saveNote: 'Save',
      cancel: 'Cancel',
      deleteConfirm: 'Remove this entry from your journal?',
      yourNote: 'Your Note',
      addNote: '+ Add personal note',
      edit: 'Edit',
      noNote: 'No personal note yet.',
      quranInsight: '📖 Quran Insight',
      journey: 'Your Journey',
      situation: 'Situation',
      reflection: 'Reflection',
      streakMsg: (n) =>
        n >= 7
          ? `🔥 ${n} day streak! MashaAllah!`
          : n >= 3
          ? `✨ ${n} days in a row`
          : `Day ${n} of your journey`,
      localData: '(Local data - not synced with account)',
      editingQF: 'Editing QF reflections not yet supported',
      saveError: 'Could not save note.',
      noDescription: 'No description',
    },

    // VerseCard (pass lang down and use these)
    card: {
      save: 'Save to Journal',
      saved: '✓ Saved',
      saving: 'Saving...',
      listen: 'Listen',
      pause: 'Pause',
      howFeeling: 'How are you feeling after this verse?',
      moods: ['grateful', 'hopeful', 'reflective', 'at peace', 'still struggling'],
      moodLabels: {
        grateful: 'Grateful',
        hopeful: 'Hopeful',
        reflective: 'Reflective',
        'at peace': 'At Peace',
        'still struggling': 'Still Struggling',
      },
    },
  },

  ar: {
    // Nav
    nav: {
      brand: 'مرآة القرآن ✦',
      reflect: 'تأمّل',
      journal: 'المذكّرة',
      toggle: 'English',
    },

    // Home
    home: {
      eyebrow: 'مرآة القرآن',
      h1a: 'ما الذي يثقل',
      h1b: 'قلبك اليوم؟',
      subtitle: 'صِف حالتك أو مشاعرك واكتشف آيات قرآنية تتحدث مباشرة إلى وضعك الآن.',
      label: 'شارك ما تمر به',
      placeholder: 'مثال: أشعر بالإرهاق ولا أستطيع مواكبة كل شيء...',
      btn: 'ابحث عن آيات ✦',
      btnLoading: 'جارٍ البحث...',
      searching: 'نبحث في القرآن عن سؤال قلبك...',
      found: (n) => `وجدنا لك ${n} آيات`,
      errorShort: 'يرجى مشاركة المزيد عن حالتك.',
      errorGeneral: 'حدث خطأ. يرجى المحاولة مجدداً.',
      tip: 'نصيحة: كن محدداً في مشاعرك للحصول على نتائج أفضل. Cmd+Enter للبحث.',
      login: 'تسجيل الدخول عبر مؤسسة القرآن',
      logout: 'تسجيل الخروج',
      loggedIn: '✓ مسجّل الدخول',
      loginLoading: '⏳ جارٍ التسجيل...',
      loginError: 'تعذّر بدء تسجيل الدخول: ',
    },

    // Journal
    journal: {
      eyebrow: 'مذكّرتك',
      h1a: 'حياتك تنعكس',
      h1b: 'في القرآن الكريم',
      subtitle: 'كل موقف شاركته. كل آية أجابت.',
      reflections: 'تأمّلات',
      versesDiscovered: 'آيات اكتُشفت',
      dayJourney: 'أيام الرحلة',
      empty: 'مذكّرتك فارغة. ابدأ بتأمّل موقف ما.',
      loading: 'جارٍ التحميل...',
      editNote: 'عدّل ملاحظتك...',
      saveNote: 'حفظ',
      cancel: 'إلغاء',
      deleteConfirm: 'هل تريد حذف هذا السجل؟',
      yourNote: 'ملاحظتك',
      addNote: '+ أضف ملاحظة شخصية',
      edit: 'تعديل',
      noNote: 'لا توجد ملاحظة شخصية بعد.',
      quranInsight: '📖 فائدة قرآنية',
      journey: 'رحلتك',
      situation: 'الموقف',
      reflection: 'التأمّل',
      streakMsg: (n) =>
        n >= 7
          ? `🔥 ${n} يوم متواصل! ما شاء الله!`
          : n >= 3
          ? `✨ ${n} أيام متتالية`
          : `اليوم ${n} من رحلتك`,
      localData: '(بيانات محلية - لم تتم المزامنة مع الحساب)',
      editingQF: 'تعديل تأملات مؤسسة القرآن غير مدعوم بعد',
      saveError: 'تعذّر حفظ الملاحظة.',
      noDescription: 'لا يوجد وصف',
    },

    // VerseCard
    card: {
      save: 'حفظ في المذكّرة',
      saved: '✓ تم الحفظ',
      saving: 'جارٍ الحفظ...',
      listen: 'استمع',
      pause: 'إيقاف',
      howFeeling: 'كيف تشعر بعد هذه الآية؟',
      moods: ['grateful', 'hopeful', 'reflective', 'at peace', 'still struggling'],
      moodLabels: {
        grateful: 'ممتنّ',
        hopeful: 'متفائل',
        reflective: 'متأمّل',
        'at peace': 'مطمئن',
        'still struggling': 'لا أزال أصارع',
      },
    },
  },
};

export const EXAMPLES = {
  en: [
    "I feel like I'm failing at everything I try",
    "I'm grieving the loss of someone I loved",
    "I'm anxious about my future and feel lost",
    "I feel alone even when surrounded by people",
    "I made a big mistake and feel ashamed",
    "I have no idea what my purpose is",
  ],
  ar: [
    'أشعر أنني أفشل في كل ما أفعله',
    'أنا في حزن عميق على فقدان شخص أحببته',
    'أشعر بالقلق من مستقبلي ولا أعرف طريقي',
    'أشعر بالوحدة حتى وسط الناس',
    'ارتكبت خطأً كبيراً وأشعر بالخجل',
    'لا أعرف ما هو هدفي في الحياة',
  ],
};

export const DID_YOU_KNOW = {
  en: {
    '94:5': 'This verse is repeated twice in a row — scholars say the repetition is deliberate: ease will come not just once, but again and again.',
    '2:286': 'The last verse of Al-Baqarah. The Prophet ﷺ said whoever recites it at night, it will suffice him.',
    '39:53': 'One of the most hope-filled verses in the Quran — revealed as a direct address to those who had sinned greatly.',
    '50:16': 'Allah says He is closer to you than your jugular vein — He knows every heartbeat, every thought.',
    '2:153': 'Sabr (patience) and Salah (prayer) together are a complete Quranic prescription for hardship.',
    '13:28': 'This verse — "in the remembrance of Allah do hearts find rest" — is recited by millions when anxious.',
    '93:3': 'Surah Ad-Duha was revealed during a period when the Prophet ﷺ was in deep distress.',
  },
  ar: {
    '94:5': 'هذه الآية تُكرَّر مرتين متتاليتين — يقول العلماء إن التكرار متعمّد: اليسر آتٍ مرةً بعد مرة.',
    '2:286': 'آخر آية في سورة البقرة. قال النبي ﷺ: من قرأها في ليلة كفَتْه.',
    '39:53': 'من أكثر الآيات إشراقاً بالأمل في القرآن — نزلت خطاباً مباشراً لمن أذنبوا كثيراً.',
    '50:16': 'يقول الله تعالى إنه أقرب إليك من حبل الوريد — يعلم كل نبضة، وكل خاطر.',
    '2:153': 'الصبر والصلاة معاً وصفة قرآنية كاملة لمواجهة الشدائد.',
    '13:28': 'هذه الآية — "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" — يرددها الملايين عند القلق.',
    '93:3': 'سورة الضحى نزلت في فترة كان النبي ﷺ يمرّ فيها بضيق شديد.',
  },
};