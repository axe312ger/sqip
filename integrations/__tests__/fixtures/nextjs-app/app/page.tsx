// @ts-expect-error -- sqip-loader produces a virtual module
import placeholder from '../public/test.jpg?sqip'

export default function Home() {
  return (
    <div>
      <h1>SQIP Next.js Test</h1>
      <pre id="sqip-data">{JSON.stringify(placeholder)}</pre>
    </div>
  )
}
