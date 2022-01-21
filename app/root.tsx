import {
  Links,
  LiveReload,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch
} from 'remix';
import type { LinksFunction } from 'remix';

import tailwindStyles from './tailwind.css'
import useServiceWorker from './hooks/useServiceWorker';

export let links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css' },
    { rel: 'stylesheet', href: tailwindStyles }
  ];
};

export const meta: MetaFunction = () => {
  return {
    title: 'Scrum Poker',
    description:
      'I build this Scrum Poker as a demo project to show how you can build an interactive web application using Remix.'
  };
};

export default function App() {
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <Document>
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>
            Hey, developer, you should replace this with what you want your
            users to see.
          </p>
        </div>
      </Layout>
    </Document>
  );
}

// https://remix.run/docs/en/v1/api/conventions#catchboundary
export function CatchBoundary() {
  let caught = useCatch();

  let message;
  switch (caught.status) {
    case 401:
      message = (
        <p>
          Oops! Looks like you tried to visit a page that you do not have access
          to.
        </p>
      );
      break;
    case 404:
      message = (
        <p>Oops! Looks like you tried to visit a page that does not exist.</p>
      );
      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document>
      <Layout>
        <h1>
          {caught.status}: {caught.statusText}
        </h1>
        {message}
      </Layout>
    </Document>
  );
}

function Document({
  children
}: {
  children: React.ReactNode;
}) {
  useServiceWorker();

  return (
    <html lang='en'>
      <head>
        <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
        <meta httpEquiv='content-language' content='en' />
        <meta name='viewport' id='viewporttag' content='width=device-width, user-scalable=no, initial-scale=1' />

        <link rel='apple-touch-icon' sizes='57x57' href='/img/favicons/apple-icon-57x57.png?v=1' />
        <link rel='apple-touch-icon' sizes='60x60' href='/img/favicons/apple-icon-60x60.png?v=1' />
        <link rel='apple-touch-icon' sizes='72x72' href='/img/favicons/apple-icon-72x72.png?v=1' />
        <link rel='apple-touch-icon' sizes='76x76' href='/img/favicons/apple-icon-76x76.png?v=1' />
        <link rel='apple-touch-icon' sizes='114x114' href='/img/favicons/apple-icon-114x114.png?v=1' />
        <link rel='apple-touch-icon' sizes='120x120' href='/img/favicons/apple-icon-120x120.png?v=1' />
        <link rel='apple-touch-icon' sizes='144x144' href='/img/favicons/apple-icon-144x144.png?v=1' />
        <link rel='apple-touch-icon' sizes='152x152' href='/img/favicons/apple-icon-152x152.png?v=1' />
        <link rel='apple-touch-icon' sizes='180x180' href='/img/favicons/apple-icon-180x180.png?v=1' />
        <link rel='icon' type='image/png' sizes='192x192' href='/img/favicons/android-icon-192x192.png?v=1' />
        <link rel='icon' type='image/png' sizes='32x32' href='/img/favicons/favicon-32x32.png?v=1' />
        <link rel='icon' type='image/png' sizes='96x96' href='/img/favicons/favicon-96x96.png?v=1' />
        <link rel='icon' type='image/png' sizes='16x16' href='/img/favicons/favicon-16x16.png?v=1' />
        <link rel='manifest' href='/manifest.json' />

        <meta name='msapplication-TileColor' content='#2563eb' />
        <meta name='msapplication-TileImage' content='/img/favicons/ms-icon-144x144.png?v=1' />

        <meta name='theme-color' content='#2563eb'></meta>

        <meta property='og:image' content={`${process.env.NODE_ENV !== 'development' ? 'https://scrum-poker.davebitter.com' : ''}/img/logo.png?v=1`} />
        <meta property='og:title' content='Scrum Poker' />
        <meta property='og:description' content='I build this Scrum Poker as a demo project to show how you can build an interactive web application using Remix.' />
        <meta property='og:site_name' content='Scrum Poker' />
        <meta property='og:locale' content='en' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://scrum-poker.davebitter.com' />
        <meta property='article:author' content='Dave Bitter' />
        <meta property='article:publisher' content='Dave Bitter' />
        <meta name='keywords' content='scrum poker, scrum, poker, remix, remix.run, remix run, dave, bitter, dave bitter, front-end, frontend, developer, engineer, designer, front-end developer, senior front-end developer, front-end engineer, front-end designer' />

        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@dave_bitter' />
        <meta name='twitter:creator' content='@dave_bitter' />
        <meta name='twitter:title' content='Scrum Poker' />
        <meta name='twitter:description' content='I build this Scrum Poker as a demo project to show how you can build an interactive web application using Remix.' />
        <meta name='twitter:image' content={`${process.env.NODE_ENV !== 'development' ? 'https://scrum-poker.davebitter.com' : ''}/img/logo.png?v=1`} />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
