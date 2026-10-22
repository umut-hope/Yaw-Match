import { mount } from 'svelte'
import './styles/tokens.css'
import './app.css'
import App from './App.svelte'

const target = document.getElementById('app')
if (!target) throw new Error('Missing #app element')

const app = mount(App, { target })

export default app
