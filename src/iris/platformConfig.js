import './schemas.js'

export default {
  markdown: {
    smartypantsFrontmatter: ['title'],
    messageTypes: {
      info: 'Note',
      warning: 'Warning',
      tip: 'Tip',
      problem: 'Problem',
      exercise: 'Exercise'
    },
    characters: {
      iris: {
        name: 'Iris',
        url: ''
      }
    },
    noCiteKey: 'cite'
  },
  network: {
    store: ['title']
  },
  schemas: {
    FRONTMATTER: 'https://iris.seki.pw/frontmatter.schema.json'
  }
}
