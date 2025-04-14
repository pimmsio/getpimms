# Stripe App

This is the [Stripe app](https://marketplace.stripe.com/apps/pimms) for PiMMs.

## Publish new version

1. Go to `/packages/stripe-app`
2. Update the `version` in `stripe-app.json`
3. Run `stripe apps upload`
4. Make a release via the [Stripe dashboard](https://dashboard.stripe.com/apps/pimms)

## Run locally

```
stripe apps start
```
