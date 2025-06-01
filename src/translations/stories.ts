import { Language } from '@/utils/i18n'

interface Story {
  name: string
  slug: string
  description: string
}

// Story translations by language
const STORY_TRANSLATIONS: Record<Language, Story[]> = {
  // French (original)
  fr: [
    {
      name: 'Crétacé Sup',
      slug: 'cretace',
      description: "Découvrez l'univers fascinant des pectinidés!",
    },
    {
      name: 'Montpellier Médiéval',
      slug: 'montpellier',
      description: 'Explorez la vie médiévale à Montpellier au 10ème siècle!',
    },
    {
      name: 'The Truman Show',
      slug: 'truman',
      description: 'Découvrez le monde réel pour la première fois après une vie dans une émission de télé!',
    },
    {
      name: 'À Kingston Town',
      slug: 'kingston',
      description: "Vous descendez de l'avion à l'aéroport Palisadoes de Kingston, 1957",
    },
    {
      name: "La Promesse de l'Océan",
      slug: 'sailing',
      description: 'Dirigez une expédition de restauration corallienne à bord d\'un voilier de recherche dans les Caraïbes!',
    },
  ],

  // English
  en: [
    {
      name: 'Cretaceous Era',
      slug: 'cretace',
      description: 'Discover the fascinating world of scallops!',
    },
    {
      name: 'Medieval Montpellier',
      slug: 'montpellier',
      description: 'Explore medieval life in 10th century Montpellier!',
    },
    {
      name: 'The Truman Show',
      slug: 'truman',
      description: 'Experience the real world for the first time after a lifetime in a TV show!',
    },
    {
      name: 'In Kingston Town',
      slug: 'kingston',
      description: "You step off the plane at Kingston's Palisadoes Airport, 1957",
    },
    {
      name: "Ocean's Promise",
      slug: 'sailing',
      description: 'Lead a coral restoration expedition aboard a research sailing vessel in the Caribbean!',
    },
  ],

  // Chinese (Mandarin)
  zh: [
    {
      name: '白垩纪时代',
      slug: 'cretace',
      description: '探索扇贝的迷人世界！',
    },
    {
      name: '中世纪蒙彼利埃',
      slug: 'montpellier',
      description: '探索10世纪蒙彼利埃的中世纪生活！',
    },
    {
      name: '楚门的世界',
      slug: 'truman',
      description: '在电视节目中生活一辈子后，第一次体验真实世界！',
    },
    {
      name: '在金斯敦镇',
      slug: 'kingston',
      description: '您从金斯敦帕利萨多斯机场走下飞机，1957年',
    },
    {
      name: '海洋之约',
      slug: 'sailing',
      description: '在加勒比海研究帆船上领导珊瑚修复探险！',
    },
  ],

  // Hindi
  hi: [
    {
      name: 'क्रेटेशियस युग',
      slug: 'cretace',
      description: 'स्कैलप्स की रोमांचक दुनिया की खोज करें!',
    },
    {
      name: 'मध्यकालीन मोंपेलियर',
      slug: 'montpellier',
      description: '10वीं सदी के मोंपेलियर में मध्यकालीन जीवन का अन्वेषण करें!',
    },
    {
      name: 'द ट्रूमैन शो',
      slug: 'truman',
      description: 'टीवी शो में जीवन भर बिताने के बाद पहली बार वास्तविक दुनिया का अनुभव करें!',
    },
    {
      name: 'किंग्स्टन टाउन में',
      slug: 'kingston',
      description: 'आप किंग्स्टन के पैलिसाडोस हवाई अड्डे से उतरते हैं, 1957',
    },
    {
      name: 'समुद्र का वादा',
      slug: 'sailing',
      description: 'कैरिबियन में एक अनुसंधान नौकायन पोत पर कोरल बहाली अभियान का नेतृत्व करें!',
    },
  ],

  // Spanish
  es: [
    {
      name: 'Era Cretácica',
      slug: 'cretace',
      description: '¡Descubre el fascinante mundo de las vieiras!',
    },
    {
      name: 'Montpellier Medieval',
      slug: 'montpellier',
      description: '¡Explora la vida medieval en Montpellier del siglo X!',
    },
    {
      name: 'El Show de Truman',
      slug: 'truman',
      description: '¡Experimenta el mundo real por primera vez después de toda una vida en un programa de TV!',
    },
    {
      name: 'En Kingston Town',
      slug: 'kingston',
      description: 'Bajas del avión en el Aeropuerto Palisadoes de Kingston, 1957',
    },
    {
      name: 'La Promesa del Océano',
      slug: 'sailing',
      description: '¡Lidera una expedición de restauración de corales a bordo de un velero de investigación en el Caribe!',
    },
  ],

  // Arabic
  ar: [
    {
      name: 'العصر الطباشيري',
      slug: 'cretace',
      description: 'اكتشف العالم الرائع للمحار!',
    },
    {
      name: 'مونبلييه القروسطية',
      slug: 'montpellier',
      description: 'استكشف الحياة في القرون الوسطى في مونبلييه في القرن العاشر!',
    },
    {
      name: 'عرض ترومان',
      slug: 'truman',
      description: 'اختبر العالم الحقيقي لأول مرة بعد قضاء العمر كله في برنامج تلفزيوني!',
    },
    {
      name: 'في مدينة كينغستون',
      slug: 'kingston',
      description: 'تنزل من الطائرة في مطار باليساديس بكينغستون، 1957',
    },
    {
      name: 'وعد المحيط',
      slug: 'sailing',
      description: 'قد بعثة ترميم الشعاب المرجانية على متن سفينة شراعية للأبحاث في الكاريبي!',
    },
  ],

  // Bengali
  bn: [
    {
      name: 'ক্রিটেসিয়াস যুগ',
      slug: 'cretace',
      description: 'স্ক্যালপের আকর্ষণীয় জগৎ আবিষ্কার করুন!',
    },
    {
      name: 'মধ্যযুগীয় মঁপেলিয়ে',
      slug: 'montpellier',
      description: '১০ম শতাব্দীর মঁপেলিয়েতে মধ্যযুগীয় জীবন অন্বেষণ করুন!',
    },
    {
      name: 'দ্য ট্রুম্যান শো',
      slug: 'truman',
      description: 'টিভি শোতে সারাজীবন কাটানোর পর প্রথমবার বাস্তব জগতের অভিজ্ঞতা নিন!',
    },
    {
      name: 'কিংস্টন টাউনে',
      slug: 'kingston',
      description: 'আপনি কিংস্টনের প্যালিসাডোস বিমানবন্দর থেকে নামছেন, ১৯৫৭',
    },
    {
      name: 'সমুদ্রের প্রতিশ্রুতি',
      slug: 'sailing',
      description: 'ক্যারিবিয়ানে একটি গবেষণা নৌকায় প্রবাল পুনরুদ্ধার অভিযানের নেতৃত্ব দিন!',
    },
  ],

  // Russian
  ru: [
    {
      name: 'Меловой период',
      slug: 'cretace',
      description: 'Откройте для себя удивительный мир морских гребешков!',
    },
    {
      name: 'Средневековый Монпелье',
      slug: 'montpellier',
      description: 'Исследуйте средневековую жизнь в Монпелье 10 века!',
    },
    {
      name: 'Шоу Трумана',
      slug: 'truman',
      description: 'Впервые познайте реальный мир после целой жизни в телешоу!',
    },
    {
      name: 'В городе Кингстон',
      slug: 'kingston',
      description: 'Вы выходите из самолета в аэропорту Палисадос в Кингстоне, 1957 год',
    },
    {
      name: 'Обещание океана',
      slug: 'sailing',
      description: 'Возглавьте экспедицию по восстановлению кораллов на исследовательском паруснике в Карибском море!',
    },
  ],

  // Portuguese
  pt: [
    {
      name: 'Era Cretácea',
      slug: 'cretace',
      description: 'Descubra o fascinante mundo das vieiras!',
    },
    {
      name: 'Montpellier Medieval',
      slug: 'montpellier',
      description: 'Explore a vida medieval em Montpellier do século X!',
    },
    {
      name: 'O Show de Truman',
      slug: 'truman',
      description: 'Experimente o mundo real pela primeira vez após uma vida inteira num programa de TV!',
    },
    {
      name: 'Em Kingston Town',
      slug: 'kingston',
      description: 'Você desce do avião no Aeroporto Palisadoes de Kingston, 1957',
    },
    {
      name: 'Promessa do Oceano',
      slug: 'sailing',
      description: 'Lidere uma expedição de restauração de corais a bordo de um veleiro de pesquisa no Caribe!',
    },
  ],

  // Urdu
  ur: [
    {
      name: 'کریٹیسیس دور',
      slug: 'cretace',
      description: 'سکیلپس کی دلکش دنیا دریافت کریں!',
    },
    {
      name: 'قرون وسطیٰ کا مونپیلیے',
      slug: 'montpellier',
      description: '10ویں صدی میں مونپیلیے کی قرون وسطیٰ کی زندگی کو دریافت کریں!',
    },
    {
      name: 'ٹرومین شو',
      slug: 'truman',
      description: 'ٹی وی شو میں زندگی بھر گزارنے کے بعد پہلی بار حقیقی دنیا کا تجربہ کریں!',
    },
    {
      name: 'کنگسٹن ٹاؤن میں',
      slug: 'kingston',
      description: 'آپ کنگسٹن کے پیلیساڈوس ایئرپورٹ سے اترتے ہیں، 1957',
    },
    {
      name: 'سمندر کا وعدہ',
      slug: 'sailing',
      description: 'کیریبین میں تحقیقی بادبانی جہاز پر مرجانی بحالی مہم کی قیادت کریں!',
    },
  ],
}

// Function to get stories for current language
export function getFeaturedStories(language: Language): Story[] {
  return STORY_TRANSLATIONS[language] || STORY_TRANSLATIONS.fr // Fallback to French
}

// Export for backward compatibility
export const FEATURED_STORIES = STORY_TRANSLATIONS.fr