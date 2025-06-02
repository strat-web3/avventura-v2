const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')

    envLines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          process.env[key] = value
        }
      }
    })

    console.log('✅ Loaded environment variables from .env')
  } else {
    console.warn('⚠️  No .env file found')
  }
}

loadEnv()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

// Homepage display translations for all languages
const HOMEPAGE_TRANSLATIONS = {
  montpellier: {
    fr: {
      title: 'Montpellier Médiéval',
      description: 'Explorez la vie médiévale à Montpellier au 10ème siècle!',
    },
    en: {
      title: 'Medieval Montpellier',
      description: 'Explore medieval life in 10th century Montpellier!',
    },
    zh: {
      title: '中世纪蒙彼利埃',
      description: '探索10世纪蒙彼利埃的中世纪生活！',
    },
    hi: {
      title: 'मध्यकालीन मोंपेलियर',
      description: '10वीं सदी के मोंपेलियर में मध्यकालीन जीवन का अन्वेषण करें!',
    },
    es: {
      title: 'Montpellier Medieval',
      description: '¡Explora la vida medieval en Montpellier del siglo X!',
    },
    ar: {
      title: 'مونبلييه القروسطية',
      description: 'استكشف الحياة في القرون الوسطى في مونبلييه في القرن العاشر!',
    },
    bn: {
      title: 'মধ্যযুগীয় মঁপেলিয়ে',
      description: '১০ম শতাব্দীর মঁপেলিয়েতে মধ্যযুগীয় জীবন অন্বেষণ করুন!',
    },
    ru: {
      title: 'Средневековый Монпелье',
      description: 'Исследуйте средневековую жизнь в Монпелье 10 века!',
    },
    pt: {
      title: 'Montpellier Medieval',
      description: 'Explore a vida medieval em Montpellier do século X!',
    },
    ur: {
      title: 'قرون وسطیٰ کا مونپیلیے',
      description: '10ویں صدی میں مونپیلیے کی قرون وسطیٰ کی زندگی کو دریافت کریں!',
    },
  },
  cretace: {
    fr: {
      title: 'Crétacé Sup',
      description: "Découvrez l'univers fascinant des pectinidés!",
    },
    en: {
      title: 'Cretaceous Era',
      description: 'Discover the fascinating world of scallops!',
    },
    zh: {
      title: '白垩纪时代',
      description: '探索扇贝的迷人世界！',
    },
    hi: {
      title: 'क्रेटेशियस युग',
      description: 'स्कैलप्स की रोमांचक दुनिया की खोज करें!',
    },
    es: {
      title: 'Era Cretácica',
      description: '¡Descubre el fascinante mundo de las vieiras!',
    },
    ar: {
      title: 'العصر الطباشيري',
      description: 'اكتشف العالم الرائع للمحار!',
    },
    bn: {
      title: 'ক্রিটেসিয়াস যুগ',
      description: 'স্ক্যালপের আকর্ষণীয় জগৎ আবিষ্কার করুন!',
    },
    ru: {
      title: 'Меловой период',
      description: 'Откройте для себя удивительный мир морских гребешков!',
    },
    pt: {
      title: 'Era Cretácea',
      description: 'Descubra o fascinante mundo das vieiras!',
    },
    ur: {
      title: 'کریٹیسیس دور',
      description: 'سکیلپس کی دلکش دنیا دریافت کریں!',
    },
  },
  truman: {
    fr: {
      title: 'The Truman Show',
      description:
        'Découvrez le monde réel pour la première fois après une vie dans une émission de télé!',
    },
    en: {
      title: 'The Truman Show',
      description: 'Experience the real world for the first time after a lifetime in a TV show!',
    },
    zh: {
      title: '楚门的世界',
      description: '在电视节目中生活一辈子后，第一次体验真实世界！',
    },
    hi: {
      title: 'द ट्रूमैन शो',
      description: 'टीवी शो में जीवन भर बिताने के बाद पहली बार वास्तविक दुनिया का अनुभव करें!',
    },
    es: {
      title: 'El Show de Truman',
      description:
        '¡Experimenta el mundo real por primera vez después de toda una vida en un programa de TV!',
    },
    ar: {
      title: 'عرض ترومان',
      description: 'اختبر العالم الحقيقي لأول مرة بعد قضاء العمر كله في برنامج تلفزيوني!',
    },
    bn: {
      title: 'দ্য ট্রুম্যান শো',
      description: 'টিভি শোতে সারাজীবন কাটানোর পর প্রথমবার বাস্তব জগতের অভিজ্ঞতা নিন!',
    },
    ru: {
      title: 'Шоу Трумана',
      description: 'Впервые познайте реальный мир после целой жизни в телешоу!',
    },
    pt: {
      title: 'O Show de Truman',
      description:
        'Experimente o mundo real pela primeira vez após uma vida inteira num programa de TV!',
    },
    ur: {
      title: 'ٹرومین شو',
      description: 'ٹی وی شو میں زندگی بھر گزارنے کے بعد پہلی بار حقیقی دنیا کا تجربہ کریں!',
    },
  },
  kingston: {
    fr: {
      title: 'À Kingston Town',
      description: "Vous descendez de l'avion à l'aéroport Palisadoes de Kingston, 1957",
    },
    en: {
      title: 'In Kingston Town',
      description: "You step off the plane at Kingston's Palisadoes Airport, 1957",
    },
    zh: {
      title: '在金斯敦镇',
      description: '您从金斯敦帕利萨多斯机场走下飞机，1957年',
    },
    hi: {
      title: 'किंग्स्टन टाउन में',
      description: 'आप किंग्स्टन के पैलिसाडोस हवाई अड्डे से उतरते हैं, 1957',
    },
    es: {
      title: 'En Kingston Town',
      description: 'Bajas del avión en el Aeropuerto Palisadoes de Kingston, 1957',
    },
    ar: {
      title: 'في مدينة كينغستون',
      description: 'تنزل من الطائرة في مطار باليساديس بكينغستون، 1957',
    },
    bn: {
      title: 'কিংস্টন টাউনে',
      description: 'আপনি কিংস্টনের প্যালিসাডোস বিমানবন্দর থেকে নামছেন, ১৯৫৭',
    },
    ru: {
      title: 'В городе Кингстон',
      description: 'Вы выходите из самолета в аэропорту Палисадос в Кингстоне, 1957 год',
    },
    pt: {
      title: 'Em Kingston Town',
      description: 'Você desce do avião no Aeroporto Palisadoes de Kingston, 1957',
    },
    ur: {
      title: 'کنگسٹن ٹاؤن میں',
      description: 'آپ کنگسٹن کے پیلیساڈوس ایئرپورٹ سے اترتے ہیں، 1957',
    },
  },
  sailing: {
    fr: {
      title: "La Promesse de l'Océan",
      description:
        "Dirigez une expédition de restauration corallienne à bord d'un voilier de recherche dans les Caraïbes!",
    },
    en: {
      title: "Ocean's Promise",
      description:
        'Lead a coral restoration expedition aboard a research sailing vessel in the Caribbean!',
    },
    zh: {
      title: '海洋之约',
      description: '在加勒比海研究帆船上领导珊瑚修复探险！',
    },
    hi: {
      title: 'समुद्र का वादा',
      description: 'कैरिबियन में एक अनुसंधान नौकायन पोत पर कोरल बहाली अभियान का नेतृत्व करें!',
    },
    es: {
      title: 'La Promesa del Océano',
      description:
        '¡Lidera una expedición de restauración de corales a bordo de un velero de investigación en el Caribe!',
    },
    ar: {
      title: 'وعد المحيط',
      description: 'قد بعثة ترميم الشعاب المرجانية على متن سفينة شراعية للأبحاث في الكاريبي!',
    },
    bn: {
      title: 'সমুদ্রের প্রতিশ্রুতি',
      description: 'ক্যারিবিয়ানে একটি গবেষণা নৌকায় প্রবাল পুনরুদ্ধার অভিযানের নেতৃত্ব দিন!',
    },
    ru: {
      title: 'Обещание океана',
      description:
        'Возглавьте экспедицию по восстановлению кораллов на исследовательском паруснике в Карибском море!',
    },
    pt: {
      title: 'Promessa do Oceano',
      description:
        'Lidere uma expedição de restauração de corais a bordo de um veleiro de pesquisa no Caribe!',
    },
    ur: {
      title: 'سمندر کا وعدہ',
      description: 'کیریبین میں تحقیقی بادبانی جہاز پر مرجانی بحالی مہم کی قیادت کریں!',
    },
  },
}

