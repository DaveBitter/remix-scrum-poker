# Scrum Poker

![Scrum Poker web application](docs/logo.svg)

> Head over to [scrum-poker.davebitter.com](https://scrum-poker.davebitter.com) for a demo.

I build this Scrum Poker as a demo project to show how you can build an interactive web application using [Remix](https://remix.run/docs).

I use this web application as part of a talk on the basics of Remix. Head over to [my website](https://davebitter.com) for an overview of the talks I give and/or shoot me a message at [daveybitter@gmail.com](mailto:daveybitter@gmail.com) if you are interested in me giving this talk at your event!

## Supabase
Scrum Poker uses [Supabase](https://supabase.com/) to store data and have real-time updates on sessions.

## Getting started

### Run development environment
- `yarn dev` or `npm run dev` - starts the development environment with auto reloading and all that good stuff. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

- `yarn dev:netlify` or `npm run dev:netlify` - starts the development environment as it would be ran on Netlify. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Scripts
Besides these development scripts, there are many more scripts set up:

* `clean` - Cleans build folder
* `deploy:netlify` - Deploys to Netlify
* `postinstall` - Sets up Node
* `start` - Starts Remix server

### Tech stack
#### Remix
Scrum Poker uses [Remix](https://remix.run/docs) to
* provide SSR [React.js](https://reactjs.org/). Pages are automatically optimised to deliver the best experience.
* handle routing
* generate builds
* and more

#### TypeScript
Scrum Poker used [TypeScript](https://www.typescriptlang.org/) for static checking and documentation. You can view the Typescript config in [./tsconfig.json](./tsconfig.json).

#### Tailwind
Scrum Poker used [Tailwind](https://tailwindcss.com/) to make it easy to implement the design for this challenge.

#### Netflify (CI/CD)
Scrum Poker uses [Netlify](https://www.netlify.com/) (♥️) to build, deploy and optimise.
