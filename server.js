require('isomorphic-fetch');
const Koa = require('koa');
const next = require('next');
const { default: createShopifyAuth  } = require('@shopify/koa-shopify-auth');
const dotenv = require('dotenv');
const { verifyRequest  } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const router = require('koa-router');
const render = require('koa-ejs');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY  } = process.env;

dotenv.config();

const _ = router()

_.get('/login', async (ctx, next) => {
  await ctx.render('login')
})

app.prepare().then(() => {
  const server = new Koa();
  server.use(session({ sameSite: 'none', secure: true  }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];

  server.use(_.routes())

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products'],
      afterAuth(ctx) {
        const { shop, accessToken  } = ctx.session;

        ctx.redirect('/');
      },
    }),
  );

  server.use(verifyRequest());
  server.use(async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });

  render(server, {
      root: path.join(__dirname, 'view'),
      viewExt: 'html',
      cache: false,
      debug: true
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
