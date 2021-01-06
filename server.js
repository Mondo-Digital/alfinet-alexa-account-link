require('isomorphic-fetch');
const Koa = require('koa');
const { default: createShopifyAuth  } = require('@shopify/koa-shopify-auth');
const dotenv = require('dotenv');
dotenv.config();

// const { verifyRequest  } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const koaRouter = require('koa-router');
const static = require('koa-static');
const render = require('koa-ejs');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY  } = process.env;

const router = koaRouter()
const memoryState = {}

const server = new Koa();
server.keys = [SHOPIFY_API_SECRET_KEY];
server.use(session({ sameSite: 'none', secure: true  }, server));
server.use(static(__dirname + '/public'))

render(server, {
  root: path.join(__dirname, 'view'),
  viewExt: 'html',
  cache: false,
  debug: false
});

router
  .get('/shop-login', async (ctx) => {
    await ctx.render('shop-login', { oauth: ctx.query })
  })
  .get('/alexa-account-link', async (ctx) => {
    const { shop, state, redirect_uri, token_type } = ctx.query
    memoryState[shop] = { state, redirect_uri }
    ctx.redirect(`/auth?shop=${shop}`);
  })

server.use(router.routes())
server.use(
  createShopifyAuth({
    apiKey: SHOPIFY_API_KEY,
    secret: SHOPIFY_API_SECRET_KEY,
    scopes: ['read_products'],
    afterAuth(ctx) {
      const { shop, accessToken  } = ctx.session;
      const { redirect_uri, state } = memoryState[shop]

      console.log("SUCCESS redirecting")
      console.log(`${redirect_uri}#state=${state}&access_token=${accessToken}&token_type=bearer`)
      ctx.redirect(`${redirect_uri}#state=${state}&access_token=${accessToken}&token_type=bearer`);
    },
  }),
);

// server.use(verifyRequest());

server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
