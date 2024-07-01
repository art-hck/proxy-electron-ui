import { ipcRenderer } from 'electron';
import { domOperator } from "../utils/domOperator";
import { Host, Hosts } from "./proxy.service";

(function ($) {
    $(async () => {
        const hosts: Hosts = await ipcRenderer.invoke('proxy-read-storage');
        const list = $('.app-hosts').get();
        const listGroupItemTpl: HTMLTemplateElement = $('#list-group-item-tpl').get();
        let activeIndex: number;

        $('.app-minimize').on('click', () => ipcRenderer.invoke('proxy-minimize'));
        $('.app-close').on('click', () => ipcRenderer.invoke('proxy-close'));
        $('.form').on('submit', submit);

        render();

        function render() {
            clearElements();

            hosts.forEach((host, index) => {
                const el = document.importNode(listGroupItemTpl.content, true).querySelector<HTMLButtonElement>(':first-child');
                el.querySelector('.list-group-item-index').textContent = `#${index + 1}`;
                el.querySelector('.list-group-item-name').textContent = host.name;
                el.querySelector('.list-group-item-host').textContent = host.url;
                list.appendChild(el);
                $(el).on('click', () => connect(index));
                $(el.querySelector('.list-group-item-remove')).on('click', () => remove(index));
            });

            updateActiveElement();
        }

        async function connect(index: number) {
            await ipcRenderer.invoke(activeIndex === index ? 'proxy-disconnect' : 'proxy-connect', hosts[index])
            activeIndex = activeIndex === index ? undefined : index;
            updateActiveElement();
        }

        function remove(index: number) {
            hosts.splice(index, 1);
            render();
            ipcRenderer.invoke('proxy-write-storage', hosts);
        }

        function clearElements() {
            while (list.firstChild) {
                list.removeChild(list.lastChild);
            }
        }

        function updateActiveElement() {
            for (let i = 0; i < list.children.length; i++) {
                list.children[i].classList[i === activeIndex ? 'add' : 'remove']('list-group-item-primary')
            }
        }

        function submit(e: Event) {
            e.preventDefault();
            this.classList.add('app-validated');
            if (this.checkValidity()) {
                hosts.push($(this).serialize<Host>());
                ipcRenderer.invoke('proxy-write-storage', hosts);
                this.reset();
                this.classList.remove('app-validated');
                render();
            }
        }
    });
})(domOperator)
