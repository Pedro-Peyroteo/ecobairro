import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layoutmain/configuracoes')({
  component: () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <i className="ri-tools-line text-3xl"></i>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Página em Construção</h1>
      <p className="text-muted-foreground max-w-md">
        Estamos a desenvolver a funcionalidade de "configuracoes". Voltamos em breve!
      </p>
    </div>
  ),
})