// Story files with their default titles
const stories = [
  {
    slug: 'montpellier',
    title: 'Medieval Montpellier',
    filename: 'montpellier.md',
  },
  {
    slug: 'cretace',
    title: 'Cretaceous Era',
    filename: 'cretace.md',
  },
  {
    slug: 'truman',
    title: 'The Truman Show',
    filename: 'truman.md',
  },
  {
    slug: 'kingston',
    title: 'In Kingston Town',
    filename: 'kingston.md',
  },
  {
    slug: 'sailing',
    title: "Ocean's Promise",
    filename: 'sailing.md',
  },
]

async function migrateStories() {
  console.log('🚀 Starting single-entry story migration with JSON homepage_display...')
  console.log('📝 Each story will have ONE entry with multilingual homepage data in JSON column')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.log('📝 Please ensure your .env file contains:')
    console.log('   DATABASE_URL=postgresql://username:password@host/database?sslmode=require')
    console.log('💡 Or run with: DATABASE_URL="your_url" pnpm run db:migrate')
    process.exit(1)
  }

  console.log('🔗 Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'))

  try {
    // Test database connection
    console.log('🔌 Testing database connection...')
    await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful')

    // Drop and recreate table with single entry schema
    console.log('🔄 Setting up database schema for single entry with JSON homepage_display...')

    await pool.query('DROP TABLE IF EXISTS stories')

    await pool.query(`
      CREATE TABLE stories (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        homepage_display JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      )
    `)

    // Create indexes for better performance
    await pool.query('CREATE INDEX idx_stories_slug ON stories(slug)')
    await pool.query('CREATE INDEX idx_stories_active ON stories(is_active)')
    await pool.query(
      'CREATE INDEX idx_stories_homepage_display ON stories USING GIN (homepage_display)'
    )

    console.log('✅ Database schema created for single entry stories')

    // Check which story files exist
    console.log('📁 Checking story files...')
    const availableStories = []

    for (const story of stories) {
      const filePath = path.join(process.cwd(), 'public', story.filename)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        availableStories.push({ ...story, content })
        console.log(`✅ Found: ${story.filename}`)
      } else {
        console.log(`❌ Missing: ${story.filename}`)
      }
    }

    if (availableStories.length === 0) {
      console.error('❌ No story files found! Please check your public/ directory.')
      process.exit(1)
    }

    console.log(
      `\n📚 Migrating ${availableStories.length} stories with multilingual homepage data...`
    )

    // Insert stories with homepage_display JSON
    let totalInserted = 0

    for (const story of availableStories) {
      console.log(`\n📖 Processing: ${story.slug}`)

      try {
        // Get homepage display data for this story
        const homepageDisplay = HOMEPAGE_TRANSLATIONS[story.slug]

        if (!homepageDisplay) {
          console.log(`⚠️  No homepage translations found for ${story.slug}, skipping...`)
          continue
        }

        const query = `
          INSERT INTO stories (slug, title, content, homepage_display, is_active)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (slug) 
          DO UPDATE SET 
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            homepage_display = EXCLUDED.homepage_display,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
          RETURNING id
        `

        const result = await pool.query(query, [
          story.slug,
          story.title,
          story.content,
          JSON.stringify(homepageDisplay),
          true,
        ])

        totalInserted++
        console.log(`✅ Migrated: ${story.title} (ID: ${result.rows[0].id})`)

        // Show some sample translations
        const sampleLangs = ['fr', 'en', 'zh']
        console.log(`   📄 Sample titles:`)
        sampleLangs.forEach(lang => {
          if (homepageDisplay[lang]) {
            console.log(`      ${lang}: "${homepageDisplay[lang].title}"`)
          }
        })
      } catch (error) {
        console.error(`❌ Failed to insert ${story.slug}:`, error.message)
      }
    }

    // Display migration summary
    console.log(`\n🎉 Single-entry migration complete!`)
    console.log(`📊 Total stories created: ${totalInserted}`)

    // Get detailed statistics
    const statsResult = await pool.query(
      'SELECT COUNT(*) as total FROM stories WHERE is_active = true'
    )
    const totalStories = statsResult.rows[0].total

    console.log(`📈 Database Statistics:`)
    console.log(`   - Total stories: ${totalStories}`)
    console.log(`   - Languages per story: 10 (in JSON)`)
    console.log(`   - Schema: Single entry per story`)

    // Show all stories with sample data
    const allStories = await pool.query(`
      SELECT slug, title, homepage_display 
      FROM stories 
      WHERE is_active = true 
      ORDER BY slug
    `)

    console.log(`\n📚 Stories in database:`)
    allStories.rows.forEach((story, index) => {
      console.log(`${index + 1}. ${story.slug}: "${story.title}"`)

      // Show French and English titles as examples
      const homepage = story.homepage_display
      if (homepage.fr && homepage.en) {
        console.log(`     FR: "${homepage.fr.title}"`)
        console.log(`     EN: "${homepage.en.title}"`)
      }
    })

    // Test JSON querying
    console.log(`\n🧪 Testing JSON queries:`)

    // Test getting French titles
    const frenchTitles = await pool.query(`
      SELECT slug, homepage_display->>'fr' as french_data
      FROM stories 
      WHERE is_active = true 
      LIMIT 3
    `)

    console.log(`   French homepage data samples:`)
    frenchTitles.rows.forEach(row => {
      if (row.french_data) {
        const frData = JSON.parse(row.french_data)
        console.log(`     ${row.slug}: "${frData.title}"`)
      }
    })

    console.log('\n🚀 Next steps:')
    console.log('1. Update your application code to use the single-entry database')
    console.log('2. Test with: pnpm dev')
    console.log('3. Check health: curl http://localhost:3000/api/health')
    console.log('4. List stories: curl http://localhost:3000/api/admin/stories')
    console.log('5. Test homepage in different languages to see localized titles!')
    console.log('6. Language detection works as before - browser language → manual selection')
  } catch (error) {
    console.error('❌ Migration failed:', error)

    if (error.code === 'ENOTFOUND') {
      console.log('💡 This looks like a DNS/connection issue. Check your DATABASE_URL.')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused. Check if your Neon database is running.')
    } else if (error.message.includes('password authentication failed')) {
      console.log('💡 Authentication failed. Check your username/password in DATABASE_URL.')
    }

    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateStories().catch(console.error)
}

module.exports = { migrateStories }
