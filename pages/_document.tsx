/* eslint-disable @next/next/no-css-tags */
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <meta name="theme-color" content="#000000" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/COIN.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/COIN.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/COIN.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#da532c" />
      <meta property="og:title" content=""/>
      <meta property="og:site_name" content=""/>
      <meta property="og:url" content=""/>
      <meta property="og:description" content=""/>
      <meta property="og:type" content="business.business"/>
      <meta property="og:image" content=""/>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}