import LayoutMenu from '@/components/layouts/LayoutMenu'
import { GlobalContextProvider } from '@/features/context/GlolbalContext'
import '@/styles/globals.css'
interface Props {
  children: JSX.Element | JSX.Element[]
}
const Noop = ({ children }: Props) => <>{children}</>;
export default function App({ Component, pageProps }: any) {
  const Auth = Component.Auth || Noop;

  return (
    <GlobalContextProvider>
      <Auth>
        <LayoutMenu>
          <Component {...pageProps} />
        </LayoutMenu>
      </Auth>
    </GlobalContextProvider>
  )
}
