import { useState, useEffect, useContext, Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'
import { Link as AriaLink } from 'react-aria-components'
import { DevContext } from '../main.jsx'
import parse, { domToReact, attributesToProps } from 'html-react-parser'
import hljs from 'highlight.js'
import mergeHTMLPlugin from './highlightMergeHTMLPlugin.js'

import './Article.css'
import 'katex/dist/katex.css'
import 'highlight.js/styles/xcode.css'

hljs.configure({
  ignoreUnescapedHTML: true
})

hljs.addPlugin(mergeHTMLPlugin)

window.hljs = hljs
await import('highlightjs-line-numbers.js') // Don't Ask

async function getPageData (fullPath) {
  if (localStorage.getItem('dev.enabled') === 'true') {
    const host = localStorage.getItem('dev.host')
    const res = await fetch(`http://${host}${fullPath}`)

    if (res.status === 200) { return await res.json() }
  }

  const res = await fetch(fullPath)
  if (res.status !== 200) {
    throw new Response('', { status: res.status })
  }

  return await res.json()
}

function parsePath (splat) {
  const routePath = splat.replace(/\/+$/g, '')
  const routePathSegments = routePath.split('/')

  return { routePath, routePathSegments }
}

function parseHtml (src) {
  const options = {
    replace (domNode) {
      if (domNode.type !== 'tag') { return }

      switch (domNode.name) {
        case 'a': {
          if (domNode.attribs && domNode.attribs.href && domNode.attribs.href.startsWith('#')) {
            const anchor = domNode.attribs.href.slice(1)
            return <a onClick={() => { goToAnchor(anchor) }} {...attributesToProps(domNode.attribs)}>{domToReact(domNode.children, options)}</a>
          }

          const attribs = domNode.attribs ? attributesToProps(domNode.attribs) : {}
          return <AriaLink {...attribs}>{domToReact(domNode.children, options)}</AriaLink>
        }

        case 'pre': {
          if (domNode.children && domNode.children.length === 1 && domNode.children[0].name === 'code') {
            return <pre key={Math.floor(Math.random() * 10000)}>{domToReact(domNode.children, options)}</pre>
          }
        }
      }
    }
  }

  return parse(src, options)
}

export function loader ({ params }) {
  const { routePath, routePathSegments } = parsePath(params['*'])

  if (!routePath || routePath === 'SUMMARY' || routePath.endsWith('/SUMMARY') || routePathSegments.at(-1).split('.').length > 1) {
    throw new Response('', { status: 404 })
  }

  return null
}

async function load (splat) {
  const { routePath, routePathSegments } = parsePath(splat)

  let fullPath
  let seriesPath

  if (routePathSegments.length === 1) {
    fullPath = '/page/' + routePath + '/SUMMARY.md.json'
  } else {
    fullPath = '/page/' + routePath + '.md.json'
    seriesPath = '/page/' + routePathSegments[0] + '/SUMMARY.md.json'
  }

  return await Promise.all([
    getPageData(fullPath),
    seriesPath && getPageData(seriesPath)
  ])
}

function goToAnchor (anchor) {
  window.history.pushState(null, null, `#${anchor}`)

  const elem = document.getElementById(anchor)
  if (elem) { elem.scrollIntoView() }
}

function ArticleOutline ({ outline }) {
  return (
    <ul className='list-none pl-2 my-0'>
      {outline.map(heading => (
        <Fragment key={heading.id}>
          <li className='mb-1 text-gray-800'><AriaLink onPress={() => goToAnchor(heading.id)}>{parseHtml(heading.value)}</AriaLink></li>
          {heading.children && <ArticleOutline outline={heading.children} />}
        </Fragment>
      ))}
    </ul>
  )
}

function Sidebar ({ articleData, seriesData }) {
  const isMd = useMediaQuery({ query: '(min-width: 768px)' })

  return (
    <div className='flex flex-col gap-8'>
      <div className='px-2 max-h-56 md:max-h-80 md:w-72 overflow-y-auto'>
        <span className='text-xl'>{seriesData.data.frontmatter.title}</span>
      </div>

      <details className='md:sticky top-8 contents--disabled' open={isMd}>
        <summary className={`text-lg ${isMd ? 'pointer-events-none' : ''}`} tabIndex='-1'>Contents</summary>
        <ArticleOutline outline={articleData.data.toc} />
      </details>
    </div>
  )
}

export function Component () {
  const params = useParams()
  const { refresh } = useContext(DevContext)
  const [articleData, setArticleData] = useState(null)
  const [seriesData, setSeriesData] = useState(null)

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        goToAnchor(window.location.hash.slice(1))
      }, 500)
    }
  }, [])

  useEffect(() => {
    load(params['*']).then(([newArticleData, newSeriesData]) => {
      setArticleData(newArticleData)
      setSeriesData(newSeriesData)
    })
  }, [params, refresh])

  useEffect(() => {
    if (!articleData) { return }

    if (seriesData) {
      document.title = `${articleData.data.frontmatter.title} - ${seriesData.data.frontmatter.title} • Iris`
    } else {
      document.title = `${articleData.data.frontmatter.title} • Iris`
    }
  }, [articleData, seriesData])

  useEffect(() => {
    document.querySelectorAll('pre code').forEach(elem => {
      delete elem.dataset.highlighted
      hljs.highlightElement(elem)
      hljs.lineNumbersBlock(elem)
    })
  })

  return articleData && (
    <article className='flex flex-col md:flex-row gap-8 mb-8'>
      {seriesData && <Sidebar articleData={articleData} seriesData={seriesData} />}

      <div className='md:px-8 w-full md:max-w-[70ch] min-h-72'>
        <div className='mb-4'>
          <h1 className='my-0'>{articleData.data.frontmatter.title}</h1>
        </div>

        {articleData.contents.length
          ? parseHtml(articleData.contents)
          : (
            <div className='note info'>
              <span className='note__label'><strong>Info</strong></span>
              <p>This article is a stub.</p>
            </div>
            )}
      </div>
    </article>
  )
}
