# FluxxChat palvelin

### Heroku link

https://fluxxchat-palvelin.herokuapp.com/

### Setup

Install dependencies

```
$ yarn
```

### Running

Build sources and run server:

```
$ yarn build
$ yarn start
```

The server is accessible at http://localhost:3000 by default.

---

The build and start scripts also have watch-mode counterparts, which is useful during development:

```
$ yarn build:watch
```
```
$ yarn start:watch
```

### Contributing

This project uses [conventional commit messages](https://www.conventionalcommits.org/en/v1.0.0-beta.2/). Example valid commit message:
```
feat: added graceful shutdown
```
You can also use the following command for commits:
```
$ yarn commit
```
The above command will guide you through the parts of the commit message interactively.
