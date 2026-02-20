import './style.css';
import { createApp } from 'vue';
import App from './App.vue';
import { installRouter } from './router';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

const app = createApp(App);
installRouter(app);
app.mount(rootElement);

