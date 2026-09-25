import LayoutMenu from '@/components/layouts/LayoutMenu'
import { GlobalContextProvider } from '@/features/context/GlolbalContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '@/styles/globals.css'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { logEvent } from 'firebase/analytics'
import { initAnalytics } from '@/firebase/firebase.config'

interface Props {
  children: JSX.Element | JSX.Element[]
}
const Noop = ({ children }: Props) => <>{children}</>;
export default function App({ Component, pageProps }: any) {
  const Auth = Component.Auth || Noop;
  const router = useRouter();

  useEffect(() => {
    initAnalytics().then((analyticsInstance) => {
      if (!analyticsInstance) return;

      // Registrar vista de página inicial
      logEvent(analyticsInstance, 'page_view', {
        page_path: router.asPath,
      });

      // Registrar vista de página en cada cambio de ruta de Next.js
      const handleRouteChange = (url: string) => {
        logEvent(analyticsInstance, 'page_view', {
          page_path: url,
        });
      };

      router.events.on('routeChangeComplete', handleRouteChange);
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    });
  }, [router]);

  return (
    <GlobalContextProvider>
      <Head>
        <title>competence lab</title>
      </Head>
      <Auth>
        <LayoutMenu>
          <Component {...pageProps} />
          <ToastContainer />
        </LayoutMenu>
      </Auth>
    </GlobalContextProvider>
  )
}
