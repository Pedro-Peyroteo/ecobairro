import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import VerticalLayout from '@/@layouts/VerticalLayout'
import Navigation from '@/components/layout/vertical/Navigation'
import Navbar from '@/components/layout/vertical/Navbar'
import Footer from '@/components/layout/vertical/Footer'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { User } from '@/types'

export const Route = createFileRoute('/_layoutmain')({
  component: DashboardRoute,
})

function DashboardRoute() {
  const stored = sessionStorage.getItem('user')
  const user: User = stored
    ? JSON.parse(stored)
    : { id: 'guest', name: 'Visitante', email: '', role: 'guest' }

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side='left' className='p-0 w-[260px]'>
          <SheetHeader className='sr-only'><SheetTitle>Menu</SheetTitle></SheetHeader>
          <Navigation collapsed={false} onToggle={() => setMobileOpen(false)} role={user.role} />
        </SheetContent>
      </Sheet>

      <VerticalLayout
        navigation={
          <div className='hidden md:flex'>
            <Navigation collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} role={user.role} />
          </div>
        }
        navbar={<Navbar user={user} onMenuToggle={() => setMobileOpen(true)} />}
        footer={<Footer />}
      >
        <Outlet />
      </VerticalLayout>
    </>
  )
}
