import { registerSchema } from '@hyperjump/json-schema/draft-2020-12'

registerSchema({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Iris document frontmatter',
  description: 'Schema for Iris article and series summary frontmatter',
  type: 'object',
  properties: {
    title: {
      description: 'The title of the article/series',
      type: 'string'
    },
    authors: {
      description: 'IDs of the authors of the article/series',
      type: 'array',
      items: {
        type: 'string'
      }
    },
    tags: {
      description: 'Tags for the article/series',
      type: 'array',
      items: {
        type: 'string'
      }
    },
    cite: {
      description: 'List of citation keys to include in references even if not present in the article',
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  additionalProperties: false,
  required: ['title']
}, 'https://iris.seki.pw/frontmatter.schema.json')
