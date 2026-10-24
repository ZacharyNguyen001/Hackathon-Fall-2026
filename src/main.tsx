/**
 * FILE PURPOSE: the entry point. The browser loads this first; it puts the <Play/> page into the empty <div id="root"> in index.html.
 */
import { createRoot } from 'react-dom/client'
import Play from './Play'

createRoot(document.getElementById('root')!).render(<Play />)
