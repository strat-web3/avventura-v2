'use client'

import React from 'react'
import { VStack } from '@chakra-ui/react'
import Image from 'next/image'

const Loader: React.FC = () => {
  return (
    <VStack spacing={4} align="center" justify="center" py={8}>
      <Image src="/loader.svg" alt="Loading..." width={250} height={250} />
    </VStack>
  )
}

export default Loader
