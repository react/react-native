import*as e from"../../core/host/host.js";import*as i from"../../core/i18n/i18n.js";import*as o from"../../core/root/root.js";import*as t from"../../core/sdk/sdk.js";import*as s from"../../ui/legacy/legacy.js";import{render as n,html as r}from"../../ui/lit/lit.js";var a={cssText:`.rn-welcome-panel{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;justify-content:center;padding:36px;background-color:var(--color-background);min-height:100%}@media (width >= 1000px){.rn-welcome-panel{flex-direction:row;align-items:center;justify-content:stretch;height:100%;padding:0}}.rn-welcome-hero{display:flex;flex-direction:column;flex-grow:1;flex-shrink:0;align-items:center;justify-content:center;padding:16px;text-align:center}@media (width >= 1000px){.rn-welcome-hero{margin-left:24px}}.rn-welcome-heading{display:flex;align-items:center;margin-bottom:16px}.rn-welcome-icon{width:30px;height:30px;border-radius:7px;margin-right:12px}.rn-welcome-title{font-size:20px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-tagline{margin-bottom:24px;font-size:1rem;line-height:1.3;color:var(--color-text-secondary)}.rn-welcome-links{display:flex;align-items:center}.rn-welcome-links > .devtools-link{position:relative;margin:0 16px;font-size:14px}.rn-welcome-links > .devtools-link:not(:last-child)::after{content:"";position:absolute;right:-16px;height:16px;border-right:1px solid var(--sys-color-on-base-divider)}.rn-welcome-version{position:fixed;top:8px;right:8px;margin-top:24px;padding:4px 12px;border-radius:8px;background:var(--sys-color-surface2);color:var(--color-text-secondary);font-size:11px;z-index:10}.rn-welcome-docsfeed{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;max-width:700px;margin:0 auto;padding:24px}@media (width >= 1000px){.rn-welcome-docsfeed{flex-shrink:1;width:45%;max-height:100%;margin:0;padding:20px 24px;padding-right:80px;overflow:auto}}.rn-welcome-docsfeed-highlight{display:flex;justify-content:stretch;flex-direction:column;position:relative;overflow:hidden;margin:8px -16px;margin-top:16px;padding:4px 16px;border-radius:16px;flex-shrink:0;background:linear-gradient(135deg,color-mix(in srgb,var(--sys-color-blue-bright),transparent 92%) 0%,color-mix(in srgb,var(--sys-color-purple-bright),transparent 88%) 100%)}.rn-welcome-h2{flex-shrink:0;font-size:16px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-docsfeed-item{display:flex;flex-shrink:0;align-items:center;margin-bottom:8px;padding:8px;padding-right:16px;border:1px solid var(--sys-color-divider);border-radius:10px;background-color:var(--sys-color-base);text-align:left;font-size:14px;cursor:pointer}.rn-welcome-docsfeed-item:hover{background-color:var(--color-background-elevation-1)}.rn-welcome-docsfeed-item:focus{outline:solid var(--color-grid-focus-selected)}.rn-welcome-docsfeed-item p{margin:0;margin-bottom:4px;text-decoration:none}.rn-welcome-docsfeed-item :not(.devtools-link){color:var(--color-text-secondary)}.rn-welcome-image{flex-shrink:0;aspect-ratio:calc(16 / 9);height:70px;margin-right:16px;border-radius:6px;background-color:var(--sys-color-on-surface-subtle);background-position:center;background-size:cover}.rn-session-id-message{display:block;margin-top:64px;margin-bottom:8px}.rn-session-id{user-select:all;cursor:text}.code-block{background:var(--sys-color-surface2);padding:8px;border-radius:8px;color:var(--sys-color-on-surface);font-family:var(--monospace-font-family)}\n/*# sourceURL=${import.meta.resolve("./rnWelcome.css")} */\n`};const l={welcomeMessage:"Welcome to debugging in React Native",docsLabel:"Debugging docs",whatsNewLabel:"What's new",sessionIdMessage:"[FB-only] React Native DevTools session ID:",docsDebuggingBasics:"Debugging Basics",docsDebuggingBasicsDetail:"Overview of debugging tools in React Native",docsReactNativeDevTools:"React Native DevTools",docsReactDevToolsDetail:"Explore features available in React Native DevTools",docsNativeDebugging:"Native Debugging",docsNativeDebuggingDetail:"Find out more about native debugging tools"},c=i.i18n.registerUIStrings("panels/rn_welcome/RNWelcome.ts",l),d=i.i18n.getLocalizedString.bind(void 0,c);let g;class p extends s.Widget.VBox{options;#e;#i=!1;static instance(e){return g||(g=new p(e)),g}constructor(e){super(!0,!0),this.registerRequiredCSS(a),this.options=e,t.TargetManager.TargetManager.instance().observeModels(t.ReactNativeApplicationModel.ReactNativeApplicationModel,this)}wasShown(){super.wasShown(),this.render(),this.#i||s.InspectorView.InspectorView.instance().showDrawer({focus:!0,hasTargetDrawer:!1})}modelAdded(e){e.ensureEnabled(),e.addEventListener("MetadataUpdated",this.#o,this),this.#e=e.metadataCached?.reactNativeVersion,this.#i=e.metadataCached?.unstable_isProfilingBuild||!1}modelRemoved(e){e.removeEventListener("MetadataUpdated",this.#o,this)}#o(e){this.#e=e.data.reactNativeVersion,this.#i=e.data.unstable_isProfilingBuild||!1,this.isShowing()&&this.render()}#t(i){e.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(i)}render(){const{debuggerBrandName:e,showDocs:i=!1}=this.options,t=new URL("../../Images/react_native/welcomeIcon.png",import.meta.url).toString(),s=new URL("../../Images/react_native/learn-debugging-basics.jpg",import.meta.url).toString(),a=new URL("../../Images/react_native/learn-react-native-devtools.jpg",import.meta.url).toString(),c=new URL("../../Images/react_native/learn-native-debugging.jpg",import.meta.url).toString(),g=o.Runtime.Runtime.queryParam("launchId");n(r`
      <div class="rn-welcome-panel">
        <header class="rn-welcome-hero">
          <div class="rn-welcome-heading">
            <img class="rn-welcome-icon" src=${t} role="presentation" />
            <h1 class="rn-welcome-title">
              ${e()}
            </h1>
          </div>
          <div class="rn-welcome-tagline">
            ${d(l.welcomeMessage)}
          </div>
          <div class="rn-welcome-links">
            <x-link class="devtools-link" href="https://reactnative.dev/docs/debugging">
              ${d(l.docsLabel)}
            </x-link>
            <x-link class="devtools-link" href="https://reactnative.dev/blog">
              ${d(l.whatsNewLabel)}
            </x-link>
          </div>
          ${g?r`
            <aside>
              <div class="rn-session-id-message">
                ${d(l.sessionIdMessage)}
              </div>
              <div class="code-block rn-session-id">
                ${g}
              </div>
            </aside>
          `:""}
          ${null!==this.#e&&void 0!==this.#e?r`
              <p class="rn-welcome-version">React Native: <code>${this.#e}</code></p>
            `:null}
        </header>
        ${i?r`
          <section class="rn-welcome-docsfeed">
            <h2 class="rn-welcome-h2">Learn</h2>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#t.bind(this,"https://reactnative.dev/docs/debugging")} title=${d(l.docsDebuggingBasics)}>
              <div class="rn-welcome-image" style="background-image: url('${s}')"></div>
              <div>
                <p class="devtools-link">${d(l.docsDebuggingBasics)}</p>
                <p>${d(l.docsDebuggingBasicsDetail)}</p>
              </div>
            </button>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#t.bind(this,"https://reactnative.dev/docs/react-native-devtools")} title=${d(l.docsReactNativeDevTools)}>
              <div class="rn-welcome-image" style="background-image: url('${a}')"></div>
              <div>
                <p class="devtools-link">${d(l.docsReactNativeDevTools)}</p>
                <p>${d(l.docsReactDevToolsDetail)}</p>
              </div>
            </button>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#t.bind(this,"https://reactnative.dev/docs/debugging-native-code")} title=${d(l.docsNativeDebugging)}>
              <div class="rn-welcome-image" style="background-image: url('${c}')"></div>
              <div>
                <p class="devtools-link">${d(l.docsNativeDebugging)}</p>
                <p>${d(l.docsNativeDebuggingDetail)}</p>
              </div>
            </button>
          </section>
        `:null}
      </div>
    `,this.contentElement,{host:this})}}var m=Object.freeze({__proto__:null,RNWelcomeImpl:p});export{m as RNWelcome};
