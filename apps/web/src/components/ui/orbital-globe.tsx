'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Link as LinkIcon, Zap, FileText, Recycle, Users, MapPin, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SplineScene } from '@/components/ui/splite'

interface TimelineItem {
  id: number
  title: string
  date: string
  content: string
  category: string
  icon: React.ElementType
  relatedIds: number[]
  status: 'completed' | 'in-progress' | 'pending'
  energy: number
}

// Dados do ecossistema ecoBairro
const ECO_TIMELINE_DATA: TimelineItem[] = [
  {
    id: 1,
    title: 'Reporte Resolvido',
    date: 'Hoje, 09:45',
    content: 'Remoção de resíduos acumulados na Rua da Boavista concluída pela equipa municipal.',
    category: 'Reporte',
    icon: CheckCircle,
    relatedIds: [2],
    status: 'completed',
    energy: 95,
  },
  {
    id: 2,
    title: 'Novo Ecoponto',
    date: 'Ontem, 14:30',
    content: 'Ecoponto inteligente instalado na Praça da República com sensores IoT.',
    category: 'Infraestrutura',
    icon: Recycle,
    relatedIds: [1],
    status: 'in-progress',
    energy: 80,
  },
  {
    id: 3,
    title: 'Alerta Comunitário',
    date: 'Ontem, 18:20',
    content: 'Necessidade de voluntários para limpeza do parque da cidade neste fim de semana.',
    category: 'Comunidade',
    icon: Users,
    relatedIds: [],
    status: 'pending',
    energy: 60,
  },
  {
    id: 4,
    title: 'Novo Cidadão',
    date: 'Há 2 dias',
    content: 'Ana S. juntou-se ao ecoBairro e começou a participar ativamente nas partilhas.',
    category: 'Comunidade',
    icon: Zap,
    relatedIds: [3],
    status: 'completed',
    energy: 70,
  },
]

