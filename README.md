<p align="center">
    :construction: Work in Progress! :construction:
</p>

[![Azure DevOps Build Status][azure-devops-image]][azure-devops-url-main] [![Build Status][travis-image]][travis-url]

[azure-devops-image]: https://dev.azure.com/jhipster/prettier-java/_apis/build/status/jhipster.prettier-java?branchName=master
[azure-devops-url-main]: https://dev.azure.com/jhipster/prettier-java/_build
[travis-image]: https://travis-ci.org/jhipster/prettier-java.svg?branch=master
[travis-url]: https://travis-ci.org/jhipster/prettier-java

# Prettier Java

![Prettier Banner](https://raw.githubusercontent.com/prettier/prettier-logo/master/images/prettier-banner-light.png)

## How it works

A Prettier plugin must first parse the source code of the target language
into a traversable data structure (Usually an **A**bstract **S**yntax **T**ree)
and then print out that data structure in a "pretty" style.

Prettier-Java uses a [Java-Parser](./packages/java-parser) implemented in JavaScript using the
[Chevrotain Parser Building Toolkit for JavaScript](https://github.com/SAP/chevrotain).
What this means is that unlike many other Prettier plugins,
`prettier-java` has **no additional runtime pre-requisites** (e.g: Python executable).
It could even be used inside a browser.

## Subpackages

This project contains 2 packages:

- [prettier-plugin-java](./packages/prettier-plugin-java) A plugin for
  [Prettier](https://prettier.io/) to format Java code

  [![npm-prettier-plugin-java][npm-prettier-plugin-java-image]][npm-prettier-plugin-java-url]

* [java-parser](./packages/java-parser) A Java Parser using [Chevrotain](https://github.com/SAP/chevrotain) which output a **C**oncrete **S**yntax **T**ree

  [![npm-java-parser][npm-java-parser-image]][npm-java-parser-url]

[npm-prettier-plugin-java-image]: https://img.shields.io/npm/v/prettier-plugin-java.svg?color=blue&label=prettier-plugin-java&logo=prettier-plugin-java
[npm-prettier-plugin-java-url]: https://www.npmjs.com/package/prettier-plugin-java
[npm-java-parser-image]: https://img.shields.io/npm/v/java-parser.svg?color=blue&label=java-parser&logo=java-parser
[npm-java-parser-url]: https://www.npmjs.com/package/java-parser

## Status

- Parser package alpha version done, it can parse most of Java code. However, we still need to make some tweaks and improvements.
- The printer (actually `prettier-java` package) is mostly done, it can output formatted code but needs to be improved on some cases.

## Install

### Pre-requirements

Since the plugin is meant to be used with Prettier, you need to install it:

`npm install -g prettier`

or

`yarn global add prettier`

### Install plugin

`npm install -g prettier-plugin-java`

or

`yarn global add prettier-plugin-java`

## Usage

```bash
prettier --write MyJavaFile.java
```

If the plugin is not automatically loaded:

```bash
# Example where the plugin is locate in node_modules
prettier --write MyJavaFile.java --plugin=./node_modules/prettier-plugin-java
```

## Contributing

Contributions are very welcome.
See the [contribution guide](./CONTRIBUTING.md) to get started.
And the [Help Wanted](https://github.com/jhipster/prettier-java/labels/help%20wanted) issues.

## Credits

Special thanks to [@thorbenvh8](https://github.com/thorbenvh8) for creating the original `prettier-java`
plugin and the associated Java Parser implemented in JavaScript.

We would also like to thank the [Chevrotain](https://github.com/SAP/chevrotain/graphs/contributors) and [Prettier](https://github.com/prettier/prettier/graphs/contributors) contributors which made this possible.
