const FooterContent = () => {
  return (
    <>
      <span>© {new Date().getFullYear()} ecoBairro</span>
      <div className='hidden md:flex items-center gap-4'>
        <a href='#' className='text-[var(--primary)] hover:underline'>Licença</a>
        <a href='#' className='text-[var(--primary)] hover:underline'>Suporte</a>
        <a href='#' className='text-[var(--primary)] hover:underline'>Documentação</a>
      </div>
    </>
  )
}

export default FooterContent
