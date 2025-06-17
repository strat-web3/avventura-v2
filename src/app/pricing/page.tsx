'use client'

import React, { useState } from 'react'
import {
  Container,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Flex,
  Divider,
  List,
  ListItem,
  ListIcon,
  Heading,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Stack,
} from '@chakra-ui/react'
import {
  FaCheck,
  FaInfinity,
  FaUsers,
  FaChartLine,
  FaWallet,
  FaGraduationCap,
  FaHeart,
  FaStar,
  FaRocket,
  FaGem,
  FaCoffee,
  FaCogs,
} from 'react-icons/fa'
import Link from 'next/link'
import Header from '@/components/Header'

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false)

  // Theme colors
  const bgGradient = 'linear(to-br, #8c1c84, #45a2f8)'
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const highlightColor = '#8c1c84'
  const accentColor = '#45a2f8'

  const plans = {
    free: {
      name: 'Free Explorer',
      price: 0,
      description: 'Perfect for trying out adventure creation',
      features: ['Create 1 story', 'Basic templates', 'Community support', 'Public stories only'],
      limitations: ['Limited to 1 story', 'No analytics', 'Basic features only'],
      buttonText: 'Start Free',
      buttonVariant: 'outline' as const,
      popular: false,
    },
    creator: {
      name: 'Story Creator',
      price: 10,
      description: 'For passionate storytellers who want unlimited creation',
      features: [
        'Unlimited story creation',
        'Advanced story templates',
        'Real-time analytics',
        'Priority support',
        'Custom branding',
        'Export capabilities',
      ],
      highlight: 'Pay-as-you-consume model',
      buttonText: 'Become a Creator',
      buttonVariant: 'solid' as const,
      popular: true,
    },
  }

  return (
    <>
      <Header />

      <Box minH="100vh" bgGradient={bgGradient} mt={69}>
        <Container maxW="7xl" py={{ base: 16, md: 24 }}>
          <VStack spacing={16} align="center">
            {/* Early Adopter Banner */}
            <Alert
              status="success"
              borderRadius="2xl"
              bg="rgba(72, 187, 120, 0.15)"
              border="2px solid"
              borderColor="green.300"
              backdropFilter="blur(10px)"
              maxW="4xl"
              py={4}
            >
              <AlertIcon as={FaGem} color="green.300" />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  🚀 It&apos;s so good to be early!
                </Text>
                <Text fontSize="sm" color="whiteAlpha.900">
                  Join now and earn exclusive benefits, bonus credits, and special recognition as we
                  grow together! Welcome to Web3!
                </Text>
              </VStack>
            </Alert>

            {/* Header */}
            <VStack spacing={6} textAlign="center" maxW="4xl">
              <Badge
                colorScheme="purple"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="sm"
                fontWeight="bold"
                bg="whiteAlpha.200"
                color="white"
              >
                <Icon as={FaRocket} mr={2} />
                SIMPLE & FAIR PRICING
              </Badge>

              <Heading
                fontSize={{ base: '4xl', md: '6xl' }}
                fontWeight="black"
                color="white"
                letterSpacing="tight"
              >
                Create Stories.
                <br />
                <Text as="span" bgGradient="linear(to-r, white, whiteAlpha.800)" bgClip="text">
                  Share Adventures.
                </Text>
              </Heading>

              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                color="whiteAlpha.900"
                maxW="2xl"
                lineHeight="tall"
              >
                Start free, upgrade when you need more. Pay only for what your stories consume. No
                hidden fees, no surprises.
              </Text>
            </VStack>

            {/* Pricing Cards */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="full" maxW="5xl">
              {/* Free Plan */}
              <Card
                bg={cardBg}
                shadow="2xl"
                borderRadius="2xl"
                border="2px solid"
                borderColor="whiteAlpha.200"
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-8px)', shadow: '3xl' }}
                position="relative"
                overflow="hidden"
              >
                <CardBody p={8}>
                  <Stack spacing={6}>
                    <VStack align="start" spacing={3}>
                      <Badge colorScheme="gray" px={3} py={1} borderRadius="full">
                        GET STARTED
                      </Badge>
                      <Heading size="lg" color={highlightColor}>
                        {plans.free.name}
                      </Heading>
                      <Text color={textColor} fontSize="md">
                        {plans.free.description}
                      </Text>
                    </VStack>

                    <VStack align="start" spacing={1}>
                      <HStack align="baseline">
                        <Text fontSize="5xl" fontWeight="black" color={highlightColor}>
                          $0
                        </Text>
                        <Text fontSize="lg" color={textColor}>
                          forever
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>
                        No credit card required
                      </Text>
                    </VStack>

                    <List spacing={3}>
                      {plans.free.features.map((feature, index) => (
                        <ListItem key={index} display="flex" alignItems="center">
                          <ListIcon as={FaCheck} color="green.500" />
                          <Text fontSize="md">{feature}</Text>
                        </ListItem>
                      ))}
                    </List>

                    <Alert
                      status="info"
                      borderRadius="lg"
                      bg="transparent"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      <AlertIcon />
                      <Text fontSize="sm" color="white">
                        Perfect for testing the waters and creating your first adventure story!
                      </Text>
                    </Alert>

                    <Link href="/create" style={{ width: '100%' }}>
                      <Button
                        variant={plans.free.buttonVariant}
                        colorScheme="purple"
                        size="lg"
                        w="full"
                        borderColor={highlightColor}
                        color="white"
                        _hover={{ bg: highlightColor, color: 'white' }}
                      >
                        {plans.free.buttonText}
                      </Button>
                    </Link>
                  </Stack>
                </CardBody>
              </Card>

              {/* Creator Plan */}
              <Card
                bg={cardBg}
                shadow="3xl"
                borderRadius="2xl"
                border="3px solid"
                borderColor={accentColor}
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-8px)', shadow: '4xl' }}
                position="relative"
                overflow="hidden"
                transform="scale(1.05)"
              >
                {/* Popular Badge */}
                <Box
                  position="absolute"
                  top={0}
                  left="50%"
                  transform="translateX(-50%)"
                  bg={accentColor}
                  color="white"
                  px={6}
                  py={2}
                  borderBottomRadius="lg"
                  fontSize="sm"
                  fontWeight="bold"
                  zIndex={1}
                >
                  <Icon as={FaStar} mr={2} />
                  MOST POPULAR
                </Box>

                <CardBody p={8} pt={12}>
                  <Stack spacing={6}>
                    <VStack align="start" spacing={3}>
                      <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                        RECOMMENDED
                      </Badge>
                      <Heading size="lg" color={highlightColor}>
                        {plans.creator.name}
                      </Heading>
                      <Text color={textColor} fontSize="md">
                        {plans.creator.description}
                      </Text>
                    </VStack>

                    <VStack align="start" spacing={1}>
                      <HStack align="baseline">
                        <Text fontSize="5xl" fontWeight="black" color={highlightColor}>
                          $10
                        </Text>
                        <Text fontSize="lg" color={textColor}>
                          /month
                        </Text>
                      </HStack>
                      <Badge colorScheme="green" px={2} py={1} borderRadius="md">
                        20% off for education/prevention
                      </Badge>
                    </VStack>

                    <List spacing={3}>
                      {plans.creator.features.map((feature, index) => (
                        <ListItem key={index} display="flex" alignItems="center">
                          <ListIcon as={FaCheck} color="green.500" />
                          <Text fontSize="md">{feature}</Text>
                        </ListItem>
                      ))}
                    </List>

                    <Alert
                      status="success"
                      borderRadius="lg"
                      bg="transparent"
                      border="1px solid"
                      borderColor="green.200"
                    >
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold" color="white">
                          Smart Pay-As-You-Consume Model
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.900">
                          Start with $10 credit each month. Only pay for actual story interactions.
                        </Text>
                      </VStack>
                    </Alert>

                    <Button
                      variant={plans.creator.buttonVariant}
                      colorScheme="purple"
                      bg={highlightColor}
                      color="white"
                      size="lg"
                      w="full"
                      _hover={{ bg: '#6d1566' }}
                    >
                      {plans.creator.buttonText}
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* How It Works */}
            <Box w="full" maxW="6xl">
              <VStack spacing={12}>
                <VStack spacing={4} textAlign="center">
                  <Heading fontSize="3xl" color="white">
                    How Our Fair Pricing Works
                  </Heading>
                  <Text fontSize="lg" color="whiteAlpha.900" maxW="3xl">
                    No surprises, no overage fees. You get exactly what you pay for.
                  </Text>
                </VStack>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
                  {/* Step 1 */}
                  <VStack
                    spacing={6}
                    p={8}
                    bg="whiteAlpha.100"
                    borderRadius="2xl"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Box
                      w={16}
                      h={16}
                      bg={accentColor}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      1
                    </Box>
                    <VStack spacing={3} textAlign="center">
                      <Heading size="md" color="white">
                        Monthly Credit
                      </Heading>
                      <Text color="whiteAlpha.900" fontSize="sm">
                        Your account gets $10 worth of usage credits each month.
                      </Text>
                    </VStack>
                  </VStack>

                  {/* Step 2 */}
                  <VStack
                    spacing={6}
                    p={8}
                    bg="whiteAlpha.100"
                    borderRadius="2xl"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Box
                      w={16}
                      h={16}
                      bg={accentColor}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      2
                    </Box>
                    <VStack spacing={3} textAlign="center">
                      <Heading size="md" color="white">
                        Pay Per Use
                      </Heading>
                      <Text color="whiteAlpha.900" fontSize="sm">
                        Each story interaction costs just a few cents. Create unlimited stories, pay
                        only when they&apos;re played.
                      </Text>
                    </VStack>
                  </VStack>

                  {/* Step 3 */}
                  <VStack
                    spacing={6}
                    p={8}
                    bg="whiteAlpha.100"
                    borderRadius="2xl"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Box
                      w={16}
                      h={16}
                      bg={accentColor}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      3
                    </Box>
                    <VStack spacing={3} textAlign="center">
                      <Heading size="md" color="white">
                        Credits Roll Over
                      </Heading>
                      <Text color="whiteAlpha.900" fontSize="sm">
                        Unused credits accumulate month to month. Get the most value from your
                        subscription.
                      </Text>
                    </VStack>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </Box>

            {/* Usage Costs */}
            <Box w="full" maxW="4xl">
              <VStack spacing={8}>
                <VStack spacing={4} textAlign="center">
                  <Heading fontSize="2xl" color="white">
                    Simple Usage Pricing
                  </Heading>
                  <Text fontSize="md" color="whiteAlpha.900">
                    Transparent costs for every story interaction
                  </Text>
                </VStack>

                <Box
                  bg="whiteAlpha.100"
                  borderRadius="2xl"
                  p={8}
                  backdropFilter="blur(10px)"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  w="full"
                >
                  <VStack spacing={6}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                      <VStack spacing={2}>
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          2¢
                        </Text>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          Story Start
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.800" textAlign="center">
                          When someone begins your adventure
                        </Text>
                      </VStack>

                      <VStack spacing={2}>
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          1¢
                        </Text>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          Per Choice
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.800" textAlign="center">
                          Each decision made in your story
                        </Text>
                      </VStack>

                      <VStack spacing={2}>
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          3¢
                        </Text>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          AI Processing
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.800" textAlign="center">
                          Advanced story generation
                        </Text>
                      </VStack>
                    </SimpleGrid>

                    <Divider borderColor="whiteAlpha.300" />

                    <Alert
                      status="info"
                      borderRadius="lg"
                      bg="transparent"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold" color="white">
                          Example: A 20-step adventure
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.900">
                          Costs approximately $0.25 total • That&apos;s 20 adventures from your
                          monthly $5 usage credit!
                        </Text>
                      </VStack>
                    </Alert>
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* Special Offers */}
            <Box w="full" maxW="5xl">
              <VStack spacing={8}>
                <Heading fontSize="2xl" color="white" textAlign="center">
                  Special Offers
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                  {/* Education Discount */}
                  <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    p={6}
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <HStack spacing={4}>
                      <Box
                        w={12}
                        h={12}
                        bg="blue.500"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                      >
                        <Icon as={FaGraduationCap} />
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" color="white">
                          Education Discount
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.900">
                          20% off for educational institutions
                        </Text>
                        <Badge colorScheme="blue" size="sm">
                          $8/month
                        </Badge>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Prevention Organizations */}
                  <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    p={6}
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <HStack spacing={4}>
                      <Box
                        w={12}
                        h={12}
                        bg="green.500"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                      >
                        <Icon as={FaHeart} />
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" color="white">
                          Prevention Organizations
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.900">
                          20% off for health & safety organizations
                        </Text>
                        <Badge colorScheme="green" size="sm">
                          $8/month
                        </Badge>
                      </VStack>
                    </HStack>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Box>

            {/* CTA Section */}
            <VStack spacing={8} textAlign="center" py={16}>
              <VStack spacing={4}>
                <Heading fontSize="3xl" color="white">
                  Ready to Start Your Adventure?
                </Heading>
                <Text fontSize="lg" color="whiteAlpha.900" maxW="2xl">
                  Join thousands of storytellers creating amazing interactive experiences. Start
                  free, upgrade when you&apos;re ready to unlock the full potential.
                </Text>
              </VStack>

              <HStack spacing={4}>
                <Link href="/create">
                  <Button
                    size="lg"
                    colorScheme="purple"
                    bg={highlightColor}
                    color="white"
                    px={8}
                    _hover={{ bg: '#6d1566' }}
                  >
                    Start Creating Free
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    size="lg"
                    variant="outline"
                    color="white"
                    borderColor="whiteAlpha.400"
                    _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                    px={8}
                  >
                    Explore Stories
                  </Button>
                </Link>
              </HStack>
            </VStack>
          </VStack>
        </Container>
      </Box>
    </>
  )
}

export default PricingPage
