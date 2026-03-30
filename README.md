# Pizza Restaurant Front-End Web App With React & Redux

### A project of Jonas Schmedtmann's Ultimate React Course

###

### Deployment - https://fast-react-p1zza.vercel.app/

#### -- React Router with Data Loading

#### -- Tailwind CSS

#### -- Redux and Advanced React Router

## Applitools Eyes Experiment (Matching Levels)

This project includes a Playwright + Applitools visual test suite for demonstrating visual AI capabilities in a presentation.

### What is covered

- Strict matching on the home page.
- Layout matching on the menu page.
- IgnoreColors matching on the menu main region.
- Strict matching on cart and order-complete pages.
- Layout matching on the order details page.
- Cross-browser coverage via Visual Grid (Chrome, Firefox, iPhone 14 Pro emulation).

### Run steps

1. Create a local `.env` file using `.env.example`.
2. Set `APPLITOOLS_API_KEY` in `.env`.
3. Run:

```bash
npm run test:visual
```

Optional headed run:

```bash
npm run test:visual:headed
```

After execution, use the Applitools dashboard batch results to capture screenshots and pass/fail summaries for your Experiment and Results slides.
