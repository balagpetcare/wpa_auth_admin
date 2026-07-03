'use client'
import React, { useEffect, useRef } from 'react'

interface BaseVectorMapProps {
  width?: string
  height?: string
  options?: any
  type: string
}

const BaseVectorMap = ({ width, height, options, type }: BaseVectorMapProps) => {
  const selectorId = type + new Date().getTime()
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) {
      // create jsvectormap
      mapRef.current = new (window as any)['jsVectorMap']({
        selector: '#' + selectorId,
        map: type,
        ...options,
      })
    }
  }, [selectorId, options, type])

  return (
    <>
      <div id={selectorId} style={{ width: width, height: height }}></div>
    </>
  )
}

export default BaseVectorMap