export function OrbitalGlobe() {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [rotationAngle, setRotationAngle] = useState<number>(0)
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({})
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({})
      setActiveNodeId(null)
      setPulseEffect({})
      setAutoRotate(true)
    }
  }

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev }
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false
        }
      })

      newState[id] = !prev[id]

      if (!prev[id]) {
        setActiveNodeId(id)
        setAutoRotate(false)

        const relatedItems = getRelatedItems(id)
        const newPulseEffect: Record<number, boolean> = {}
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true
        })
        setPulseEffect(newPulseEffect)

        centerViewOnNode(id)
      } else {
        setActiveNodeId(null)
        setAutoRotate(true)
        setPulseEffect({})
      }

      return newState
    })
  }

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.25) % 360
          return Number(newAngle.toFixed(3))
        })
      }, 50)
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer)
      }
    }
  }, [autoRotate])

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return

    const nodeIndex = ECO_TIMELINE_DATA.findIndex((item) => item.id === nodeId)
    const totalNodes = ECO_TIMELINE_DATA.length
    const targetAngle = (nodeIndex / totalNodes) * 360

    setRotationAngle(270 - targetAngle)
  }

  // Calculate position with a radius that circles the globe
  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360
    const radius = 240 // Distância das órbitas ao centro (480/2)
    const radian = (angle * Math.PI) / 180

    const x = radius * Math.cos(radian)
    const y = radius * Math.sin(radian)

    const zIndex = Math.round(100 + 50 * Math.cos(radian))
    const opacity = Math.max(
      0.3,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    )

    return { x, y, angle, zIndex, opacity }
  }

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = ECO_TIMELINE_DATA.find((item) => item.id === itemId)
    return currentItem ? currentItem.relatedIds : []
  }

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false
    const relatedItems = getRelatedItems(activeNodeId)
    return relatedItems.includes(itemId)
  }

  const getStatusStyles = (status: TimelineItem['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30'
      case 'in-progress':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
      case 'pending':
        return 'text-white/90 bg-white/10 border-white/20'
      default:
        return 'text-white bg-white/10 border-white/20'
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-visible"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full h-full flex items-center justify-center">

        {/* Centro: Globo 3D reduzido */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] flex items-center justify-center z-10 pointer-events-none">
          <SplineScene scene="https://prod.spline.design/kZDDjO5HlviOn7dI/scene.splinecode" className="w-full h-full" />
        </div>

        {/* Órbita */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          ref={orbitRef}
          style={{ perspective: '1000px' }}
        >
          {/* Anel de órbita decorativo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none" style={{ border: '1px solid rgba(255, 255, 255, 0.060)' }}></div>

          {ECO_TIMELINE_DATA.map((item, index) => {
            const position = calculateNodePosition(index, ECO_TIMELINE_DATA.length)
            const isExpanded = expandedItems[item.id]
            const isRelated = isRelatedToActive(item.id)
            const isPulsing = pulseEffect[item.id]
            const Icon = item.icon

            const nodeStyle = {
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
              left: '50%',
              top: '50%',
            }

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleItem(item.id)
                }}
              >
                {/* Aura pulse effect */}
                <div
                  className={`absolute rounded-full -inset-1 pointer-events-none ${isPulsing ? 'animate-pulse duration-1000' : ''
                    }`}
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    pointerEvents: 'none',
                  }}
                ></div>

                {/* Node icon bubble */}
                <div
                  className={`
                  w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto
                  ${isExpanded
                      ? 'bg-[var(--primary)] text-white'
                      : isRelated
                        ? 'bg-[var(--primary)]/40 text-white'
                        : 'bg-black/40 text-white/80'
                    }
                  border-[1.5px] 
                  ${isExpanded
                      ? 'border-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                      : isRelated
                        ? 'border-[var(--primary)] animate-pulse'
                        : 'border-white/10 hover:border-white/30'
                    }
                  transition-all duration-300 transform
                  ${isExpanded ? 'scale-110' : 'hover:scale-110'}
                `}
                >
                  <Icon size={18} />
                </div>

                {/* Title label (visible when closed) */}
                <div
                  className={`
                  absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap
                  text-[10px] font-medium tracking-wide
                  transition-all duration-300
                  ${isExpanded ? 'text-white opacity-0' : 'text-white/40 opacity-100 group-hover:text-white/80'}
                `}
                >
                  {item.title}
                </div>

                {/* Expanded Card */}
                {isExpanded && (
                  <Card className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 w-[280px] bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl overflow-visible z-[999] pointer-events-auto">
                    {/* Connector line */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-px h-5 bg-white/20"></div>

                    <CardHeader className="pb-2 pt-5 px-5">
                      <div className="flex justify-between items-center mb-1">
                        <Badge
                          variant="outline"
                          className={`px-2 py-0 h-[18px] text-[9px] font-bold tracking-wider ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === 'completed'
                            ? 'CONCLUÍDO'
                            : item.status === 'in-progress'
                              ? 'EM CURSO'
                              : 'NOVO'}
                        </Badge>
                        <span className="text-[10px] font-mono text-white/40">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold text-white tracking-tight">
                        {item.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="px-5 pb-5">
                      <p className="text-xs text-white/60 leading-relaxed">
                        {item.content}
                      </p>

                      {/* Energy / Impact metric */}
                      <div className="mt-5 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px] mb-2 font-medium">
                          <span className="flex items-center text-white/50 uppercase tracking-widest">
                            <Zap size={10} className="mr-1.5 text-[var(--primary)]" />
                            Impacto Comunitário
                          </span>
                          <span className="font-mono text-white/80">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Related events */}
                      {item.relatedIds.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-white/5">
                          <div className="flex items-center mb-3">
                            <LinkIcon size={10} className="text-white/40 mr-1.5" />
                            <h4 className="text-[9px] uppercase tracking-widest font-semibold text-white/40">
                              Eventos Relacionados
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = ECO_TIMELINE_DATA.find(
                                (i) => i.id === relatedId
                              )
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2.5 py-0 text-[10px] rounded border-white/10 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleItem(relatedId)
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={10}
                                    className="ml-1.5 text-white/30"
                                  />
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
