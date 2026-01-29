import { createApp } from 'vue';
import App from './App.vue';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

createApp(App).mount(rootElement);

