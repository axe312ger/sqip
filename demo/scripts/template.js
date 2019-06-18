module.exports = content => `
<html>
  <head>
    <meta charset="UTF-8" />
    <title>SQIP demo</title>
    <style type="text/css">
      body {
        font-family: sans-serif;
        background: black;
        padding: 2rem;
        color: white;
      }
      a {
        color: tomato;
      }
      a:visited {
        color: firebrick;
      }
      img.preview {
        display: block;
        width: 100%;
      }
      img.preview.lqip {
        filter: blur(12px);
        transform: scale(1.15);
      }
      table {
        border-collapse: collapse;
        border-spacing: 0;
        table-layout: fixed;
        width: 100%;
      }
      td {
        position: relative;
        padding: 0;
      }
      td:hover .overlay {
        display: flex;
      }
      td,
      th {
        width: 300px;
      }
      th {
        text-align: left;
        padding: 1rem;
      }
      .description {
        padding: 1rem;
      }
      details {
        margin-top: 1rem;
      }
      .sizes {
        position: absolute;
        right: 0.5rem;
        bottom: 0.5rem;
      }
      .overlay {
        display: none;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        padding: 1rem;
        color: white;
        flex-direction: column;
        justify-content: center;
      }
      .overlay table {
        font-size: 0.85em;
        table-layout: auto;
      }
      .overlay td,
      .overlay th {
        text-align: left;
        color: white;
        width: auto;
        padding: 0.25rem;
        vertical-align: top;
      }
      .preview-wrapper {
        position: relative;
        height: 0;
        overflow: hidden;
      }
      .preview-wrapper img {
        position: absolute;
        width: 100%;
        height: 100%;
      }
      p.processing-time img {
        vertical-align: text-bottom;
      }
    </style>
  </head>
  <body>
    <h1>
      SQIP Demo${' '}
      <a href="https://github.com/axe312ger/sqip">
        <img src="./assets/github.svg" width="32" />
      </a>
    </h1>
    <p>
      SQIP will generate SVG based previews of images. They can be used as
      a lazy-loading image preview, a video thumbnail or an artistic
      element for your project.
    </p>
    <p>
      Compare the new SQIP version with the old SQIP version, LQIP and a
      300px thumbnail
    </p>
    <p>
      <a href="https://github.com/axe312ger/sqip">
        Learn more about SQIP
      </a>
    </p>
    ${content}
    <script type="text/javascript">
      var _paq = window._paq || [];
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="//matomo.axe312.de/";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '1']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
    </script>
  </body>
</html>
`
