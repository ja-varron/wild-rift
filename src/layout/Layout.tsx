import { Footer } from "./Footer"
import { Header } from "./Header"

const Layout = ({ children, isAuthenticated = false }: { children: React.ReactNode, isAuthenticated?: boolean }) => {
  return (
    <>
      <div className="sticky top-0 z-50">
        <Header isAuthenticated={isAuthenticated} />
      </div>
      {children}

      <Footer />
    </>
  )
}

export { Layout }