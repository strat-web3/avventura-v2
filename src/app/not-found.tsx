'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Box,
  HStack,
  useColorModeValue,
  Fade,
  ScaleFade,
} from '@chakra-ui/react'
import { FaHome, FaCompass, FaArrowLeft } from 'react-icons/fa'
import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'

const NotFound: React.FC = () => {
  const router = useRouter()
  const { language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Multilingual content
  const getContent = (lang: string) => {
    const content: Record<string, any> = {
      fr: {
        title: 'Aventure Introuvable',
        subtitle: '404 - Page Non Trouvée',
        message: "Oups ! Il semble que cette aventure n'existe pas encore.",
        description:
          'Peut-être avez-vous pris un mauvais tournant dans votre quête ? Ne vous inquiétez pas, tous les grands explorateurs se perdent parfois.',
        suggestions: 'Que souhaitez-vous faire ?',
        homeButton: 'Retour aux Aventures',
        backButton: 'Page Précédente',
        exploreButton: 'Créer une Aventure',
        quote: '"Tous ceux qui errent ne sont pas perdus." - J.R.R. Tolkien',
      },
      en: {
        title: 'Adventure Not Found',
        subtitle: '404 - Page Not Found',
        message: "Oops! It seems this adventure doesn't exist yet.",
        description:
          "Perhaps you took a wrong turn in your quest? Don't worry, all great explorers get lost sometimes.",
        suggestions: 'What would you like to do?',
        homeButton: 'Back to Adventures',
        backButton: 'Previous Page',
        exploreButton: 'Create Adventure',
        quote: '"Not all those who wander are lost." - J.R.R. Tolkien',
      },
      zh: {
        title: '冒险未找到',
        subtitle: '404 - 页面未找到',
        message: '哎呀！看起来这个冒险还不存在。',
        description: '也许您在探索中走错了路？别担心，所有伟大的探险家有时都会迷路。',
        suggestions: '您想做什么？',
        homeButton: '返回冒险',
        backButton: '上一页',
        exploreButton: '创建冒险',
        quote: '"并非所有漫游者都迷失了方向。" - J.R.R. 托尔金',
      },
      hi: {
        title: 'साहसिक यात्रा नहीं मिली',
        subtitle: '404 - पेज नहीं मिला',
        message: 'ओह! लगता है यह साहसिक यात्रा अभी तक मौजूद नहीं है।',
        description:
          'शायद आपने अपनी खोज में गलत रास्ता लिया है? चिंता न करें, सभी महान खोजकर्ता कभी-कभी खो जाते हैं।',
        suggestions: 'आप क्या करना चाहेंगे?',
        homeButton: 'साहसिक यात्राओं पर वापस',
        backButton: 'पिछला पेज',
        exploreButton: 'साहसिक यात्रा बनाएं',
        quote: '"जो भटकते हैं वे सभी खोए नहीं होते।" - जे.आर.आर. टॉल्किन',
      },
      es: {
        title: 'Aventura No Encontrada',
        subtitle: '404 - Página No Encontrada',
        message: '¡Ups! Parece que esta aventura aún no existe.',
        description:
          '¿Quizás tomaste un camino equivocado en tu búsqueda? No te preocupes, todos los grandes exploradores se pierden a veces.',
        suggestions: '¿Qué te gustaría hacer?',
        homeButton: 'Volver a las Aventuras',
        backButton: 'Página Anterior',
        exploreButton: 'Crear Aventura',
        quote: '"No todos los que vagan están perdidos." - J.R.R. Tolkien',
      },
      ar: {
        title: 'المغامرة غير موجودة',
        subtitle: '404 - الصفحة غير موجودة',
        message: 'عذراً! يبدو أن هذه المغامرة غير موجودة بعد.',
        description:
          'ربما اتخذت منعطفاً خاطئاً في مهمتك؟ لا تقلق، جميع المستكشفين العظماء يضيعون أحياناً.',
        suggestions: 'ماذا تود أن تفعل؟',
        homeButton: 'العودة إلى المغامرات',
        backButton: 'الصفحة السابقة',
        exploreButton: 'إنشاء مغامرة',
        quote: '"ليس كل من يتجول ضائع." - ج.ر.ر. تولكين',
      },
      bn: {
        title: 'অ্যাডভেঞ্চার পাওয়া যায়নি',
        subtitle: '404 - পেজ পাওয়া যায়নি',
        message: 'ওহো! মনে হচ্ছে এই অ্যাডভেঞ্চারটি এখনও বিদ্যমান নেই।',
        description:
          'হয়তো আপনি আপনার অনুসন্ধানে ভুল পথ নিয়েছেন? চিন্তা করবেন না, সমস্ত মহান অভিযাত্রী মাঝে মাঝে হারিয়ে যান।',
        suggestions: 'আপনি কি করতে চান?',
        homeButton: 'অ্যাডভেঞ্চারে ফিরে যান',
        backButton: 'আগের পেজ',
        exploreButton: 'অ্যাডভেঞ্চার তৈরি করুন',
        quote: '"যারা ঘুরে বেড়ায় তারা সবাই হারিয়ে যায় না।" - জে.আর.আর. টলকিন',
      },
      ru: {
        title: 'Приключение Не Найдено',
        subtitle: '404 - Страница Не Найдена',
        message: 'Упс! Похоже, это приключение еще не существует.',
        description:
          'Возможно, вы свернули не туда в своих поисках? Не волнуйтесь, все великие исследователи иногда теряются.',
        suggestions: 'Что бы вы хотели сделать?',
        homeButton: 'Вернуться к Приключениям',
        backButton: 'Предыдущая Страница',
        exploreButton: 'Создать Приключение',
        quote: '"Не все, кто блуждает, потеряны." - Дж.Р.Р. Толкин',
      },
      pt: {
        title: 'Aventura Não Encontrada',
        subtitle: '404 - Página Não Encontrada',
        message: 'Ops! Parece que esta aventura ainda não existe.',
        description:
          'Talvez você tenha pegado uma curva errada em sua busca? Não se preocupe, todos os grandes exploradores se perdem às vezes.',
        suggestions: 'O que você gostaria de fazer?',
        homeButton: 'Voltar às Aventuras',
        backButton: 'Página Anterior',
        exploreButton: 'Criar Aventura',
        quote: '"Nem todos os que vagueiam estão perdidos." - J.R.R. Tolkien',
      },
      ur: {
        title: 'ایڈونچر نہیں ملا',
        subtitle: '404 - صفحہ نہیں ملا',
        message: 'اوہ! لگتا ہے یہ ایڈونچر ابھی موجود نہیں ہے۔',
        description:
          'شاید آپ نے اپنی تلاش میں غلط موڑ لیا ہے؟ فکر نہ کریں، تمام عظیم مہم جو کبھی کبھی کھو جاتے ہیں۔',
        suggestions: 'آپ کیا کرنا چاہیں گے؟',
        homeButton: 'ایڈونچرز پر واپس',
        backButton: 'پچھلا صفحہ',
        exploreButton: 'ایڈونچر بنائیں',
        quote: '"جو بھٹکتے ہیں وہ سب کھوئے نہیں ہوتے۔" - جے.آر.آر. ٹولکین',
      },
    }

    return content[lang] || content.fr
  }

  const content = getContent(language)

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <Container maxW="container.md" py={10} minH="100vh" display="flex" alignItems="center">
      <Fade in={isVisible} style={{ width: '100%' }}>
        <VStack spacing={8} align="center" w="100%">
          {/* Animated 404 Image/Icon */}
          <ScaleFade in={isVisible} initialScale={0.8}>
            <Box position="relative">
              <Text
                fontSize={{ base: '6xl', md: '8xl' }}
                fontWeight="bold"
                color="blue.400"
                textAlign="center"
                opacity={0.3}
                userSelect="none"
              >
                404
              </Text>
              <FaCompass
                size="4rem"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#4299E1',
                  animation: 'spin 4s linear infinite',
                }}
              />
            </Box>
          </ScaleFade>

          {/* Main Content Card */}
          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={8}
            w="100%"
            textAlign="center"
            boxShadow="lg"
          >
            <VStack spacing={6}>
              <Heading as="h1" size="xl" color="blue.400" textAlign="center">
                {content.title}
              </Heading>

              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {content.subtitle}
              </Text>

              <Text fontSize="md" color="gray.600" maxW="md">
                {content.message}
              </Text>

              <Text fontSize="sm" color="gray.500" maxW="lg">
                {content.description}
              </Text>

              <Box
                p={4}
                bg={bgColor}
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="blue.400"
                w="100%"
              >
                <Text fontSize="sm" fontStyle="italic" color="gray.600">
                  {content.quote}
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <VStack spacing={4} w="100%">
            <Text fontSize="lg" fontWeight="medium" color="gray.600">
              {content.suggestions}
            </Text>

            <VStack spacing={3} w="100%" maxW="md">
              <Link href="/" style={{ width: '100%' }}>
                <Button leftIcon={<FaHome />} colorScheme="blue" size="lg" w="100%" variant="solid">
                  {content.homeButton}
                </Button>
              </Link>

              <HStack spacing={3} w="100%">
                <Button
                  leftIcon={<FaArrowLeft />}
                  colorScheme="gray"
                  variant="outline"
                  size="md"
                  onClick={handleGoBack}
                  flex={1}
                >
                  {content.backButton}
                </Button>

                <Link href="/create" style={{ flex: 1 }}>
                  <Button
                    leftIcon={<FaCompass />}
                    colorScheme="green"
                    variant="outline"
                    size="md"
                    w="100%"
                  >
                    {content.exploreButton}
                  </Button>
                </Link>
              </HStack>
            </VStack>
          </VStack>
        </VStack>
      </Fade>

      {/* CSS for compass spinning animation */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </Container>
  )
}

export default NotFound
