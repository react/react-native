import*as e from"../../../ui/components/helpers/helpers.js";import*as t from"../../../ui/lit/lit.js";import{render as r,html as s,nothing as o}from"../../../ui/lit/lit.js";import*as i from"../../../ui/visual_logging/visual_logging.js";import*as a from"../../../ui/legacy/legacy.js";import*as n from"../../../core/host/host.js";import*as d from"../../../core/i18n/i18n.js";import*as l from"../../../core/platform/platform.js";import*as h from"../../../core/sdk/sdk.js";import*as c from"../../../third_party/chromium/client-variations/client-variations.js";import"../../../ui/components/buttons/buttons.js";import"../../../ui/components/icon_button/icon_button.js";import*as u from"../../../core/common/common.js";import"../forward/forward.js";import*as p from"../../../models/persistence/persistence.js";import*as v from"../../../models/workspace/workspace.js";import*as m from"../../../ui/components/input/input.js";import*as g from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as f from"../../../ui/components/render_coordinator/render_coordinator.js";import*as w from"../../sources/sources.js";import*as y from"../../../models/issues_manager/issues_manager.js";import"../../../ui/components/report_view/report_view.js";import"../../../ui/legacy/components/data_grid/data_grid.js";import{PanelUtils as b}from"../../utils/utils.js";var k={cssText:`:host{display:inline}.editable{cursor:text;overflow-wrap:anywhere;min-height:18px;line-height:18px;min-width:0.5em;background:transparent;border:none;border-radius:4px;outline:none;display:inline-block;font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);&:hover{border:1px solid var(--sys-color-neutral-outline)}&:focus{border:1px solid var(--sys-color-state-focus-ring)}}.editable::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}\n/*# sourceURL=${import.meta.resolve("./EditableSpan.css")} */\n`};const x=new CSSStyleSheet;x.replaceSync(k.cssText);class S extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=this.#r.bind(this);#s="";connectedCallback(){this.#e.adoptedStyleSheets=[x],this.#e.addEventListener("focusin",this.#o.bind(this)),this.#e.addEventListener("keydown",this.#i.bind(this)),this.#e.addEventListener("input",this.#a.bind(this))}set data(t){this.#s=t.value,e.ScheduledRender.scheduleRender(this,this.#t)}get value(){return this.#e.querySelector("span")?.innerText||""}set value(e){this.#s=e;const t=this.#e.querySelector("span");t&&(t.innerText=e)}#i(e){"Enter"===e.key&&(e.preventDefault(),e.target?.blur())}#a(e){this.#s=e.target.innerText}#o(e){const t=e.target,r=window.getSelection(),s=document.createRange();s.selectNodeContents(t),r?.removeAllRanges(),r?.addRange(s)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");r(s`<span
        contenteditable="plaintext-only"
        class="editable"
        tabindex="0"
        .innerText=${this.#s}
        jslog=${i.value("header-editor").track({change:!0,keydown:"Enter|Escape"})}
    </span>`,this.#e,{host:this})}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".editable");e?.focus()}))}}customElements.define("devtools-editable-span",S);var R=Object.freeze({__proto__:null,EditableSpan:S}),E={cssText:`:host{display:block}.row{display:flex;line-height:18px;padding-left:8px;gap:var(--sys-size-6);user-select:text;margin:var(--sys-size-3) 0}.row.header-editable{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.header-name{font:var(--sys-typescale-body5-medium);color:var(--sys-color-on-surface-subtle);width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize;overflow-wrap:break-word}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.header-name.pseudo-header{text-transform:none}.header-editable .header-name{color:var(--sys-color-token-property-special)}.row.header-deleted .header-name{color:var(--sys-color-token-subtle)}.header-value{display:flex;overflow-wrap:anywhere;margin-inline-end:14px;font:var(--sys-typescale-body4-regular)}.header-badge-text{font-variant:small-caps;font-weight:500;white-space:pre-wrap;word-break:break-all;text-transform:none}.header-badge{display:inline;background-color:var(--sys-color-error);color:var(--sys-color-on-error);border-radius:100vh;padding-left:6px;padding-right:6px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}.row-flex-icon{margin:2px 5px 0}.header-value code{display:block;white-space:pre-wrap;font-size:90%;color:var(--sys-color-token-subtle)}x-link .inline-icon{padding-right:3px}.header-highlight{background-color:var(--sys-color-yellow-container)}.header-warning{color:var(--sys-color-error)}.header-overridden{background-color:var(--sys-color-tertiary-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.header-deleted{background-color:var(--sys-color-surface-error);border-left:3px solid var(--sys-color-error-bright);color:var(--sys-color-token-subtle);text-decoration:line-through}.header-highlight.header-overridden{background-color:var(--sys-color-yellow-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.inline-button{vertical-align:middle}.row .inline-button{opacity:0%;visibility:hidden;transition:opacity 200ms;padding-left:2px}.row.header-overridden:focus-within .inline-button,\n.row.header-overridden:hover .inline-button{opacity:100%;visibility:visible}.row:hover .inline-button.enable-editing{opacity:100%;visibility:visible}.flex-right{margin-left:auto}.flex-columns{flex-direction:column}\n/*# sourceURL=${import.meta.resolve("./HeaderSectionRow.css")} */\n`};const H=new CSSStyleSheet;H.replaceSync(E.cssText);const{render:$,html:q}=t,C={activeClientExperimentVariation:"Active `client experiment variation IDs`.",activeClientExperimentVariationIds:"Active `client experiment variation IDs` that trigger server-side behavior.",decoded:"Decoded:",editHeader:"Override header",headerNamesOnlyLetters:"Header names should contain only letters, digits, hyphens or underscores",learnMore:"Learn more",learnMoreInTheIssuesTab:"Learn more in the issues tab",reloadPrompt:"Refresh the page/request for these changes to take effect",removeOverride:"Remove this header override"},T=d.i18n.registerUIStrings("panels/network/components/HeaderSectionRow.ts",C),N=d.i18n.getLocalizedString.bind(void 0,T),O=e=>/^[a-z0-9_\-]+$/i.test(e),A=(e,t)=>e?.replaceAll(/\s/g," ")===t?.replaceAll(/\s/g," ");class D extends Event{static eventName="headeredited";headerName;headerValue;constructor(e,t){super(D.eventName,{}),this.headerName=e,this.headerValue=t}}class L extends Event{static eventName="headerremoved";headerName;headerValue;constructor(e,t){super(L.eventName,{}),this.headerName=e,this.headerValue=t}}class I extends Event{static eventName="enableheaderediting";constructor(){super(I.eventName,{})}}class U extends HTMLElement{#e=this.attachShadow({mode:"open"});#n=null;#t=this.#r.bind(this);#d=!1;#l=!0;connectedCallback(){this.#e.adoptedStyleSheets=[H]}set data(t){this.#n=t.header,this.#d=void 0!==this.#n.originalValue&&this.#n.value!==this.#n.originalValue,this.#l=O(this.#n.name),e.ScheduledRender.scheduleRender(this,this.#t)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");if(!this.#n)return;const r=t.Directives.classMap({row:!0,"header-highlight":Boolean(this.#n.highlight),"header-overridden":Boolean(this.#n.isOverride)||this.#d,"header-editable":1===this.#n.valueEditable,"header-deleted":Boolean(this.#n.isDeleted)}),s=t.Directives.classMap({"header-name":!0,"pseudo-header":this.#n.name.startsWith(":")}),o=t.Directives.classMap({"header-value":!0,"header-warning":Boolean(this.#n.headerValueIncorrect),"flex-columns":"x-client-data"===this.#n.name&&!this.#n.isResponseHeader}),i=this.#n.nameEditable&&1===this.#n.valueEditable,a=this.#n.nameEditable||this.#n.isDeleted||this.#d;$(q`
      <div class=${r}>
        <div class=${s}>
          ${this.#n.headerNotSet?q`<div class="header-badge header-badge-text">${d.i18n.lockedString("not-set")}</div> `:t.nothing}
          ${i&&!this.#l?q`<devtools-icon class="inline-icon disallowed-characters" title=${C.headerNamesOnlyLetters} .data=${{iconName:"cross-circle-filled",width:"16px",height:"16px",color:"var(--icon-error)"}}>
            </devtools-icon>`:t.nothing}
          ${i&&!this.#n.isDeleted?q`<devtools-editable-span
              @focusout=${this.#h}
              @keydown=${this.#i}
              @input=${this.#c}
              @paste=${this.#u}
              .data=${{value:this.#n.name}}
            ></devtools-editable-span>`:this.#n.name}
        </div>
        <div
          class=${o}
          @copy=${()=>n.userMetrics.actionTaken(n.UserMetrics.Action.NetworkPanelCopyValue)}
        >
          ${this.#p()}
        </div>
        ${a?q`<devtools-icon class="row-flex-icon flex-right" title=${C.reloadPrompt} .data=${{iconName:"info",width:"16px",height:"16px",color:"var(--icon-default)"}}>
          </devtools-icon>`:t.nothing}
      </div>
      ${this.#v(this.#n.blockedDetails)}
    `,this.#e,{host:this}),this.#n.highlight&&this.scrollIntoView({behavior:"auto"})}#p(){if(!this.#n)return t.nothing;if("x-client-data"===this.#n.name&&!this.#n.isResponseHeader)return this.#m(this.#n);if(this.#n.isDeleted||1!==this.#n.valueEditable){const e=this.#n.isResponseHeader&&!this.#n.isDeleted&&2!==this.#n.valueEditable;return q`
      ${this.#n.value||""}
      ${this.#g(this.#n)}
      ${e?q`
        <devtools-button
          title=${N(C.editHeader)}
          .size=${"SMALL"}
          .iconName=${"edit"}
          .variant=${"icon"}
          @click=${()=>{this.dispatchEvent(new I)}}
          jslog=${i.action("enable-header-overrides").track({click:!0})}
          class="enable-editing inline-button"
        ></devtools-button>
      `:t.nothing}
    `}return q`
      <devtools-editable-span
        @focusout=${this.#f}
        @input=${this.#w}
        @paste=${this.#w}
        @keydown=${this.#i}
        .data=${{value:this.#n.value||""}}
      ></devtools-editable-span>
      ${this.#g(this.#n)}
      <devtools-button
        title=${N(C.removeOverride)}
        .size=${"SMALL"}
        .iconName=${"bin"}
        .variant=${"icon"}
        class="remove-header inline-button"
        @click=${this.#y}
        jslog=${i.action("remove-header-override").track({click:!0})}
      ></devtools-button>
    `}#m(e){const t=c.parseClientVariations(e.value||""),r=c.formatClientVariations(t,N(C.activeClientExperimentVariation),N(C.activeClientExperimentVariationIds));return q`
      <div>${e.value||""}</div>
      <div>${N(C.decoded)}</div>
      <code>${r}</code>
    `}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".header-name devtools-editable-span");e?.focus()}))}#g(e){if("set-cookie"===e.name&&e.setCookieBlockedReasons){const t=e.setCookieBlockedReasons.map(h.NetworkRequest.setCookieBlockedReasonToUiString).join("\n");return q`
        <devtools-icon class="row-flex-icon" title=${t} .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
        </devtools-icon>
      `}return t.nothing}#v(e){return e?q`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation">${e.explanation()}</div>
          ${e.examples.map((e=>q`
            <div class="example">
              <code>${e.codeSnippet}</code>
              ${e.comment?q`
                <span class="comment">${e.comment()}</span>
              `:""}
            </div>
          `))}
          ${this.#b(e)}
        </div>
      </div>
    `:t.nothing}#b(e){return e?.reveal?q`
        <div class="devtools-link" @click=${e.reveal}>
          <devtools-icon class="inline-icon" .data=${{iconName:"issue-exclamation-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
          </devtools-icon
          >${N(C.learnMoreInTheIssuesTab)}
        </div>
      `:e?.link?q`
        <x-link href=${e.link.url} class="link">
          <devtools-icon class="inline-icon" .data=${{iconName:"open-externally",color:"var(--icon-link)",width:"20px",height:"20px"}}>
          </devtools-icon
          >${N(C.learnMore)}
        </x-link>
      `:t.nothing}#f(t){const r=t.target;if(!this.#n)return;const s=r.value.trim();A(s,this.#n.value?.trim())||(this.#n.value=s,this.dispatchEvent(new D(this.#n.name,s)),e.ScheduledRender.scheduleRender(this,this.#t));const o=window.getSelection();o?.removeAllRanges(),this.#n.originalName=""}#h(t){const r=t.target;if(!this.#n)return;const s=l.StringUtilities.toLowerCaseString(r.value.trim());""===s?r.value=this.#n.name:A(s,this.#n.name.trim())||(this.#n.name=s,this.dispatchEvent(new D(s,this.#n.value||"")),e.ScheduledRender.scheduleRender(this,this.#t));const o=window.getSelection();o?.removeAllRanges()}#y(){if(!this.#n)return;const e=this.#e.querySelector(".header-value devtools-editable-span");this.#n.originalValue&&(e.value=this.#n?.originalValue),this.dispatchEvent(new L(this.#n.name,this.#n.value||""))}#i(e){const t=e,r=e.target;if("Escape"===t.key){if(e.consume(),r.matches(".header-name devtools-editable-span"))r.value=this.#n?.name||"",this.#c(e);else if(r.matches(".header-value devtools-editable-span")&&(r.value=this.#n?.value||"",this.#w(e),this.#n?.originalName)){const e=this.#e.querySelector(".header-name devtools-editable-span");return e.value=this.#n.originalName,this.#n.originalName="",e.dispatchEvent(new Event("input")),void e.focus()}r.blur()}}#c(t){const r=t.target,s=O(r.value);this.#l!==s&&(this.#l=s,e.ScheduledRender.scheduleRender(this,this.#t))}#w(t){const r=t.target,s=void 0!==this.#n?.originalValue&&!A(this.#n?.originalValue||"",r.value);this.#d!==s&&(this.#d=s,this.#n&&(this.#n.highlight=!1),e.ScheduledRender.scheduleRender(this,this.#t))}#u(e){if(!e.clipboardData)return;const t=e.target,r=e.clipboardData.getData("text/plain")||"",s=r.indexOf(":");if(s<1)return t.value=r,e.preventDefault(),void t.dispatchEvent(new Event("input",{bubbles:!0}));this.#n&&(this.#n.originalName=this.#n.name);const o=r.substring(s+1,r.length).trim(),i=r.substring(0,s);t.value=i,t.dispatchEvent(new Event("input"));const a=this.#e.querySelector(".header-value devtools-editable-span");a&&(a.focus(),a.value=o,a.dispatchEvent(new Event("input"))),e.preventDefault()}}customElements.define("devtools-header-section-row",U);var V=Object.freeze({__proto__:null,EnableHeaderEditingEvent:I,HeaderEditedEvent:D,HeaderRemovedEvent:L,HeaderSectionRow:U,compareHeaders:A,isValidHeaderName:O}),_={cssText:`:host{display:block}.infobar{background-color:var(--sys-color-surface-yellow);color:var(--sys-color-on-surface-yellow);border-radius:6px;padding:6px 10px;margin:6px;font-size:11px;max-width:320px}.infobar-header{display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none}.arrow-icon{display:inline-block;mask-image:var(--image-file-triangle-right);background-color:var(--icon-default);height:12px;width:12px;transition:transform 200ms;flex-shrink:0}.arrow-icon.expanded{transform:rotate(90deg)}.infobar-message{font-weight:500}.info-icon{flex-shrink:0}.close-button{flex-shrink:0;margin-left:auto}.infobar-details{margin-top:6px;margin-left:17px;color:var(--sys-color-on-surface-subtle)}\n/*# sourceURL=${import.meta.resolve("./NetworkEventCoverageInfobar.css")} */\n`};const M=new CSSStyleSheet;M.replaceSync(_.cssText);const{html:F}=t;class P extends HTMLElement{#e=this.attachShadow({mode:"open"});#k=!1;#x=u.Settings.Settings.instance().createSetting("network-event-coverage-infobar-dismissed",!1);connectedCallback(){this.#e.adoptedStyleSheets=[M],this.#r()}#S(){this.#k=!this.#k,this.#r()}#R(e){e.stopPropagation(),this.#x.set(!0),this.#r()}#r(){this.#x.get()?t.render(t.nothing,this.#e,{host:this}):t.render(F`
        <div class="infobar" jslog=${i.section("network-event-coverage-infobar")}>
          <div
            class="infobar-header"
            role="button"
            tabindex="0"
            aria-expanded=${this.#k?"true":"false"}
            @click=${this.#S}
            @keydown=${e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this.#S())}}
            jslog=${i.expand().track({click:!0})}
          >
            <span class="arrow-icon ${this.#k?"expanded":""}"></span>
            <devtools-icon class="info-icon" .data=${{iconName:"info",color:"var(--sys-color-on-surface-yellow)",width:"16px",height:"16px"}}></devtools-icon>
            <span class="infobar-message">[FB-only] Network event coverage</span>
            <devtools-button
              class="close-button"
              title="Dismiss"
              .size=${"MICRO"}
              .iconName=${"cross"}
              .variant=${"icon"}
              .jslogContext=${"dismiss"}
              @click=${this.#R}
            ></devtools-button>
          </div>
          ${this.#k?F`
            <div class="infobar-details">
              Only fetch() and XMLHttpRequest events are available at Meta. Images fetched via &lt;Image&gt; are not currently supported.
            </div>
          `:t.nothing}
        </div>
      `,this.#e,{host:this})}}customElements.get("devtools-network-event-coverage-infobar")||customElements.define("devtools-network-event-coverage-infobar",P);var j=Object.freeze({__proto__:null,NetworkEventCoverageInfobar:P}),z={cssText:`:host{display:block}devtools-header-section-row:last-of-type{margin-bottom:10px}devtools-header-section-row:first-of-type{margin-top:2px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=${import.meta.resolve("./RequestHeaderSection.css")} */\n`};const W=new CSSStyleSheet;W.replaceSync(z.cssText);const{render:B,html:G}=t,K={learnMore:"Learn more",provisionalHeadersAreShownDisableCache:"Provisional headers are shown. Disable cache to see full headers.",onlyProvisionalHeadersAre:"Only provisional headers are available because this request was not sent over the network and instead was served from a local cache, which doesn’t store the original request headers. Disable cache to see full request headers.",provisionalHeadersAreShown:"Provisional headers are shown."},X=d.i18n.registerUIStrings("panels/network/components/RequestHeaderSection.ts",K),Y=d.i18n.getLocalizedString.bind(void 0,X);class J extends HTMLElement{#e=this.attachShadow({mode:"open"});#E;#H=[];connectedCallback(){this.#e.adoptedStyleSheets=[W]}set data(e){this.#E=e.request,this.#H=this.#E.requestHeaders().map((e=>({name:l.StringUtilities.toLowerCaseString(e.name),value:e.value,valueEditable:2}))),this.#H.sort(((e,t)=>l.StringUtilities.compare(e.name,t.name))),"Request"===e.toReveal?.section&&this.#H.filter((t=>t.name===e.toReveal?.header?.toLowerCase())).forEach((e=>{e.highlight=!0})),this.#r()}#r(){this.#E&&B(G`
      ${this.#$()}
      ${this.#H.map((e=>G`
        <devtools-header-section-row
          .data=${{header:e}}
          jslog=${i.item("request-header")}
        ></devtools-header-section-row>
      `))}
    `,this.#e,{host:this})}#$(){if(!this.#E||void 0!==this.#E.requestHeadersText())return t.nothing;let e,r="";return this.#E.cachedInMemory()||this.#E.cached()?(e=Y(K.provisionalHeadersAreShownDisableCache),r=Y(K.onlyProvisionalHeadersAre)):e=Y(K.provisionalHeadersAreShown),G`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation" title=${r}>
            <devtools-icon class="inline-icon" .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
            </devtools-icon>
            ${e} <x-link href="https://developer.chrome.com/docs/devtools/network/reference/#provisional-headers" class="link">${Y(K.learnMore)}</x-link>
          </div>
        </div>
      </div>
    `}}customElements.define("devtools-request-header-section",J);var Q=Object.freeze({__proto__:null,RequestHeaderSection:J}),Z={cssText:`.header{background-color:var(--sys-color-surface1);border-bottom:1px solid var(--sys-color-divider);border-top:1px solid var(--sys-color-divider);line-height:25px;padding:0 5px}.header::marker{font-size:11px;line-height:1}.header:focus{background-color:var(--sys-color-state-header-hover)}details[open] .header-count{display:none}details .hide-when-closed{display:none}details[open] .hide-when-closed{display:block}details summary input{vertical-align:middle}.row{display:flex;line-height:18px;padding-left:8px;gap:var(--sys-size-6);user-select:text;margin:var(--sys-size-3) 0}div.raw-headers-row{display:block}.row:first-of-type{margin-top:var(--sys-size-5)}.row:last-child{margin-bottom:var(--sys-size-5)}.header-name{color:var(--sys-color-on-surface-subtle);font:var(--sys-typescale-body5-medium);width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize}.header-value{word-break:break-all;display:flex;align-items:center;gap:2px;font:var(--sys-typescale-body4-regular)}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.green-circle::before,\n.red-circle::before,\n.yellow-circle::before{content:"";display:inline-block;width:12px;height:12px;border-radius:6px;vertical-align:text-top;margin-right:2px}.green-circle::before{background-color:var(--sys-color-green-bright)}.red-circle::before{background-color:var(--sys-color-error-bright)}.yellow-circle::before{background-color:var(--issue-color-yellow)}.status-with-comment{color:var(--sys-color-token-subtle)}.raw-headers{font-family:var(--source-code-font-family);font-size:var(--source-code-font-size);white-space:pre-wrap;word-break:break-all}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.inline-icon{vertical-align:middle}.header-grid-container{display:inline-grid;grid-template-columns:156px 50px 1fr;grid-gap:4px;width:calc(100% - 15px)}.header-grid-container div:last-child{text-align:right}.header .devtools-link{color:var(--sys-color-on-surface)}x-link{position:relative}x-link .inline-icon{padding-right:3px}.purple.dot::before{background-color:var(--sys-color-purple-bright);content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-toolbar);left:9px;position:absolute;top:11px;z-index:1}summary label{display:inline-flex;align-items:center;vertical-align:middle;gap:var(--sys-size-3)}summary label input[type="checkbox"]{margin-top:1px}\n/*# sourceURL=${import.meta.resolve("./RequestHeadersView.css")} */\n`},ee={cssText:`:host{display:block}devtools-header-section-row:last-of-type{margin-bottom:var(--sys-size-5)}devtools-header-section-row:first-of-type{margin-top:var(--sys-size-5)}.add-header-button{margin:-4px 0 10px 5px}\n/*# sourceURL=${import.meta.resolve("./ResponseHeaderSection.css")} */\n`};const te=new CSSStyleSheet;te.replaceSync(ee.cssText);const re={addHeader:"Add header",chooseThisOptionIfTheResourceAnd:"Choose this option if the resource and the document are served from the same site.",onlyChooseThisOptionIfAn:"Only choose this option if an arbitrary website including this resource does not impose a security risk.",thisDocumentWasBlockedFrom:"The document was blocked from loading in a popup opened by a sandboxed iframe because this document specified a cross-origin opener policy.",toEmbedThisFrameInYourDocument:"To embed this frame in your document, the response needs to enable the cross-origin embedder policy by specifying the following response header:",toUseThisResourceFromADifferent:"To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:",toUseThisResourceFromADifferentOrigin:"To use this resource from a different origin, the server may relax the cross-origin resource policy response header:",toUseThisResourceFromADifferentSite:"To use this resource from a different site, the server may relax the cross-origin resource policy response header:"},se=d.i18n.registerUIStrings("panels/network/components/ResponseHeaderSection.ts",re),oe=d.i18n.getLocalizedString.bind(void 0,se),ie=d.i18n.getLazilyComputedLocalizedString.bind(void 0,se),ae="ResponseHeaderSection";class ne extends HTMLElement{shadow=this.attachShadow({mode:"open"});headerDetails=[];connectedCallback(){this.shadow.adoptedStyleSheets=[te]}setHeaders(e){e.sort((function(e,t){return l.StringUtilities.compare(e.name.toLowerCase(),t.name.toLowerCase())})),this.headerDetails=e.map((e=>({name:l.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})))}highlightHeaders(e){"Response"===e.toReveal?.section&&this.headerDetails.filter((t=>A(t.name,e.toReveal?.header?.toLowerCase()))).forEach((e=>{e.highlight=!0}))}}class de extends ne{#E;set data(e){this.#E=e.request,this.setHeaders(this.#E.earlyHintsHeaders),this.highlightHeaders(e),this.#r()}#r(){this.#E&&r(s`
      ${this.headerDetails.map((e=>s`
        <devtools-header-section-row .data=${{header:e}}></devtools-header-section-row>
      `))}
    `,this.shadow,{host:this})}}customElements.define("devtools-early-hints-header-section",de);class le extends ne{#E;#q=[];#C=null;#T=[];#N=0;set data(e){this.#E=e.request,this.#N=p.NetworkPersistenceManager.NetworkPersistenceManager.isForbiddenNetworkUrl(this.#E.url())?2:0;const t=this.#E.sortedResponseHeaders.concat(this.#E.setCookieHeaders);this.setHeaders(t);const r=[];if(this.#E.wasBlocked()){const e=he.get(this.#E.blockedReason());if(e){if(y.RelatedIssue.hasIssueOfCategory(this.#E,"CrossOriginEmbedderPolicy")){const t=()=>{n.userMetrics.issuesPanelOpenedFrom(1),this.#E&&y.RelatedIssue.reveal(this.#E,"CrossOriginEmbedderPolicy")};e.blockedDetails&&(e.blockedDetails.reveal=t)}r.push(e)}}this.headerDetails=function(e,t){let r=0,s=0;const o=[];for(;r<e.length&&s<t.length;)e[r].name<t[s].name?o.push({...e[r++],headerNotSet:!1}):e[r].name>t[s].name?o.push({...t[s++],headerNotSet:!0}):o.push({...t[s++],...e[r++],headerNotSet:!1});for(;r<e.length;)o.push({...e[r++],headerNotSet:!1});for(;s<t.length;)o.push({...t[s++],headerNotSet:!0});return o}(this.headerDetails,r);const s=this.#E.blockedResponseCookies(),o=new Map(s?.map((e=>[e.cookieLine.replace(/\s/g," "),e.blockedReasons])));for(const e of this.headerDetails)if("set-cookie"===e.name&&e.value){const t=o.get(e.value);t&&(e.setCookieBlockedReasons=t)}this.highlightHeaders(e);const i=this.#E.getAssociatedData(ae);i?this.#q=i:(this.#q=this.headerDetails.map((e=>({name:e.name,value:e.value,originalValue:e.value,valueEditable:this.#N}))),this.#O()),this.#A(),this.#E.setAssociatedData(ae,this.#q),this.#r()}#D(){this.#E&&(this.#N=p.NetworkPersistenceManager.NetworkPersistenceManager.isForbiddenNetworkUrl(this.#E.url())?2:0,this.#q=this.headerDetails.map((e=>({name:e.name,value:e.value,originalValue:e.value,valueEditable:this.#N}))),this.#O(),this.#E.setAssociatedData(ae,this.#q))}async#A(){if(this.#E){if(this.#C=p.NetworkPersistenceManager.NetworkPersistenceManager.instance().getHeadersUISourceCodeFromUrl(this.#E.url()),!this.#C)return this.#D(),void this.#r();try{const e=await this.#C.requestContent();if(this.#T=JSON.parse(e.content||"[]"),!this.#T.every(p.NetworkPersistenceManager.isHeaderOverride))throw new Error("Type mismatch after parsing");u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").get()&&0===this.#N&&(this.#N=1);for(const e of this.#q)e.valueEditable=this.#N}catch{console.error("Failed to parse",this.#C?.url()||"source code file","for locally overriding headers."),this.#D()}finally{this.#r()}}}#O(){if(!this.#E||0===this.#E.originalResponseHeaders.length)return;const e=this.#E.originalResponseHeaders.map((e=>({name:l.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})));e.sort((function(e,t){return l.StringUtilities.compare(e.name,t.name)}));let t=0,r=0;for(;t<this.headerDetails.length;){const s=this.headerDetails[t].name;let o=this.headerDetails[t].value||"";const i=this.headerDetails[t].headerNotSet;for(;t<this.headerDetails.length-1&&this.headerDetails[t+1].name===s;)t++,o+=`, ${this.headerDetails[t].value}`;for(;r<e.length&&e[r].name<s;)r++;if(r<e.length&&e[r].name===s){let t=e[r].value;for(;r<e.length-1&&e[r+1].name===s;)r++,t+=`, ${e[r].value}`;r++,"set-cookie"===s||i||A(o,t)||this.#q.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}))}else"set-cookie"===s||i||this.#q.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}));t++}this.#q.filter((e=>"set-cookie"===e.name)).forEach((e=>{void 0===this.#E?.originalResponseHeaders.find((t=>"set-cookie"===l.StringUtilities.toLowerCaseString(t.name)&&A(t.value,e.value)))&&(e.isOverride=!0)}))}#L(e){const t=e.target;if(void 0===t.dataset.index)return;const r=Number(t.dataset.index);O(e.headerName)&&(this.#I(e.headerName,e.headerValue,r),n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideHeaderEdited))}#U(e){const t=p.NetworkPersistenceManager.NetworkPersistenceManager.instance().rawPathFromUrl(e,!0),r=t.lastIndexOf("/");return u.ParsedURL.ParsedURL.substring(t,r+1)}#V(){this.#C?.setWorkingCopy(JSON.stringify(this.#T,null,2)),this.#C?.commitWorkingCopy()}#_(e,t,r){for(let s=this.#T.length-1;s>=0;s--){const o=this.#T[s];if(o.applyTo!==e)continue;const i=o.headers.findIndex((e=>A(e.name,t)&&A(e.value,r)));if(!(i<0))return o.headers.splice(i,1),void(0===o.headers.length&&this.#T.splice(s,1))}}#M(e){const t=e.target;if(void 0===t.dataset.index||!this.#E)return;const r=Number(t.dataset.index),s=this.#U(this.#E.url());this.#_(s,e.headerName,e.headerValue),this.#V(),this.#q[r].isDeleted=!0,this.#r(),n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideHeaderRemoved)}#I(e,t,r){if(!this.#E)return;0===this.#E.originalResponseHeaders.length&&(this.#E.originalResponseHeaders=this.#E.sortedResponseHeaders.map((e=>({...e}))));const s=this.#q[r].name,o=this.#q[r].value;this.#q[r].name=e,this.#q[r].value=t;let i=[];"set-cookie"===e?i.push({name:e,value:t,valueEditable:this.#N}):i=this.#q.filter((t=>A(t.name,e)&&(!A(t.value,t.originalValue)||t.isOverride)));const a=this.#U(this.#E.url());let n=null;const[d]=this.#T.slice(-1);if(d?.applyTo===a?n=d:(n={applyTo:a,headers:[]},this.#T.push(n)),"set-cookie"===e){const e=n.headers.findIndex((e=>A(e.name,s)&&A(e.value,o)));e>=0&&n.headers.splice(e,1)}else n.headers=n.headers.filter((t=>!A(t.name,e)));if(!A(this.#q[r].name,s))for(let e=0;e<n.headers.length;++e)if(A(n.headers[e].name,s)&&A(n.headers[e].value,o)){n.headers.splice(e,1);break}for(const e of i)n.headers.push({name:e.name,value:e.value||""});0===n.headers.length&&this.#T.pop(),this.#V()}#F(){this.#q.push({name:l.StringUtilities.toLowerCaseString(d.i18n.lockedString("header-name")),value:d.i18n.lockedString("header value"),isOverride:!0,nameEditable:!0,valueEditable:1});const e=this.#q.length-1;this.#I(this.#q[e].name,this.#q[e].value||"",e),this.#r();const t=this.shadow.querySelectorAll("devtools-header-section-row"),[r]=Array.from(t).slice(-1);r?.focus(),n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideHeaderAdded)}#r(){if(!this.#E)return;const e=this.#q.map(((e,t)=>({...this.headerDetails[t],...e,isResponseHeader:!0})));r(s`
      ${e.map(((e,t)=>s`
        <devtools-header-section-row
            .data=${{header:e}}
            @headeredited=${this.#L}
            @headerremoved=${this.#M}
            @enableheaderediting=${this.#P}
            data-index=${t}
            jslog=${i.item("response-header")}
        ></devtools-header-section-row>
      `))}
      ${1===this.#N?s`
        <devtools-button
          class="add-header-button"
          .variant=${"outlined"}
          .iconName=${"plus"}
          @click=${this.#F}
          jslog=${i.action("add-header").track({click:!0})}>
          ${oe(re.addHeader)}
        </devtools-button>
      `:o}
    `,this.shadow,{host:this})}async#P(){if(!this.#E)return;n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideEnableEditingClicked);const e=this.#E.url(),t=p.NetworkPersistenceManager.NetworkPersistenceManager.instance();t.project()?(u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").set(!0),await t.getOrCreateHeadersUISourceCodeFromUrl(e)):a.InspectorView.InspectorView.instance().displaySelectOverrideFolderInfobar((async()=>{await w.SourcesNavigator.OverridesNavigatorView.instance().setupNewWorkspace(),await t.getOrCreateHeadersUISourceCodeFromUrl(e)}))}}customElements.define("devtools-response-header-section",le);const he=new Map([["coep-frame-resource-needs-coep-header",{name:l.StringUtilities.toLowerCaseString("cross-origin-embedder-policy"),value:null,blockedDetails:{explanation:ie(re.toEmbedThisFrameInYourDocument),examples:[{codeSnippet:"Cross-Origin-Embedder-Policy: require-corp",comment:void 0}],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-origin-after-defaulted-to-same-origin-by-coep",{name:l.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,blockedDetails:{explanation:ie(re.toUseThisResourceFromADifferent),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:ie(re.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:ie(re.onlyChooseThisOptionIfAn)}],link:{url:"https://web.dev/coop-coep/"}}}],["coop-sandboxed-iframe-cannot-navigate-to-coop-page",{name:l.StringUtilities.toLowerCaseString("cross-origin-opener-policy"),value:null,headerValueIncorrect:!1,blockedDetails:{explanation:ie(re.thisDocumentWasBlockedFrom),examples:[],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-site",{name:l.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:ie(re.toUseThisResourceFromADifferentSite),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:ie(re.onlyChooseThisOptionIfAn)}],link:null}}],["corp-not-same-origin",{name:l.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:ie(re.toUseThisResourceFromADifferentOrigin),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:ie(re.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:ie(re.onlyChooseThisOptionIfAn)}],link:null}}]]);var ce=Object.freeze({__proto__:null,EarlyHintsHeaderSection:de,RESPONSE_HEADER_SECTION_DATA_KEY:ae,ResponseHeaderSection:le});const ue=new CSSStyleSheet;ue.replaceSync(Z.cssText);const{render:pe,html:ve}=t,me={fromDiskCache:"(from disk cache)",fromMemoryCache:"(from memory cache)",fromEarlyHints:"(from early hints)",fromPrefetchCache:"(from prefetch cache)",fromServiceWorker:"(from `service worker`)",fromSignedexchange:"(from signed-exchange)",fromWebBundle:"(from Web Bundle)",general:"General",raw:"Raw",referrerPolicy:"Referrer Policy",remoteAddress:"Remote Address",requestHeaders:"Request Headers",requestMethod:"Request Method",requestUrl:"Request URL",responseHeaders:"Response Headers",earlyHintsHeaders:"Early Hints Headers",revealHeaderOverrides:"Reveal header override definitions",showMore:"Show more",statusCode:"Status Code"},ge=d.i18n.registerUIStrings("panels/network/components/RequestHeadersView.ts",me),fe=d.i18n.getLocalizedString.bind(void 0,ge);class we extends g.LegacyWrapper.WrappableComponent{#E;#e=this.attachShadow({mode:"open"});#j=!1;#z=!1;#W=!1;#B=!1;#G=void 0;#K=v.Workspace.WorkspaceImpl.instance();constructor(e){super(),this.#E=e,this.setAttribute("jslog",`${i.pane("headers").track({resize:!0})}`)}wasShown(){this.#E.addEventListener(h.NetworkRequest.Events.REMOTE_ADDRESS_CHANGED,this.#X,this),this.#E.addEventListener(h.NetworkRequest.Events.FINISHED_LOADING,this.#X,this),this.#E.addEventListener(h.NetworkRequest.Events.REQUEST_HEADERS_CHANGED,this.#X,this),this.#E.addEventListener(h.NetworkRequest.Events.RESPONSE_HEADERS_CHANGED,this.#Y,this),this.#G=void 0,this.#X()}willHide(){this.#E.removeEventListener(h.NetworkRequest.Events.REMOTE_ADDRESS_CHANGED,this.#X,this),this.#E.removeEventListener(h.NetworkRequest.Events.FINISHED_LOADING,this.#X,this),this.#E.removeEventListener(h.NetworkRequest.Events.REQUEST_HEADERS_CHANGED,this.#X,this),this.#E.removeEventListener(h.NetworkRequest.Events.RESPONSE_HEADERS_CHANGED,this.#Y,this)}#Y(){this.#E.deleteAssociatedData(ae),this.render()}#X(){this.render()}revealHeader(e,t){this.#G={section:e,header:t},this.render()}connectedCallback(){this.#e.adoptedStyleSheets=[ue],this.#K.addEventListener(v.Workspace.Events.UISourceCodeAdded,this.#J,this),this.#K.addEventListener(v.Workspace.Events.UISourceCodeRemoved,this.#J,this),u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").addChangeListener(this.render,this)}disconnectedCallback(){this.#K.removeEventListener(v.Workspace.Events.UISourceCodeAdded,this.#J,this),this.#K.removeEventListener(v.Workspace.Events.UISourceCodeRemoved,this.#J,this),u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").removeChangeListener(this.render,this)}#J(e){this.#Q()===e.data.url()&&this.render()}async render(){if(this.#E)return await f.write((()=>{pe(ve`
        ${this.#Z()}
        ${this.#ee()}
        ${this.#te()}
        ${this.#re()}
      `,this.#e,{host:this})}))}#ee(){if(!this.#E||!this.#E.earlyHintsHeaders||0===this.#E.earlyHintsHeaders.length)return t.nothing;return ve`
      <devtools-request-headers-category
        @togglerawevent=${()=>{this.#j=!this.#j,this.render()}}
        .data=${{name:"early-hints-headers",title:fe(me.earlyHintsHeaders),headerCount:this.#E.earlyHintsHeaders.length,checked:void 0,additionalContent:void 0,forceOpen:"EarlyHints"===this.#G?.section,loggingContext:"early-hints-headers"}}
        aria-label=${fe(me.earlyHintsHeaders)}
      >
        ${this.#j?this.#se(this.#E.responseHeadersText,!0):ve`
          <devtools-early-hints-header-section .data=${{request:this.#E,toReveal:this.#G}}></devtools-early-hints-header-section>
        `}
      </devtools-request-headers-category>
    `}#te(){if(!this.#E)return t.nothing;return ve`
      <devtools-request-headers-category
        @togglerawevent=${()=>{this.#j=!this.#j,this.render()}}
        .data=${{name:"response-headers",title:fe(me.responseHeaders),headerCount:this.#E.sortedResponseHeaders.length,checked:this.#E.responseHeadersText?this.#j:void 0,additionalContent:this.#oe(),forceOpen:"Response"===this.#G?.section,loggingContext:"response-headers"}}
        aria-label=${fe(me.responseHeaders)}
      >
        ${this.#j?this.#se(this.#E.responseHeadersText,!0):ve`
          <devtools-response-header-section .data=${{request:this.#E,toReveal:this.#G}} jslog=${i.section("response-headers")}></devtools-response-header-section>
        `}
      </devtools-request-headers-category>
    `}#oe(){if(!this.#K.uiSourceCodeForURL(this.#Q()))return t.nothing;const e=u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled"),r=ve`
      <devtools-icon class=${e.get()?"inline-icon dot purple":"inline-icon"} .data=${{iconName:"document",width:"16px",height:"16px"}}>
      </devtools-icon>`;return ve`
      <x-link
          href="https://goo.gle/devtools-override"
          class="link devtools-link"
          jslog=${i.link("devtools-override").track({click:!0})}
      >
        <devtools-icon class="inline-icon" .data=${{iconName:"help",width:"16px",height:"16px"}}>
        </devtools-icon
      ></x-link>
      <x-link
          @click=${e=>{e.preventDefault();const t=this.#K.uiSourceCodeForURL(this.#Q());t&&(w.SourcesPanel.SourcesPanel.instance().showUISourceCode(t),w.SourcesPanel.SourcesPanel.instance().revealInNavigator(t))}}
          class="link devtools-link"
          title=${me.revealHeaderOverrides}
          jslog=${i.link("reveal-header-overrides").track({click:!0})}
      >
        ${r}${p.NetworkPersistenceManager.HEADERS_FILENAME}
      </x-link>
    `}#Q(){if(!this.#E)return l.DevToolsPath.EmptyUrlString;const e=p.NetworkPersistenceManager.NetworkPersistenceManager.instance().fileUrlFromNetworkUrl(this.#E.url(),!0);return e.substring(0,e.lastIndexOf("/"))+"/"+p.NetworkPersistenceManager.HEADERS_FILENAME}#re(){if(!this.#E)return t.nothing;const e=this.#E.requestHeadersText();return ve`
      <devtools-request-headers-category
        @togglerawevent=${()=>{this.#z=!this.#z,this.render()}}
        .data=${{name:"request-headers",title:fe(me.requestHeaders),headerCount:this.#E.requestHeaders().length,checked:e?this.#z:void 0,forceOpen:"Request"===this.#G?.section,loggingContext:"request-headers"}}
        aria-label=${fe(me.requestHeaders)}
      >
        ${this.#z&&e?this.#se(e,!1):ve`
          <devtools-request-header-section .data=${{request:this.#E,toReveal:this.#G}} jslog=${i.section("request-headers")}></devtools-request-header-section>
        `}
      </devtools-request-headers-category>
    `}#se(r,s){const o=r.trim(),n=!(s?this.#W:this.#B)&&o.length>3e3,d=()=>{s?this.#W=!0:this.#B=!0,this.render()},l=e=>{if(!(s?this.#W:this.#B)){const t=new a.ContextMenu.ContextMenu(e);t.newSection().appendItem(fe(me.showMore),d,{jslogContext:"show-more"}),t.show()}};return ve`
      <div class="row raw-headers-row" on-render=${e.Directives.nodeRenderedCallback((e=>{n&&e.addEventListener("contextmenu",l)}))}>
        <div class="raw-headers">${n?o.substring(0,3e3):o}</div>
        ${n?ve`
          <devtools-button
            .size=${"SMALL"}
            .variant=${"outlined"}
            @click=${d}
            jslog=${i.action("raw-headers-show-more").track({click:!0})}
          >${fe(me.showMore)}</devtools-button>
        `:t.nothing}
      </div>
    `}#Z(){if(!this.#E)return t.nothing;const e=["status"];this.#E.statusCode<300||304===this.#E.statusCode?e.push("green-circle"):this.#E.statusCode<400?e.push("yellow-circle"):e.push("red-circle");let r="";this.#E.cachedInMemory()?r=fe(me.fromMemoryCache):this.#E.fromEarlyHints()?r=fe(me.fromEarlyHints):this.#E.fetchedViaServiceWorker?r=fe(me.fromServiceWorker):this.#E.redirectSourceSignedExchangeInfoHasNoErrors()?r=fe(me.fromSignedexchange):this.#E.webBundleInnerRequestInfo()?r=fe(me.fromWebBundle):this.#E.fromPrefetchCache()?r=fe(me.fromPrefetchCache):this.#E.cached()&&(r=fe(me.fromDiskCache)),r&&e.push("status-with-comment");const s=[this.#E.statusCode,this.#E.getInferredStatusText(),r].join(" ");return ve`
      <devtools-request-headers-category
        .data=${{name:"general",title:fe(me.general),forceOpen:"General"===this.#G?.section,loggingContext:"general"}}
        aria-label=${fe(me.general)}
      >
      <div jslog=${i.section("general")}>
        ${this.#ie(fe(me.requestUrl),this.#E.url())}
        ${this.#E.statusCode?this.#ie(fe(me.requestMethod),this.#E.requestMethod):t.nothing}
        ${this.#E.statusCode?this.#ie(fe(me.statusCode),s,e):t.nothing}
        ${this.#E.remoteAddress()?this.#ie(fe(me.remoteAddress),this.#E.remoteAddress()):t.nothing}
        ${this.#E.referrerPolicy()?this.#ie(fe(me.referrerPolicy),String(this.#E.referrerPolicy())):t.nothing}
      </div>
      </devtools-request-headers-category>
    `}#ie(e,t,r){const s="General"===this.#G?.section&&e.toLowerCase()===this.#G?.header?.toLowerCase();return ve`
      <div class="row ${s?"header-highlight":""}">
        <div class="header-name">${e}</div>
        <div
          class="header-value ${r?.join(" ")}"
          @copy=${()=>n.userMetrics.actionTaken(n.UserMetrics.Action.NetworkPanelCopyValue)}
        >${t}</div>
      </div>
    `}}class ye extends Event{static eventName="togglerawevent";constructor(){super(ye.eventName,{})}}class be extends HTMLElement{#e=this.attachShadow({mode:"open"});#ae;#ne=u.UIString.LocalizedEmptyString;#de=void 0;#le=void 0;#he=void 0;#ce=void 0;#ue="";connectedCallback(){this.#e.adoptedStyleSheets=[ue,m.checkboxStyles]}set data(e){this.#ne=e.title,this.#ae=u.Settings.Settings.instance().createSetting("request-info-"+e.name+"-category-expanded",!0),this.#de=e.headerCount,this.#le=e.checked,this.#he=e.additionalContent,this.#ce=e.forceOpen,this.#ue=e.loggingContext,this.#r()}#pe(){this.dispatchEvent(new ye)}#r(){const e=!this.#ae||this.#ae.get()||this.#ce;pe(ve`
      <details ?open=${e} @toggle=${this.#ve}>
        <summary
          class="header"
          @keydown=${this.#me}
          jslog=${i.sectionHeader().track({click:!0}).context(this.#ue)}
        >
          <div class="header-grid-container">
            <div>
              ${this.#ne}${void 0!==this.#de?ve`<span class="header-count"> (${this.#de})</span>`:t.nothing}
            </div>
            <div class="hide-when-closed">
              ${void 0!==this.#le?ve`
                <label><input
                    type="checkbox"
                    .checked=${this.#le}
                    @change=${this.#pe}
                    jslog=${i.toggle("raw-headers").track({change:!0})}
                />${fe(me.raw)}</label>
              `:t.nothing}
            </div>
            <div class="hide-when-closed">${this.#he}</div>
          </div>
        </summary>
        <slot></slot>
      </details>
    `,this.#e,{host:this})}#me(e){if(!e.target)return;const t=e.target.parentElement;if(!t)throw new Error("<details> element is not found for a <summary> element");switch(e.key){case"ArrowLeft":t.open=!1;break;case"ArrowRight":t.open=!0}}#ve(e){this.#ae?.set(e.target.open)}}customElements.define("devtools-request-headers",we),customElements.define("devtools-request-headers-category",be);var ke=Object.freeze({__proto__:null,Category:be,RequestHeadersView:we,ToggleRawHeadersEvent:ye}),xe={cssText:`.code{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.issuers-list{display:flex;flex-direction:column;list-style-type:none;padding:0;margin:0}.status-icon{margin:0 0.3em 2px 0;vertical-align:middle}\n/*# sourceURL=${import.meta.resolve("./RequestTrustTokensView.css")} */\n`};const Se=new CSSStyleSheet;Se.replaceSync(xe.cssText);const{html:Re}=t,Ee={parameters:"Parameters",type:"Type",refreshPolicy:"Refresh policy",issuers:"Issuers",topLevelOrigin:"Top level origin",issuer:"Issuer",result:"Result",status:"Status",numberOfIssuedTokens:"Number of issued tokens",success:"Success",failure:"Failure",theOperationsResultWasServedFrom:"The operations result was served from cache.",theOperationWasFulfilledLocally:"The operation was fulfilled locally, no request was sent.",theKeysForThisPSTIssuerAreUnavailable:"The keys for this PST issuer are unavailable. The issuer may need to be registered via the Chrome registration process.",aClientprovidedArgumentWas:"A client-provided argument was malformed or otherwise invalid.",eitherNoInputsForThisOperation:"Either no inputs for this operation are available or the output exceeds the operations quota.",theServersResponseWasMalformedOr:"The servers response was malformed or otherwise invalid.",theOperationFailedForAnUnknown:"The operation failed for an unknown reason.",perSiteLimit:"Per-site issuer limit reached."},He=d.i18n.registerUIStrings("panels/network/components/RequestTrustTokensView.ts",Ee),$e=d.i18n.getLocalizedString.bind(void 0,He);class qe extends g.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#E;constructor(e){super(),this.#E=e}wasShown(){this.#E.addEventListener(h.NetworkRequest.Events.TRUST_TOKEN_RESULT_ADDED,this.render,this),this.render()}willHide(){this.#E.removeEventListener(h.NetworkRequest.Events.TRUST_TOKEN_RESULT_ADDED,this.render,this)}connectedCallback(){this.#e.adoptedStyleSheets=[Se]}async render(){if(!this.#E)throw new Error("Trying to render a Trust Token report without providing data");t.render(Re`<devtools-report>
        ${this.#ge()}
        ${this.#fe()}
      </devtools-report>
    `,this.#e,{host:this})}#ge(){const e=this.#E.trustTokenParams();return e?Re`
      <devtools-report-section-header jslog=${i.pane("trust-tokens").track({resize:!0})}>${$e(Ee.parameters)}</devtools-report-section-header>
      ${Ae($e(Ee.type),e.operation.toString())}
      ${this.#we(e)}
      ${this.#ye(e)}
      ${this.#be()}
      <devtools-report-divider></devtools-report-divider>
    `:t.nothing}#we(e){return"Redemption"!==e.operation?t.nothing:Ae($e(Ee.refreshPolicy),e.refreshPolicy.toString())}#ye(e){return e.issuers&&0!==e.issuers.length?Re`
      <devtools-report-key>${$e(Ee.issuers)}</devtools-report-key>
      <devtools-report-value>
        <ul class="issuers-list">
          ${e.issuers.map((e=>Re`<li>${e}</li>`))}
        </ul>
      </devtools-report-value>
    `:t.nothing}#be(){const e=this.#E.trustTokenOperationDoneEvent();return e?Re`
      ${Oe($e(Ee.topLevelOrigin),e.topLevelOrigin)}
      ${Oe($e(Ee.issuer),e.issuerOrigin)}`:t.nothing}#fe(){const e=this.#E.trustTokenOperationDoneEvent();return e?Re`
      <devtools-report-section-header>${$e(Ee.result)}</devtools-report-section-header>
      <devtools-report-key>${$e(Ee.status)}</devtools-report-key>
      <devtools-report-value>
        <span>
          <devtools-icon class="status-icon"
            .data=${r=e.status,Ne(r)?Ce:Te}>
          </devtools-icon>
          <strong>${function(e){return Ne(e)?$e(Ee.success):$e(Ee.failure)}(e.status)}</strong>
          ${function(e){switch(e){case"Ok":return null;case"AlreadyExists":return $e(Ee.theOperationsResultWasServedFrom);case"FulfilledLocally":return $e(Ee.theOperationWasFulfilledLocally);case"InvalidArgument":return $e(Ee.aClientprovidedArgumentWas);case"ResourceExhausted":return $e(Ee.eitherNoInputsForThisOperation);case"BadResponse":return $e(Ee.theServersResponseWasMalformedOr);case"MissingIssuerKeys":return $e(Ee.theKeysForThisPSTIssuerAreUnavailable);case"FailedPrecondition":case"ResourceLimited":case"InternalError":case"Unauthorized":case"UnknownError":return $e(Ee.theOperationFailedForAnUnknown);case"SiteIssuerLimit":return $e(Ee.perSiteLimit)}}(e.status)}
        </span>
      </devtools-report-value>
      ${this.#ke(e)}
      <devtools-report-divider></devtools-report-divider>
      `:t.nothing;var r}#ke(e){return"Issuance"!==e.type?t.nothing:Oe($e(Ee.numberOfIssuedTokens),e.issuedTokenCount)}}const Ce={color:"var(--icon-checkmark-green)",iconName:"check-circle",width:"16px",height:"16px"},Te={color:"var(--icon-error)",iconName:"cross-circle-filled",width:"16px",height:"16px"};function Ne(e){return"Ok"===e||"AlreadyExists"===e||"FulfilledLocally"===e}function Oe(e,r){return void 0===r?t.nothing:Re`
    <devtools-report-key>${e}</devtools-report-key>
    <devtools-report-value>${r}</devtools-report-value>
  `}function Ae(e,t){return Re`
    <devtools-report-key>${e}</devtools-report-key>
    <devtools-report-value class="code">${t}</devtools-report-value>
  `}customElements.define("devtools-trust-token-report",qe);var De=Object.freeze({__proto__:null,RequestTrustTokensView:qe,statusConsideredSuccess:Ne}),Le={cssText:`:host{--icon-padding:4px;display:flex;flex-direction:column;height:100%}.header{display:flex;font-weight:bold;padding:calc(2 * var(--icon-padding)) var(--icon-padding);line-height:20px}.icon{margin:0 var(--icon-padding)}devtools-data-grid{height:100%}\n/*# sourceURL=${import.meta.resolve("./WebBundleInfoView.css")} */\n`};const Ie=new CSSStyleSheet;Ie.replaceSync(Le.cssText);const{mimeFromURL:Ue,fromMimeTypeOverride:Ve,fromMimeType:_e}=u.ResourceType.ResourceType,{iconDataForResourceType:Me}=b,Fe={bundledResource:"Bundled resource"},Pe=d.i18n.registerUIStrings("panels/network/components/WebBundleInfoView.ts",Fe),je=d.i18n.getLocalizedString.bind(void 0,Pe);class ze extends g.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#xe;#Se;constructor(e){super();const t=e.webBundleInfo();if(!t)throw new Error("Trying to render a Web Bundle info without providing data");this.#xe=t,this.#Se=e.parsedURL.lastPathComponent,this.setAttribute("jslog",`${i.pane("webbundle").track({resize:!0})}`)}connectedCallback(){this.#e.adoptedStyleSheets=[Ie]}async render(){r(s`
      <div class="header">
        <devtools-icon class="icon"
          .data=${{color:"var(--icon-default)",iconName:"bundle",width:"20px"}}>
        </devtools-icon>
        <span>${this.#Se}</span>
        <x-link href="https://web.dev/web-bundles/#explaining-web-bundles"
          jslog=${i.link("webbundle-explainer").track({click:!0})}>
          <devtools-icon class="icon"
            .data=${{color:"var(--icon-default)",iconName:"help",width:"16px"}}>
          </devtools-icon>
        </x-link>
      </div>
      <devtools-data-grid striped>
        <table>
          <tr><th id="url">${je(Fe.bundledResource)}</th></tr>
          ${this.#xe.resourceUrls?.map((e=>{const t=Ue(e)||null,r=Ve(t)||_e(t),o=Me(r);return s`<tr><td>
                <div style="display: flex;">
                  <devtools-icon class="icon" .data=${{...o,width:"20px"}}>
                  </devtools-icon>
                  <span>${e}</span>
                </div></td></tr>`}))}
        </table>
      </devtools-data-grid>`,this.#e,{host:this})}}customElements.define("devtools-web-bundle-info",ze);var We=Object.freeze({__proto__:null,WebBundleInfoView:ze});export{R as EditableSpan,V as HeaderSectionRow,j as NetworkEventCoverageInfobar,Q as RequestHeaderSection,ke as RequestHeadersView,De as RequestTrustTokensView,ce as ResponseHeaderSection,We as WebBundleInfoView};
